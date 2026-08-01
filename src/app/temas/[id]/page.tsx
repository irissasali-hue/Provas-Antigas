import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function TemaPage(props: PageProps<"/temas/[id]">) {
  const { id } = await props.params;
  const user = await getCurrentUser();

  const topic = await db.topic.findUnique({
    where: { id },
    include: {
      subject: true,
      videos: { orderBy: { rating: "desc" } },
      questions: {
        take: 15,
        orderBy: { id: "asc" },
        include: { exam: { include: { institution: true } } },
      },
    },
  });

  if (!topic) notFound();

  const schedule = user
    ? await db.reviewSchedule.findUnique({ where: { userId_topicId: { userId: user.id, topicId: topic.id } } })
    : null;

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/">Início</Link> &gt; <span className="tag">{topic.subject.name}</span> &gt; {topic.name}
      </div>
      <h1>{topic.name}</h1>
      <p className="meta">Matéria: {topic.subject.name}</p>

      {schedule && (
        <div className="notice">
          Você já errou questões deste tema {schedule.timesWrong} vez(es). Próxima revisão sugerida:{" "}
          {schedule.dueDate.toLocaleDateString("pt-BR")}.
        </div>
      )}

      <p>
        <Link href={`/listas/nova?tema=${topic.id}`} className="btn btn-primary">Praticar este tema »</Link>
      </p>

      <div className="box-title-bar">Vídeos recomendados</div>
      <div className="box">
        {topic.videos.length === 0 && <p>Nenhum vídeo cadastrado para este tema ainda.</p>}
        <ul className="list-plain">
          {topic.videos.map((v) => (
            <li key={v.id}>
              <a href={v.youtubeUrl} target="_blank" rel="noopener noreferrer"><strong>{v.title}</strong></a>
              <div className="meta">{v.channel} · nota {v.rating.toFixed(1)} ({v.votes} avaliações)</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="box-title-bar">Questões deste tema</div>
      <div className="box">
        {topic.questions.length === 0 && <p>Nenhuma questão cadastrada para este tema ainda.</p>}
        <ul className="list-plain">
          {topic.questions.map((q) => (
            <li key={q.id}>
              <Link href={`/provas/${q.examId}#questao-${q.number}`}>
                {q.exam.institution.shortName} {q.exam.year} — Questão {q.number}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
