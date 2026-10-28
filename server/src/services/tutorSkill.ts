import type { AuthenticatedUser } from '../security/auth.js';
import type { ExplainInput, TutorChatInput } from '../schemas/learningSchemas.js';
import { retrieveMaterialContext, type SourceReference } from './materialRetrievalService.js';
import { getLlmProvider } from './llmProvider.js';

export type GroundedTutorResult = {
  content: string;
  sourceReferences: SourceReference[];
  limitations: string[];
  status: 'complete';
};

export async function explain(input: ExplainInput | TutorChatInput, user: AuthenticatedUser, token: string): Promise<GroundedTutorResult> {
  const query = 'query' in input ? input.query : input.message;
  const context = await retrieveMaterialContext({ query, materialIds: input.materialIds, materialVersionHashes: input.materialVersionHashes }, user, token);
  const generated = await getLlmProvider().generate({ query, format: 'responseFormat' in input ? input.responseFormat ?? 'detailed' : 'conversational', context });
  return { content: generated.content, sourceReferences: context.flatMap((item) => item.passages), limitations: generated.limitations, status: 'complete' };
}
