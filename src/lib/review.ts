import { db } from "@/lib/db";

// Intervalos (em dias) de uma repetição espaçada simples, tipo Leitner:
// erra -> volta para o estágio 0 (revisar amanhã); acerta -> avança de estágio.
export const STAGE_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60];

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function scheduleReviewOnWrongAnswer(userId: string, topicId: string) {
  const dueDate = addDays(new Date(), STAGE_INTERVALS_DAYS[0]);

  await db.reviewSchedule.upsert({
    where: { userId_topicId: { userId, topicId } },
    create: {
      userId,
      topicId,
      stage: 0,
      dueDate,
      lastReview: new Date(),
      timesWrong: 1,
    },
    update: {
      stage: 0,
      dueDate,
      lastReview: new Date(),
      timesWrong: { increment: 1 },
    },
  });
}

export async function advanceReviewOnCorrectAnswer(userId: string, topicId: string) {
  const existing = await db.reviewSchedule.findUnique({
    where: { userId_topicId: { userId, topicId } },
  });

  // Só existe agenda de revisão para temas em que o usuário já errou alguma
  // vez; acertar um tema "novo" não cria uma revisão.
  if (!existing) return;

  const nextStage = Math.min(existing.stage + 1, STAGE_INTERVALS_DAYS.length - 1);
  const dueDate = addDays(new Date(), STAGE_INTERVALS_DAYS[nextStage]);

  await db.reviewSchedule.update({
    where: { userId_topicId: { userId, topicId } },
    data: {
      stage: nextStage,
      dueDate,
      lastReview: new Date(),
      timesRight: { increment: 1 },
    },
  });
}
