import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { submitAnswerAction, classifyErrorAction } from "@/app/actions/attempts";
import { ERROR_TYPE_OPTIONS } from "@/lib/errorTypes";

export default async function QuestaoPage(props: PageProps<"/listas/[id]/questao/[pos]">) {
  const { id, pos } = await props.params;
  const searchParams = await props.searchParams;
  const erro = typeof searchParams.erro === "string" ? searchParams.erro : null;
  const position = Number(pos);

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?erro=" + encodeURIComponent("Entre na sua conta para responder."));
  }

  const list = await db.studyList.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          question: {
            include: {
              subject: true,
              topic: true,
              exam: { include: { institution: true } },
              alternatives: { orderBy: { letter: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!list || list.userId !== user.id) notFound();
  if (!Number.isInteger(position) || position < 1 || position > list.items.length) notFound();

  const item = list.items[position - 1];
  const question = item.question;

  const attempt = await db.attempt.findFirst({
    where: { userId: user.id, questionId: question.id },
    orderBy: { answeredAt: "desc" },
  });

  const hasPrev = position > 1;
  const hasNext = position < list.items.length;

  const needsClassification = attempt && !attempt.isCorrect && !attempt.errorType;

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/">Início</Link> &gt; <Link href="/listas">Minhas listas</Link> &gt;{" "}
        <Link href={`/listas/${list.id}`}>{list.title}</Link> &gt; Questão {position}
      </div>

      <h1>Questão {position} de {list.items.length}</h1>
      <p className="meta">
        {question.exam.institution.shortName} {question.exam.year} — Questão {question.number} ·{" "}
        {question.subject.name}{question.topic ? ` / ${question.topic.name}` : ""}
      </p>

      {erro && <div className="notice bad">{erro}</div>}

      <div className="box">
        <p>{question.statement}</p>

        {!attempt && (
          <form action={submitAnswerAction}>
            <input type="hidden" name="listId" value={list.id} />
            <input type="hidden" name="position" value={position} />
            <input type="hidden" name="questionId" value={question.id} />
            {question.alternatives.map((alt) => (
              <label key={alt.id} className="alt-option">
                <input type="radio" name="alternativeId" value={alt.id} required />
                <strong>{alt.letter})</strong> {alt.text}
              </label>
            ))}
            <p style={{ marginTop: "1em" }}>
              <button type="submit" className="btn btn-primary">Responder</button>
            </p>
          </form>
        )}

        {attempt && (
          <>
            <ul className="list-plain">
              {question.alternatives.map((alt) => {
                const wasSelected = alt.id === attempt.alternativeId;
                const cls = alt.isCorrect ? "alt-option correct" : wasSelected ? "alt-option wrong" : "alt-option";
                return (
                  <li key={alt.id} className={cls} style={{ listStyle: "none", marginBottom: "0.4em" }}>
                    <strong>{alt.letter})</strong> {alt.text}
                    {alt.isCorrect && " ✓ correta"}
                    {wasSelected && !alt.isCorrect && " — você marcou esta"}
                  </li>
                );
              })}
            </ul>

            <div className={`notice ${attempt.isCorrect ? "ok" : "bad"}`}>
              {attempt.isCorrect ? "Você acertou!" : "Você errou essa questão."}
            </div>
          </>
        )}

        {needsClassification && attempt && (
          <>
            <div className="box-title-bar">Por que você errou?</div>
            <form action={classifyErrorAction} className="box" style={{ borderTop: "none" }}>
              <input type="hidden" name="attemptId" value={attempt.id} />
              <input type="hidden" name="listId" value={list.id} />
              <input type="hidden" name="position" value={position} />
              {ERROR_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="alt-option">
                  <input type="radio" name="errorType" value={opt.value} required />
                  {opt.label}
                </label>
              ))}
              <p style={{ marginTop: "1em" }}>
                <button type="submit" className="btn btn-primary">Salvar classificação</button>
              </p>
            </form>
          </>
        )}
      </div>

      <p className="field-row">
        {hasPrev && <Link href={`/listas/${list.id}/questao/${position - 1}`} className="btn">« Anterior</Link>}
        {hasNext && <Link href={`/listas/${list.id}/questao/${position + 1}`} className="btn">Próxima »</Link>}
        <Link href={`/listas/${list.id}`} className="btn">Voltar para a lista</Link>
      </p>
    </div>
  );
}
