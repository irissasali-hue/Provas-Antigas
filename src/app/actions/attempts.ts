"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { scheduleReviewOnWrongAnswer, advanceReviewOnCorrectAnswer } from "@/lib/review";
import { ErrorType } from "@/generated/prisma/enums";

export async function submitAnswerAction(formData: FormData) {
  const user = await requireUser();

  const listId = String(formData.get("listId") ?? "");
  const position = String(formData.get("position") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const alternativeId = String(formData.get("alternativeId") ?? "") || null;

  const question = await db.question.findUniqueOrThrow({ where: { id: questionId } });

  const alternative = alternativeId
    ? await db.alternative.findUnique({ where: { id: alternativeId } })
    : null;

  const isCorrect = Boolean(alternative?.isCorrect);

  await db.attempt.create({
    data: {
      userId: user.id,
      questionId,
      alternativeId,
      isCorrect,
    },
  });

  if (question.topicId) {
    if (isCorrect) {
      await advanceReviewOnCorrectAnswer(user.id, question.topicId);
    } else {
      await scheduleReviewOnWrongAnswer(user.id, question.topicId);
    }
  }

  redirect(`/listas/${listId}/questao/${position}`);
}

export async function classifyErrorAction(formData: FormData) {
  const user = await requireUser();

  const attemptId = String(formData.get("attemptId") ?? "");
  const listId = String(formData.get("listId") ?? "");
  const position = String(formData.get("position") ?? "");
  const errorType = String(formData.get("errorType") ?? "") as ErrorType;

  if (!Object.values(ErrorType).includes(errorType)) {
    redirect(`/listas/${listId}/questao/${position}?erro=` + encodeURIComponent("Selecione um motivo válido."));
  }

  await db.attempt.updateMany({
    where: { id: attemptId, userId: user.id },
    data: { errorType },
  });

  redirect(`/listas/${listId}/questao/${position}`);
}
