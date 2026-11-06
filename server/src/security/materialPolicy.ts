const INSTRUCTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /reveal\s+(your|the)\s+(prompt|instructions|secrets)/i,
  /disregard\s+the\s+source/i,
];

export function sanitizeMaterialText(text: string): string {
  return text.split(/\r?\n/).filter((line) => !INSTRUCTION_PATTERNS.some((pattern) => pattern.test(line))).join('\n');
}

export function containsPromptInjection(text: string): boolean { return INSTRUCTION_PATTERNS.some((pattern) => pattern.test(text)); }
