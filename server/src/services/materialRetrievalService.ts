import { ApiError } from '../errors/apiError.js';
import type { AuthenticatedUser } from '../security/auth.js';
import { getMaterial } from './materialService.js';

export type SourceReference = {
  materialId: string;
  materialVersionHash: string;
  title: string;
  excerpt: string;
  start: number;
  end: number;
};

export type RetrievedMaterialContext = {
  materialId: string;
  materialVersionHash: string;
  title: string;
  passages: SourceReference[];
};

const MAX_EXCERPT_LENGTH = 1600;
const MAX_PASSAGES_PER_MATERIAL = 4;

function terms(query: string): string[] {
  return [...new Set(query.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [])];
}

function retrieve(text: string, query: string): SourceReference[] {
  const queryTerms = terms(query);
  const chunks = text.split(/\n\s*\n|(?<=[.!?])\s+/).map((value, index) => ({ value: value.trim(), index }));
  return chunks
    .filter((chunk) => chunk.value.length > 0)
    .map((chunk) => ({
      ...chunk,
      score: queryTerms.reduce((score, term) => score + (chunk.value.toLowerCase().includes(term) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, MAX_PASSAGES_PER_MATERIAL)
    .map((chunk) => ({
      materialId: '',
      materialVersionHash: '',
      title: '',
      excerpt: chunk.value.slice(0, MAX_EXCERPT_LENGTH),
      start: 0,
      end: Math.min(chunk.value.length, MAX_EXCERPT_LENGTH),
    }));
}

export async function retrieveMaterialContext(
  input: { query: string; materialIds: string[]; materialVersionHashes?: string[] },
  user: AuthenticatedUser,
  token: string,
): Promise<RetrievedMaterialContext[]> {
  const contexts: RetrievedMaterialContext[] = [];
  for (const [index, materialId] of input.materialIds.entries()) {
    const material = await getMaterial(materialId, user, token);
    if (material.processing_status !== 'ready' || !material.extracted_text?.trim() || !material.version_hash) continue;
    const requestedVersion = input.materialVersionHashes?.[index];
    if (requestedVersion && requestedVersion !== material.version_hash) {
      throw new ApiError(409, 'MATERIAL_VERSION_MISMATCH', `Material ${material.title} has changed. Refresh it and try again.`);
    }
    const passages = retrieve(material.extracted_text, input.query).map((passage) => ({
      ...passage,
      materialId: material.id,
      materialVersionHash: material.version_hash!,
      title: material.title,
    }));
    contexts.push({ materialId: material.id, materialVersionHash: material.version_hash, title: material.title, passages });
  }
  if (contexts.every((context) => context.passages.length === 0)) {
    throw new ApiError(422, 'RELEVANT_MATERIAL_REQUIRED', 'No ready material contains enough relevant information for this question. Upload or select relevant material first.');
  }
  return contexts;
}
