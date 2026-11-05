import { ApiError } from "./api-error.js";
import { prisma } from "./lib/prisma.js";

function noteInput(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "Expected an object");
  }
  const record = body as Record<string, unknown>;
  const topic = requiredText(record, "topic");
  const question = requiredText(record, "question");
  const answer = requiredText(record, "answer");
  return { topic, question, answer };
}

function requiredText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${key} is required`);
  }
  return value.trim();
}

function formatNote(note: { id: number; topic: string; question: string; answer: string; updatedAt: Date }) {
  return {
    id: note.id,
    topic: note.topic,
    question: note.question,
    answer: note.answer,
    updatedAt: note.updatedAt.toISOString(),
  };
}

export async function loadAssistantNotes() {
  const notes = await prisma.assistantNote.findMany({ orderBy: { topic: "asc" } });
  return notes.map(formatNote);
}

export async function upsertAssistantNote(body: unknown) {
  const input = noteInput(body);
  const existing = await prisma.assistantNote.findFirst({
    where: { topic: { equals: input.topic, mode: "insensitive" } },
  });
  if (!existing) {
    return {
      created: true,
      note: formatNote(await prisma.assistantNote.create({ data: input })),
    };
  }
  return {
    created: false,
    note: formatNote(
      await prisma.assistantNote.update({
        where: { id: existing.id },
        data: { topic: input.topic, question: input.question, answer: input.answer },
      }),
    ),
  };
}
