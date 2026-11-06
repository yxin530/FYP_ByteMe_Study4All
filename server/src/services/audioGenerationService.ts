import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../errors/apiError.js';
import type { AudioGenerateInput } from '../schemas/audioSchemas.js';
import type { AuthenticatedUser } from '../security/auth.js';
import { recordAuditEvent } from '../security/auditLog.js';
import { generateSpeech } from './elevenLabsProvider.js';
import { getTranscript } from './audioTranscriptService.js';

export type AudioGenerationRecord = { id: string; user_id: string; transcript_id: string; request_text: string; transcript: string; material_ids: string[]; material_version_hashes: string[]; voice_id: string; language: string; cache_key: string; audio_status: 'pending' | 'completed' | 'failed'; storage_path?: string | null; playback_url?: string | null; duration_seconds?: number | null; error_code?: string | null; error_message?: string | null; created_at: string; updated_at: string };
const BUCKET = 'audio-generations';

function requireConfig() { if (!env.supabaseUrl || !env.supabaseAnonKey) throw new ApiError(503, 'DATABASE_NOT_CONFIGURED', 'Supabase database and storage are not configured.'); }
async function db<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  requireConfig(); let response: Response;
  try { response = await fetch(`${env.supabaseUrl!.replace(/\/$/, '')}${path}`, { ...init, headers: { apikey: env.supabaseAnonKey!, authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers ?? {}) } }); } catch { throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Supabase database service is unavailable.'); }
  const body = await response.json().catch(() => null); if (!response.ok) throw new ApiError(response.status === 404 ? 404 : 502, 'DATABASE_REQUEST_FAILED', body?.message || body?.error || 'The audio operation failed.', body); return body as T;
}
async function upload(path: string, audio: Buffer, contentType: string, token: string) {
  requireConfig(); let response: Response;
  try { response = await fetch(`${env.supabaseUrl!.replace(/\/$/, '')}/storage/v1/object/${BUCKET}/${path}`, { method: 'POST', headers: { apikey: env.supabaseAnonKey!, authorization: `Bearer ${token}`, 'content-type': contentType, 'x-upsert': 'true' }, body: new Uint8Array(audio) }); } catch { throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'Audio storage is unavailable.'); }
  if (!response.ok) throw new ApiError(502, 'AUDIO_STORAGE_FAILED', 'Generated audio could not be stored.');
}
async function signedUrl(path: string, token: string) {
  const result = await db<{ signedURL?: string }>(`/storage/v1/object/sign/${BUCKET}/${path}`, token, { method: 'POST', body: JSON.stringify({ expiresIn: 3600 }) });
  if (!result.signedURL) throw new ApiError(502, 'SIGNED_URL_FAILED', 'A playback URL could not be created.');
  return `${env.supabaseUrl!.replace(/\/$/, '')}/storage/v1${result.signedURL}`;
}
function cacheKey(input: { requestText: string; materialVersionHashes: string[]; transcript: string; voiceId: string; language: string }) { return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex'); }

export async function generateAudio(input: AudioGenerateInput, user: AuthenticatedUser, token: string): Promise<AudioGenerationRecord> {
  const transcript = await getTranscript(input.transcriptId, user, token);
  if (transcript.transcript_status !== 'approved') throw new ApiError(409, 'TRANSCRIPT_NOT_APPROVED', 'Approve the transcript before generating audio.');
  const voiceId = input.voiceId || env.elevenLabsDefaultVoiceId; const language = input.language || 'en';
  const key = cacheKey({ requestText: transcript.request_text, materialVersionHashes: transcript.material_version_hashes, transcript: transcript.transcript, voiceId, language });
  const existing = await db<AudioGenerationRecord[]>(`/rest/v1/audio_generations?user_id=eq.${encodeURIComponent(user.id)}&cache_key=eq.${encodeURIComponent(key)}&limit=1`, token);
  if (existing[0]) { if (existing[0].audio_status === 'completed' && existing[0].storage_path) existing[0].playback_url = await signedUrl(existing[0].storage_path, token); return existing[0]; }
  const id = crypto.randomUUID(); const base = { id, user_id: user.id, transcript_id: transcript.id, request_text: transcript.request_text, transcript: transcript.transcript, material_ids: transcript.material_ids, material_version_hashes: transcript.material_version_hashes, voice_id: voiceId, language, cache_key: key, audio_status: 'pending' };
  const inserted = await db<AudioGenerationRecord[]>('/rest/v1/audio_generations', token, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(base) });
  const record = inserted[0];
  try {
    const speech = await generateSpeech({ text: transcript.transcript, voiceId }); const storagePath = `${user.id}/${record.id}.mp3`; await upload(storagePath, speech.audio, speech.contentType, token); const playbackUrl = await signedUrl(storagePath, token);
    const completed = (await db<AudioGenerationRecord[]>(`/rest/v1/audio_generations?id=eq.${encodeURIComponent(record.id)}&user_id=eq.${encodeURIComponent(user.id)}`, token, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ audio_status: 'completed', storage_path: storagePath, playback_url: playbackUrl, updated_at: new Date().toISOString() }) }))[0];
    recordAuditEvent({ event: 'audio_generation', action: 'generate', actor: { id: user.id }, resource: { type: 'audio_generation', id: record.id, materialIds: transcript.material_ids, materialVersionHashes: transcript.material_version_hashes }, outcome: 'success' }); return completed;
  } catch (error) {
    const apiError = error instanceof ApiError ? error : new ApiError(503, 'AUDIO_GENERATION_FAILED', 'Audio generation failed.');
    await db(`/rest/v1/audio_generations?id=eq.${encodeURIComponent(record.id)}&user_id=eq.${encodeURIComponent(user.id)}`, token, { method: 'PATCH', body: JSON.stringify({ audio_status: 'failed', error_code: apiError.code, error_message: apiError.message, updated_at: new Date().toISOString() }) }).catch(() => undefined);
    recordAuditEvent({ event: 'audio_generation', action: 'generate', actor: { id: user.id }, resource: { type: 'audio_generation', id: record.id }, outcome: 'failure', details: { code: apiError.code } }); throw apiError;
  }
}

export async function getAudio(id: string, user: AuthenticatedUser, token: string): Promise<AudioGenerationRecord> {
  const rows = await db<AudioGenerationRecord[]>(`/rest/v1/audio_generations?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, token); if (!rows[0]) throw new ApiError(404, 'AUDIO_NOT_FOUND', 'The audio generation was not found.'); if (rows[0].storage_path) rows[0].playback_url = await signedUrl(rows[0].storage_path, token); return rows[0];
}
