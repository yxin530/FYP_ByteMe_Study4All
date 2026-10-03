const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error((await response.text()) || 'Request failed.');
  return response.json() as Promise<T>;
}

export const agentApi = {
  createAudioTranscript: (request: string, materialIds: string[]) =>
    post<{ transcript: string }>('/api/audio/transcript', { request, materialIds }),
};
