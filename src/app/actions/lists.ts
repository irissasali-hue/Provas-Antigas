"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildQuestionWhere } from "@/lib/questions";

export async function createListAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?erro=" + encodeURIComponent("Entre na sua conta para montar uma lista."));
  }

  const title = String(formData.get("title") ?? "").trim() || "Lista sem título";
  const subjectId = String(formData.get("subjectId") ?? "") || undefined;
  const topicId = String(formData.get("topicId") ?? "") || undefined;
  const institutionId = String(formData.get("institutionId") ?? "") || undefined;
  const yearRaw = String(formData.get("year") ?? "");
  const year = yearRaw ? Number(yearRaw) : undefined;
  const search = String(formData.get("search") ?? "").trim() || undefined;
  const quantityRaw = Number(formData.get("quantity") ?? 20);
  const quantity = Number.isFinite(quantityRaw) ? Math.min(Math.max(quantityRaw, 1), 100) : 20;

  const where = buildQuestionWhere({ subjectId, topicId, institutionId, year, search });

  const questions = await db.question.findMany({
    where,
    take: quantity,
    orderBy: { id: "asc" },
  });

  if (questions.length === 0) {
    redirect("/listas/nova?erro=" + encodeURIComponent("Nenhuma questão encontrada com esses filtros."));
  }

  const list = await db.studyList.create({
    data: {
      userId: user.id,
      title,
      items: {
        create: questions.map((q, i) => ({ questionId: q.id, position: i })),
      },
    },
  });

  redirect(`/listas/${list.id}`);
}

export async function createListFromExamAction(formData: FormData) {
  const user = await getCurrentUser();
  const examId = String(formData.get("examId") ?? "");
  if (!user) {
    redirect("/login?erro=" + encodeURIComponent("Entre na sua conta para praticar esta prova."));
  }

  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { institution: true, questions: { orderBy: { number: "asc" } } },
  });

  if (!exam || exam.questions.length === 0) {
    redirect("/provas");
  }

  const list = await db.studyList.create({
    data: {
      userId: user.id,
      title: `${exam.institution.shortName} ${exam.year} — ${exam.title}`,
      items: {
        create: exam.questions.map((q, i) => ({ questionId: q.id, position: i })),
      },
    },
  });

  redirect(`/listas/${list.id}`);
}

export async function deleteListAction(formData: FormData) {
  const user = await getCurrentUser();
  const listId = String(formData.get("listId") ?? "");
  if (!user) {
    redirect("/login");
  }

  await db.studyList.deleteMany({ where: { id: listId, userId: user!.id } });
  redirect("/listas");
}
