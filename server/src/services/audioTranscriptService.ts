import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../errors/apiError.js';
import type { AudioTranscriptInput, AudioTranscriptRevisionInput } from '../schemas/audioSchemas.js';
import type { AuthenticatedUser } from '../security/auth.js';
import { recordAuditEvent } from '../security/auditLog.js';
import { retrieveMaterialContext } from './materialRetrievalService.js';
import { getLlmProvider } from './llmProvider.js';

export type AudioTranscriptRecord = {
  id: string; user_id: string; request_text: string; transcript: string;
  transcript_status: 'draft' | 'approved'; material_ids: string[];
  material_version_hashes: string[]; source_references: unknown[];
  revision: number; created_at: string; updated_at: string;
};

function requireConfig() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) throw new ApiError(503, 'DATABASE_NOT_CONFIGURED', 'Supabase database is not configured.');
}
async function db<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  requireConfig();
  let response: Response;
  try { response = await fetch(`${env.supabaseUrl!.replace(/\/$/, '')}${path}`, { ...init, headers: { apikey: env.supabaseAnonKey!, authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers ?? {}) } }); }
  catch { throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Supabase database service is unavailable.'); }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status === 404 ? 404 : 502, 'DATABASE_REQUEST_FAILED', body?.message || body?.error || 'The audio transcript operation failed.', body);
  return body as T;
}

export async function createTranscript(input: AudioTranscriptInput, user: AuthenticatedUser, token: string): Promise<AudioTranscriptRecord> {
  const context = await retrieveMaterialContext({ query: input.requestText, materialIds: input.materialIds, materialVersionHashes: input.materialVersionHashes }, user, token);
  const generated = await getLlmProvider().generate({ query: input.requestText, format: 'audio lesson transcript', context });
  const sourceReferences = context.flatMap((item) => item.passages);
  const record = { id: crypto.randomUUID(), user_id: user.id, request_text: input.requestText, transcript: generated.content, transcript_status: 'draft', material_ids: context.map((item) => item.materialId), material_version_hashes: context.map((item) => item.materialVersionHash), source_references: sourceReferences, revision: 1 };
  const rows = await db<AudioTranscriptRecord[]>('/rest/v1/audio_transcripts', token, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(record) });
  const saved = rows[0];
  recordAuditEvent({ event: 'audio_transcript', action: 'create', actor: { id: user.id }, resource: { type: 'audio_transcript', id: saved?.id, materialIds: record.material_ids, materialVersionHashes: record.material_version_hashes }, outcome: 'success' });
  return saved;
}

export async function reviseTranscript(id: string, input: AudioTranscriptRevisionInput, user: AuthenticatedUser, token: string): Promise<AudioTranscriptRecord> {
  const existing = await getTranscript(id, user, token);
  const rows = await db<AudioTranscriptRecord[]>(`/rest/v1/audio_transcripts?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, token, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ transcript: input.transcript, transcript_status: 'draft', revision: existing.revision + 1, updated_at: new Date().toISOString() }) });
  return rows[0];
}

export async function approveTranscript(id: string, user: AuthenticatedUser, token: string): Promise<AudioTranscriptRecord> {
  const existing = await getTranscript(id, user, token);
  const rows = await db<AudioTranscriptRecord[]>(`/rest/v1/audio_transcripts?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`, token, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ transcript_status: 'approved', updated_at: new Date().toISOString() }) });
  if (!rows[0]) throw new ApiError(404, 'AUDIO_TRANSCRIPT_NOT_FOUND', 'The audio transcript was not found.');
  recordAuditEvent({ event: 'audio_transcript', action: 'approve', actor: { id: user.id }, resource: { type: 'audio_transcript', id: existing.id, materialIds: existing.material_ids, materialVersionHashes: existing.material_version_hashes }, outcome: 'success' });
  return rows[0];
}

export async function getTranscript(id: string, user: AuthenticatedUser, token: string): Promise<AudioTranscriptRecord> {
  const rows = await db<AudioTranscriptRecord[]>(`/rest/v1/audio_transcripts?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, token);
  if (!rows[0]) throw new ApiError(404, 'AUDIO_TRANSCRIPT_NOT_FOUND', 'The audio transcript was not found.');
  return rows[0];
}
