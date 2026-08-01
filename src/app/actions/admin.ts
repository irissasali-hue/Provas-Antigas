"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slugify";

async function jobIdForQuestion(questionId: string) {
  const question = await db.question.findUnique({
    where: { id: questionId },
    select: { importJobId: true },
  });
  return question?.importJobId ?? null;
}

export async function updateDraftQuestionAction(formData: FormData) {
  await requireAdmin();

  const questionId = String(formData.get("questionId") ?? "");
  const statement = String(formData.get("statement") ?? "").trim();
  const subjectName = String(formData.get("subjectName") ?? "").trim();
  const topicName = String(formData.get("topicName") ?? "").trim();
  const correctLetter = String(formData.get("correctLetter") ?? "").trim().toUpperCase();

  if (!questionId || !statement || !subjectName) return;

  let subject = await db.subject.findFirst({ where: { name: subjectName } });
  if (!subject) {
    subject = await db.subject.create({ data: { name: subjectName, slug: slugify(subjectName) } });
  }

  let topicId: string | null = null;
  if (topicName) {
    let topic = await db.topic.findFirst({ where: { subjectId: subject.id, name: topicName } });
    if (!topic) {
      topic = await db.topic.create({
        data: { subjectId: subject.id, name: topicName, slug: slugify(`${subjectName}-${topicName}`) },
      });
    }
    topicId = topic.id;
  }

  const alternatives = await db.alternative.findMany({ where: { questionId } });
  await db.$transaction([
    db.question.update({
      where: { id: questionId },
      data: { statement, subjectId: subject.id, topicId },
    }),
    ...alternatives.map((alt) =>
      db.alternative.update({
        where: { id: alt.id },
        data: { isCorrect: alt.letter.toUpperCase() === correctLetter },
      }),
    ),
  ]);

  const jobId = await jobIdForQuestion(questionId);
  if (jobId) revalidatePath(`/admin/importacoes/${jobId}`);
}

export async function approveQuestionAction(formData: FormData) {
  await requireAdmin();
  const questionId = String(formData.get("questionId") ?? "");
  if (!questionId) return;

  const jobId = await jobIdForQuestion(questionId);
  await db.question.update({ where: { id: questionId }, data: { status: "PUBLISHED" } });
  if (jobId) revalidatePath(`/admin/importacoes/${jobId}`);
}

export async function discardQuestionAction(formData: FormData) {
  await requireAdmin();
  const questionId = String(formData.get("questionId") ?? "");
  if (!questionId) return;

  const jobId = await jobIdForQuestion(questionId);
  await db.question.delete({ where: { id: questionId } });
  if (jobId) revalidatePath(`/admin/importacoes/${jobId}`);
}

export async function assignImageAction(formData: FormData) {
  await requireAdmin();
  const questionId = String(formData.get("questionId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!questionId || !imageId) return;

  const image = await db.importedImage.findUnique({ where: { id: imageId } });
  if (!image) return;

  await db.$transaction([
    db.importedImage.updateMany({
      where: { assignedQuestionId: questionId },
      data: { assignedQuestionId: null },
    }),
    db.importedImage.update({ where: { id: imageId }, data: { assignedQuestionId: questionId } }),
    db.question.update({ where: { id: questionId }, data: { imageUrl: image.filePath } }),
  ]);

  const jobId = await jobIdForQuestion(questionId);
  if (jobId) revalidatePath(`/admin/importacoes/${jobId}`);
}

export async function clearImageAction(formData: FormData) {
  await requireAdmin();
  const questionId = String(formData.get("questionId") ?? "");
  if (!questionId) return;

  await db.$transaction([
    db.importedImage.updateMany({
      where: { assignedQuestionId: questionId },
      data: { assignedQuestionId: null },
    }),
    db.question.update({ where: { id: questionId }, data: { imageUrl: null } }),
  ]);

  const jobId = await jobIdForQuestion(questionId);
  if (jobId) revalidatePath(`/admin/importacoes/${jobId}`);
}
