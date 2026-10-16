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

export type TutorMessage = { id: string; role: 'user' | 'assistant'; content: string };
export type TutorChatRequest = { message: string; materialIds: string[]; context: string };
export type TutorChatResponse = { message: TutorMessage };

export const tutorApi = {
  sendMessage: async (request: TutorChatRequest): Promise<TutorChatResponse> => {
    if (process.env.EXPO_PUBLIC_TUTOR_API_ENABLED !== 'true') {
      return { message: { id: `local-${Date.now()}`, role: 'assistant', content: 'Your tutor connection is ready. Add the tutor API to start a grounded lesson.' } };
    }
    return post<TutorChatResponse>('/api/tutor/chat', request);
  },
};
