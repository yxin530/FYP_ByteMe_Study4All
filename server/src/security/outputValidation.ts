import { ApiError } from '../errors/apiError.js';

export function assertGroundedOutput(content: string, sourceReferences: unknown[]): void {
  if (!content.trim()) throw new ApiError(502, 'INVALID_AGENT_OUTPUT', 'The learning agent returned empty content.');
  if (!Array.isArray(sourceReferences) || sourceReferences.length === 0) throw new ApiError(502, 'MISSING_SOURCE_REFERENCES', 'The learning agent returned content without source references.');
}
