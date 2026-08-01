import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { createListFromExamAction } from "@/app/actions/lists";

export default async function ExamPage(props: PageProps<"/provas/[id]">) {
  const { id } = await props.params;

  const exam = await db.exam.findUnique({
    where: { id },
    include: {
      institution: true,
      questions: {
        orderBy: { number: "asc" },
        include: { alternatives: { orderBy: { letter: "asc" } }, topic: true },
      },
    },
  });

  if (!exam) notFound();

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/">Início</Link> &gt; <Link href="/provas">Provas</Link> &gt; {exam.institution.shortName} {exam.year}
      </div>
      <h1>{exam.institution.shortName} {exam.year} — {exam.title}</h1>
      {exam.phase && <span className="tag">{exam.phase}</span>}
      {exam.description && <p>{exam.description}</p>}

      <div className="box">
        <div className="field-row">
          {exam.pdfUrl && (
            <a className="btn" href={exam.pdfUrl} target="_blank" rel="noopener noreferrer">
              Ver caderno completo (PDF)
            </a>
          )}
          {exam.answerKeyUrl && (
            <a className="btn" href={exam.answerKeyUrl} target="_blank" rel="noopener noreferrer">
              Gabarito oficial
            </a>
          )}
          <form action={createListFromExamAction}>
            <input type="hidden" name="examId" value={exam.id} />
            <button type="submit" className="btn btn-primary">Praticar esta prova como lista</button>
          </form>
        </div>
      </div>

      <div className="box-title-bar">{exam.questions.length} questões cadastradas</div>
      <div className="box">
        {exam.questions.length === 0 && <p>Nenhuma questão cadastrada para esta prova ainda.</p>}
        {exam.questions.map((q) => (
          <div key={q.id} id={`questao-${q.number}`} style={{ marginBottom: "1.4em", paddingBottom: "1.2em", borderBottom: "1px dotted var(--rule)" }}>
            <p>
              <strong>Questão {q.number}.</strong> {q.statement}
            </p>
            {q.topic && (
              <p>
                <Link href={`/temas/${q.topic.id}`} className="tag">{q.topic.name}</Link>
              </p>
            )}
            <ul className="list-plain">
              {q.alternatives.map((alt) => (
                <li key={alt.id} className={alt.isCorrect ? "due-today" : undefined}>
                  <strong>{alt.letter})</strong> {alt.text} {alt.isCorrect && "✓ correta"}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
