import { isAppError } from '@mcp-expedition/shared-schemas';

export function printHeading(title: string): void {
  console.log(`\n=== ${title} ===`);
}

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function printKeyValue(label: string, value: string): void {
  console.log(`${label}: ${value}`);
}

export function printError(error: unknown, debug: boolean): void {
  if (isAppError(error)) {
    console.error(`${error.code}: ${error.message}`);
    if (debug && error.stack) {
      console.error(error.stack);
    }
    return;
  }

  if (error instanceof Error) {
    console.error(error.message);
    if (debug && error.stack) {
      console.error(error.stack);
    }
    return;
  }

  console.error('Unexpected error');
  if (debug) {
    console.error(error);
  }
}

export function extractTextContent(result: {
  content?: Array<{ type: string; text?: string }>;
}): string {
  const texts =
    result.content
      ?.filter((item) => item.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text ?? '') ?? [];
  return texts.join('\n');
}
