import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ERROR_TYPE_LABELS } from "@/lib/errorTypes";

export default async function ListaPage(props: PageProps<"/listas/[id]">) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?erro=" + encodeURIComponent("Entre na sua conta para ver esta lista."));
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
              attempts: { where: { userId: user.id }, orderBy: { answeredAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!list || list.userId !== user.id) notFound();

  const total = list.items.length;
  const answered = list.items.filter((it) => it.question.attempts.length > 0);
  const correct = answered.filter((it) => it.question.attempts[0]?.isCorrect).length;
  const wrong = answered.length - correct;

  const firstUnanswered = list.items.find((it) => it.question.attempts.length === 0);
  const continuePosition = firstUnanswered ? list.items.indexOf(firstUnanswered) + 1 : 1;

  return (
    <div>
      <div className="breadcrumbs"><Link href="/">Início</Link> &gt; <Link href="/listas">Minhas listas</Link> &gt; {list.title}</div>
      <h1>{list.title}</h1>

      <div className="stat-grid">
        <div className="stat-box"><div className="num">{total}</div><div className="label">Questões</div></div>
        <div className="stat-box"><div className="num">{answered.length}</div><div className="label">Respondidas</div></div>
        <div className="stat-box"><div className="num">{correct}</div><div className="label">Corretas</div></div>
        <div className="stat-box"><div className="num">{wrong}</div><div className="label">Erradas</div></div>
      </div>

      <p>
        <Link href={`/listas/${list.id}/questao/${continuePosition}`} className="btn btn-primary">
          {answered.length === 0 ? "Começar" : answered.length === total ? "Revisar respostas" : "Continuar de onde parei"}
        </Link>
      </p>

      <div className="box-title-bar">Questões</div>
      <div className="box">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Prova</th>
              <th>Matéria / tema</th>
              <th>Status</th>
              <th>Motivo do erro</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((item, i) => {
              const attempt = item.question.attempts[0];
              let status = "Não respondida";
              if (attempt) status = attempt.isCorrect ? "Correta" : "Errada";
              return (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td>{item.question.exam.institution.shortName} {item.question.exam.year} — Q{item.question.number}</td>
                  <td>{item.question.subject.name}{item.question.topic ? ` / ${item.question.topic.name}` : ""}</td>
                  <td>{status}</td>
                  <td>{attempt?.errorType ? ERROR_TYPE_LABELS[attempt.errorType] : attempt && !attempt.isCorrect ? "a classificar" : "—"}</td>
                  <td><Link href={`/listas/${list.id}/questao/${i + 1}`}>abrir »</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
