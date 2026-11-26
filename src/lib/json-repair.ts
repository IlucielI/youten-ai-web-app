/**
 * Strips markdown code fences (```json or ```) and isolates outermost JSON object brackets
 * if wrapped in surrounding prose.
 */
export function cleanMarkdownJsonString(raw: string): string {
  let trimmed = raw.trim();
  if (trimmed.startsWith('```json')) {
    trimmed = trimmed.slice(7);
  } else if (trimmed.startsWith('```')) {
    trimmed = trimmed.slice(3);
  }
  if (trimmed.endsWith('```')) {
    trimmed = trimmed.slice(0, -3);
  }
  trimmed = trimmed.trim();

  const startObj = trimmed.indexOf('{');
  if (startObj !== -1) {
    const endObj = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
    if (endObj > startObj) {
      return trimmed.slice(startObj, endObj + 1);
    }
    return trimmed.slice(startObj);
  }

  return trimmed;
}

function stripTrailingCommaFromChars(chars: string[]): void {
  let idx = chars.length - 1;
  while (idx >= 0 && /\s/.test(chars[idx])) {
    idx--;
  }
  if (idx >= 0 && chars[idx] === ',') {
    chars.splice(idx, 1);
  }
}

/**
 * Repairs common LLM JSON syntax slips such as mismatched closing brackets
 * (e.g., `]` closing `{`) and trailing commas while preserving bracket characters inside strings.
 */
export function repairJsonBrackets(input: string): string {
  const out: string[] = [];
  const stack: Array<'}' | ']'> = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inString) {
      out.push(ch);
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      out.push(ch);
      continue;
    }

    if (ch === '{') {
      stack.push('}');
      out.push(ch);
      continue;
    }

    if (ch === '[') {
      stack.push(']');
      out.push(ch);
      continue;
    }

    if (ch === '}' || ch === ']') {
      if (stack.length === 0) {
        out.push(ch);
        continue;
      }
      stripTrailingCommaFromChars(out);
      const expected = stack.pop()!;
      out.push(expected);
      continue;
    }

    out.push(ch);
  }

  if (inString) {
    if (escaped) {
      out.push('\\');
    }
    out.push('"');
  }
  while (stack.length > 0) {
    stripTrailingCommaFromChars(out);
    out.push(stack.pop()!);
  }

  return out.join('');
}

/**
 * Cleans and parses a JSON object string, automatically repairing minor LLM syntax errors
 * (such as mismatched closing brackets or trailing commas) on initial parse failure.
 */
export function repairAndParseJsonObject(raw: string): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'string') return null;

  const cleaned = cleanMarkdownJsonString(raw);
  if (!cleaned || !cleaned.includes('{')) return null;
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Attempt syntactic repair below
  }

  try {
    const repaired = repairJsonBrackets(cleaned);
    const parsed = JSON.parse(repaired);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

