import { ApiError } from '../errors/apiError.js';
import type { AuthenticatedUser } from '../security/auth.js';
import { explain, type GroundedTutorResult } from './tutorSkill.js';

export async function routeTutorRequest(input: any, user: AuthenticatedUser, token: string): Promise<{ requestId: string; agent: 'tutor'; result: GroundedTutorResult }> {
  if (!input || (typeof input.query !== 'string' && typeof input.message !== 'string')) throw new ApiError(400, 'UNSUPPORTED_INTENT', 'The learning request could not be classified.');
  return { requestId: crypto.randomUUID(), agent: 'tutor', result: await explain(input, user, token) };
}
