import { env } from '../config/env.js';
import { ApiError } from '../errors/apiError.js';
import type { AuthenticatedUser } from '../security/auth.js';
import type { UploadBinaryInput, UploadMaterialInput } from '../schemas/materialSchemas.js';
import { extractContent } from './extractionService.js';
import { recordAuditEvent } from '../security/auditLog.js';

export interface MaterialRecord {
  id: string;
  user_id: string;
  title: string;
  subject_id?: string;
  material_type: string;
  processing_status: 'pending' | 'processing' | 'ready' | 'failed';
  version_hash?: string | null;
  storage_path?: string | null;
  extracted_text?: string | null;
  processing_error?: string | null;
  created_at: string;
  updated_at: string;
}

const BUCKET_NAME = 'learning-materials';

function requireConfig() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new ApiError(503, 'DATABASE_NOT_CONFIGURED', 'Supabase database and storage are not configured.');
  }
}

function authHeaders(token: string) {
  requireConfig();
  return {
    apikey: env.supabaseAnonKey!,
    authorization: `Bearer ${token}`,
  };
}

async function dbRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  requireConfig();
  let response: Response;
  try {
    response = await fetch(`${env.supabaseUrl!.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: {
        ...authHeaders(token),
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Supabase database service is unavailable.');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status === 404 ? 404 : 502,
      'DATABASE_REQUEST_FAILED',
      body?.message || body?.error || 'The material operation could not be completed.',
      body,
    );
  }
  return body as T;
}

/**
 * Upload binary buffer directly into Supabase Storage.
 */
async function uploadToSupabaseStorage(
  storagePath: string,
  buffer: Buffer,
  mimeType: string,
  token: string,
): Promise<void> {
  requireConfig();
  const url = `${env.supabaseUrl!.replace(/\/$/, '')}/storage/v1/object/${BUCKET_NAME}/${storagePath}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'content-type': mimeType,
        'x-upsert': 'true',
      },
      body: new Uint8Array(buffer),
    });
  } catch (err: any) {
    throw new ApiError(503, 'STORAGE_UNAVAILABLE', `Storage service unavailable: ${err?.message}`);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(
      response.status === 401 ? 401 : 502,
      'STORAGE_UPLOAD_FAILED',
      errorBody?.message || errorBody?.error || 'Failed to upload binary file to storage.',
      errorBody,
    );
  }
}

/**
 * Downloads a binary file from Supabase Storage.
 */
async function downloadFromSupabaseStorage(
  storagePath: string,
  token: string,
): Promise<Buffer> {
  requireConfig();
  const url = `${env.supabaseUrl!.replace(/\/$/, '')}/storage/v1/object/authenticated/${BUCKET_NAME}/${storagePath}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(token),
    });
  } catch (err: any) {
    throw new ApiError(503, 'STORAGE_UNAVAILABLE', `Storage service unavailable: ${err?.message}`);
  }

  if (!response.ok) {
    throw new ApiError(
      response.status === 404 ? 404 : 502,
      'STORAGE_FILE_NOT_FOUND',
      'The requested file could not be retrieved from storage.',
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Creates a signed download URL valid for the specified duration.
 */
export async function getSignedDownloadUrl(
  materialId: string,
  user: AuthenticatedUser,
  token: string,
): Promise<{ downloadUrl: string; expiresIn: number }> {
  const material = await getMaterial(materialId, user, token);
  if (!material.storage_path) {
    throw new ApiError(404, 'FILE_NOT_FOUND', 'This material does not have an associated storage file.');
  }

  requireConfig();
  const expiresIn = 3600;
  const url = `${env.supabaseUrl!.replace(/\/$/, '')}/storage/v1/object/sign/${BUCKET_NAME}/${material.storage_path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ expiresIn }),
    });
  } catch {
    throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'Storage service is unavailable.');
  }

  const body = (await response.json().catch(() => ({}))) as { signedURL?: string };
  if (!response.ok || !body.signedURL) {
    throw new ApiError(502, 'SIGNED_URL_FAILED', 'Failed to generate signed download URL.');
  }

  const fullDownloadUrl = `${env.supabaseUrl!.replace(/\/$/, '')}/storage/v1${body.signedURL}`;
  return { downloadUrl: fullDownloadUrl, expiresIn };
}

/**
 * Creates a signed upload URL for client-side direct upload.
 */
export async function getSignedUploadUrl(
  materialId: string,
  fileName: string,
  user: AuthenticatedUser,
  token: string,
): Promise<{ uploadUrl: string; storagePath: string }> {
  await getMaterial(materialId, user, token);
  const storagePath = `${user.id}/${materialId}/${fileName}`;

  requireConfig();
  const url = `${env.supabaseUrl!.replace(/\/$/, '')}/storage/v1/object/upload/sign/${BUCKET_NAME}/${storagePath}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'content-type': 'application/json',
      },
    });
  } catch {
    throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'Storage service is unavailable.');
  }

  const body = (await response.json().catch(() => ({}))) as { url?: string };
  if (!response.ok || !body.url) {
    throw new ApiError(502, 'SIGNED_URL_FAILED', 'Failed to generate signed upload URL.');
  }

  const fullUploadUrl = `${env.supabaseUrl!.replace(/\/$/, '')}/storage/v1${body.url}`;

  // Update storage_path on the material record
  await dbRequest(
    `/rest/v1/materials?id=eq.${encodeURIComponent(materialId)}&user_id=eq.${encodeURIComponent(user.id)}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ storage_path: storagePath }),
    },
  );

  return { uploadUrl: fullUploadUrl, storagePath };
}

/**
 * Uploads binary content directly to Supabase Storage and triggers extraction.
 */
export async function uploadMaterialBinary(
  materialId: string,
  input: UploadBinaryInput,
  user: AuthenticatedUser,
  token: string,
): Promise<MaterialRecord> {
  const material = await getMaterial(materialId, user, token);
  const storagePath = `${user.id}/${materialId}/${input.fileName}`;

  // 1. Transition to 'processing'
  await dbRequest(
    `/rest/v1/materials?id=eq.${encodeURIComponent(materialId)}&user_id=eq.${encodeURIComponent(user.id)}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ processing_status: 'processing', storage_path: storagePath }),
    },
  );

  try {
    const buffer = Buffer.from(input.dataBase64, 'base64');
    const mime = input.mimeType || 'application/octet-stream';

    // 2. Upload to Supabase storage
    await uploadToSupabaseStorage(storagePath, buffer, mime, token);

    // 3. Extract content format-specifically
    const normalizedType = (
      material.material_type === 'document' ? 'doc' : material.material_type
    ) as 'pdf' | 'image' | 'text' | 'doc';

    const extraction = await extractContent({
      fileType: normalizedType,
      buffer,
      fileName: input.fileName,
    });

    // 4. Transition to 'ready'
    const updatedRows = await dbRequest<MaterialRecord[]>(
      `/rest/v1/materials?id=eq.${encodeURIComponent(materialId)}&user_id=eq.${encodeURIComponent(user.id)}`,
      token,
      {
        method: 'PATCH',
        headers: { prefer: 'return=representation' },
        body: JSON.stringify({
          storage_path: storagePath,
          processing_status: 'ready',
          version_hash: extraction.versionHash,
          extracted_text: extraction.extractedText,
          processing_error: null,
        }),
      },
    );

    recordAuditEvent({
      event: 'material.uploaded_binary',
      action: 'UPLOAD_BINARY',
      actor: { id: user.id },
      resource: { type: 'material', id: materialId, version: extraction.versionHash },
      decision: 'allow',
      outcome: 'success',
      details: { fileName: input.fileName, wordCount: extraction.wordCount },
    });

    return updatedRows[0];
  } catch (err: any) {
    // Transition to 'failed'
    await dbRequest(
      `/rest/v1/materials?id=eq.${encodeURIComponent(materialId)}&user_id=eq.${encodeURIComponent(user.id)}`,
      token,
      {
        method: 'PATCH',
        body: JSON.stringify({
          processing_status: 'failed',
          processing_error: err?.message || 'Processing and extraction failed.',
        }),
      },
    );

    recordAuditEvent({
      event: 'material.upload_failed',
      action: 'UPLOAD_BINARY',
      actor: { id: user.id },
      resource: { type: 'material', id: materialId },
      decision: 'allow',
      outcome: 'failure',
      details: { error: err?.message },
    });

    throw err;
  }
}

/**
 * Explicit processing-status transition to extract or re-extract content.
 */
export async function processMaterial(
  materialId: string,
  user: AuthenticatedUser,
  token: string,
): Promise<MaterialRecord> {
  const material = await getMaterial(materialId, user, token);

  // Transition to 'processing'
  await dbRequest(
    `/rest/v1/materials?id=eq.${encodeURIComponent(materialId)}&user_id=eq.${encodeURIComponent(user.id)}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ processing_status: 'processing' }),
    },
  );

  try {
    let contentToExtract: string | undefined = material.extracted_text ?? undefined;
    let fileBuffer: Buffer | undefined;

    // If storage_path exists, download from Supabase Storage
    if (material.storage_path) {
      try {
        fileBuffer = await downloadFromSupabaseStorage(material.storage_path, token);
      } catch {
        // Fallback to text content if storage download fails
      }
    }

    const normalizedType = (
      material.material_type === 'document' ? 'doc' : material.material_type
    ) as 'pdf' | 'image' | 'text' | 'doc';

    const extraction = await extractContent({
      fileType: normalizedType,
      content: contentToExtract,
      buffer: fileBuffer,
      fileName: material.title,
    });

    // Transition to 'ready'
    const updated = await dbRequest<MaterialRecord[]>(
      `/rest/v1/materials?id=eq.${encodeURIComponent(materialId)}&user_id=eq.${encodeURIComponent(user.id)}`,
      token,
      {
        method: 'PATCH',
        headers: { prefer: 'return=representation' },
        body: JSON.stringify({
          processing_status: 'ready',
          version_hash: extraction.versionHash,
          extracted_text: extraction.extractedText,
          processing_error: null,
        }),
      },
    );

    recordAuditEvent({
      event: 'material.processed',
      action: 'PROCESS_MATERIAL',
      actor: { id: user.id },
      resource: { type: 'material', id: materialId, version: extraction.versionHash },
      decision: 'allow',
      outcome: 'success',
      details: { wordCount: extraction.wordCount, status: 'ready' },
    });

    return updated[0];
  } catch (err: any) {
    // Transition to 'failed'
    await dbRequest(
      `/rest/v1/materials?id=eq.${encodeURIComponent(materialId)}&user_id=eq.${encodeURIComponent(user.id)}`,
      token,
      {
        method: 'PATCH',
        body: JSON.stringify({
          processing_status: 'failed',
          processing_error: err?.message || 'Processing failed',
        }),
      },
    );

    recordAuditEvent({
      event: 'material.processing_failed',
      action: 'PROCESS_MATERIAL',
      actor: { id: user.id },
      resource: { type: 'material', id: materialId },
      decision: 'allow',
      outcome: 'failure',
      details: { error: err?.message },
    });

    throw err;
  }
}

/**
 * Creates a material record and performs extraction if content is provided.
 */
export async function createMaterial(
  input: UploadMaterialInput,
  user: AuthenticatedUser,
  token: string,
): Promise<MaterialRecord> {
  let extraction: { extractedText: string; versionHash: string } | null = null;

  if (input.content) {
    const normalizedType = (
      input.fileType === 'doc' ? 'doc' : input.fileType
    ) as 'pdf' | 'image' | 'text' | 'doc';

    extraction = await extractContent({
      fileType: normalizedType,
      content: input.content,
      fileName: input.fileName ?? input.title,
    });
  }

  const rows = await dbRequest<MaterialRecord[]>('/rest/v1/materials', token, {
    method: 'POST',
    headers: { prefer: 'return=representation' },
    body: JSON.stringify({
      user_id: user.id,
      title: input.title,
      subject_id: input.subject ?? 'General',
      material_type: input.fileType === 'doc' ? 'document' : input.fileType,
      processing_status: extraction ? 'ready' : 'pending',
      version_hash: extraction?.versionHash ?? null,
      extracted_text: extraction?.extractedText ?? null,
    }),
  });

  const created = rows[0];

  recordAuditEvent({
    event: 'material.created',
    action: 'CREATE_MATERIAL',
    actor: { id: user.id },
    resource: { type: 'material', id: created.id, version: created.version_hash ?? undefined },
    decision: 'allow',
    outcome: 'success',
    details: { title: input.title, type: input.fileType },
  });

  return created;
}

export function listMaterials(user: AuthenticatedUser, token: string): Promise<MaterialRecord[]> {
  return dbRequest<MaterialRecord[]>(
    `/rest/v1/materials?select=*&user_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc`,
    token,
  );
}

export function getMaterial(id: string, user: AuthenticatedUser, token: string): Promise<MaterialRecord> {
  return dbRequest<MaterialRecord[]>(
    `/rest/v1/materials?select=*&id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`,
    token,
  ).then((rows) => {
    if (!rows || rows.length === 0) {
      throw new ApiError(404, 'MATERIAL_NOT_FOUND', 'Material not found or access denied.');
    }
    return rows[0];
  });
}

export async function deleteMaterial(id: string, user: AuthenticatedUser, token: string): Promise<void> {
  const material = await getMaterial(id, user, token);

  // If storage_path exists, cleanup file in Supabase Storage
  if (material.storage_path) {
    try {
      requireConfig();
      await fetch(
        `${env.supabaseUrl!.replace(/\/$/, '')}/storage/v1/object/${BUCKET_NAME}`,
        {
          method: 'DELETE',
          headers: {
            ...authHeaders(token),
            'content-type': 'application/json',
          },
          body: JSON.stringify({ prefixes: [material.storage_path] }),
        },
      );
    } catch {
      // Storage cleanup failure does not block database record deletion
    }
  }

  await dbRequest<unknown>(
    `/rest/v1/materials?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`,
    token,
    { method: 'DELETE' },
  );

  recordAuditEvent({
    event: 'material.deleted',
    action: 'DELETE_MATERIAL',
    actor: { id: user.id },
    resource: { type: 'material', id },
    decision: 'allow',
    outcome: 'success',
  });
}
