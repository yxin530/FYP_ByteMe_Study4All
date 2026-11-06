import { env } from '../config/env.js';
import { ApiError } from '../errors/apiError.js';

export type SpeechResult = { audio: Buffer; contentType: string };

export async function generateSpeech(input: { text: string; voiceId: string }): Promise<SpeechResult> {
  if (!env.elevenLabsApiKey) throw new ApiError(503, 'AUDIO_PROVIDER_NOT_CONFIGURED', 'Audio generation is not configured yet.');
  let response: Response;
  try {
    response = await fetch(`${env.elevenLabsBaseUrl}/v1/text-to-speech/${encodeURIComponent(input.voiceId)}`, {
      method: 'POST',
      headers: { accept: 'audio/mpeg', 'content-type': 'application/json', 'xi-api-key': env.elevenLabsApiKey },
      body: JSON.stringify({ text: input.text, model_id: 'eleven_multilingual_v2', output_format: 'mp3_44100_128' }),
    });
  } catch { throw new ApiError(503, 'AUDIO_PROVIDER_UNAVAILABLE', 'The audio provider is unavailable.'); }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new ApiError(response.status === 401 || response.status === 403 ? 502 : 503, 'AUDIO_PROVIDER_FAILED', 'The audio provider could not generate speech.', detail.slice(0, 500));
  }
  return { audio: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') ?? 'audio/mpeg' };
}
