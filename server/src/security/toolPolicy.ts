import { ApiError } from '../errors/apiError.js';

const ALLOWLIST: Record<string, Set<string>> = {
  tutor: new Set(['search_user_material', 'read_material_excerpt']),
  audio: new Set(['search_user_material', 'read_material_excerpt', 'save_audio_metadata', 'generate_speech']),
  quiz: new Set(['search_user_material', 'read_material_excerpt', 'record_quiz_attempt']),
};

export function assertToolAllowed(agent: keyof typeof ALLOWLIST, tool: string): void {
  if (!ALLOWLIST[agent]?.has(tool)) throw new ApiError(403, 'TOOL_NOT_ALLOWED', `The ${agent} agent is not allowed to call this tool.`);
}
