import type { Response } from "express";

const labelWidth = 10;

export function note(res: Response, message: string) {
  res.locals.accessNote = message;
}

export function logBlock(title: string, rows: Record<string, string>) {
  const entries = Object.entries(rows);
  const width = Math.max(labelWidth, ...entries.map(([label]) => label.length));
  const lines = [`┌ ${title}`];
  for (const [label, value] of entries) {
    lines.push(`│ ${label.padEnd(width)}  ${value}`);
  }
  lines.push("└");
  console.log(lines.join("\n"));
}

export function logError(title: string, error: unknown) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`┌ ${title}\n${message}\n└`);
}
