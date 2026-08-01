import type { Prisma } from "@/generated/prisma/client";

export type QuestionFilters = {
  subjectId?: string;
  topicId?: string;
  institutionId?: string;
  year?: number;
  search?: string;
};

export function buildQuestionWhere(filters: QuestionFilters): Prisma.QuestionWhereInput {
  return {
    status: "PUBLISHED",
    subjectId: filters.subjectId || undefined,
    topicId: filters.topicId || undefined,
    exam: {
      institutionId: filters.institutionId || undefined,
      year: filters.year || undefined,
    },
    statement: filters.search ? { contains: filters.search } : undefined,
  };
}
