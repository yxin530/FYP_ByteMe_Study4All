import { ApiError } from '../errors/apiError.js';

export async function sendExpoPush(messages: Array<{ to: string; title: string; body: string; data?: Record<string, unknown> }>) {
  if (!messages.length) return [];
  let response: Response;
  try {
    response = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(messages.map((message) => ({ ...message, sound: 'default' }))) });
  } catch { throw new ApiError(503, 'PUSH_PROVIDER_UNAVAILABLE', 'Expo Push Service is unavailable.'); }
  if (!response.ok) throw new ApiError(502, 'PUSH_PROVIDER_FAILED', 'Expo Push Service rejected the notification request.');
  return response.json();
}
