import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import {
  updateDraftQuestionAction,
  approveQuestionAction,
  discardQuestionAction,
  assignImageAction,
  clearImageAction,
} from "@/app/actions/admin";

export default async function RevisarImportacaoPage(props: PageProps<"/admin/importacoes/[id]">) {
  await requireAdmin();
  const { id } = await props.params;

  const job = await db.importJob.findUnique({
    where: { id },
    include: {
      exam: { include: { institution: true } },
      images: { orderBy: [{ pageNumber: "asc" }, { id: "asc" }] },
      questions: {
        orderBy: { number: "asc" },
        include: {
          alternatives: { orderBy: { letter: "asc" } },
          subject: true,
          topic: true,
        },
      },
    },
  });

  if (!job) notFound();

  const [subjects, topics] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.topic.findMany({ orderBy: { name: "asc" } }),
  ]);

  const draftQuestions = job.questions.filter((q) => q.status === "DRAFT");
  const publishedQuestions = job.questions.filter((q) => q.status === "PUBLISHED");

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/">Início</Link> &gt; <Link href="/admin/importacoes">Admin</Link> &gt; Revisão
      </div>
      <h1>{job.exam.institution.shortName} {job.exam.year} — {job.exam.title}</h1>
      <p className="meta">Arquivo: {job.sourceFileName} · Modelo: {job.model} · {job.createdAt.toLocaleString("pt-BR")}</p>

      {job.notes && (
        <div className="notice">
          <strong>Avisos da importação:</strong>
          <br />
          {job.notes.split("\n").map((line, i) => <span key={i}>{line}<br /></span>)}
        </div>
      )}

      <datalist id="subjects-datalist">
        {subjects.map((s) => <option key={s.id} value={s.name} />)}
      </datalist>
      <datalist id="topics-datalist">
        {topics.map((t) => <option key={t.id} value={t.name} />)}
      </datalist>

      <div className="box-title-bar">{draftQuestions.length} rascunho(s) para revisar</div>
      <div className="box">
        {draftQuestions.length === 0 && <p>Nenhum rascunho pendente — tudo revisado nesta importação.</p>}

        {draftQuestions.map((q) => {
          const correctAlt = q.alternatives.find((a) => a.isCorrect);
          const questionImages = job.images.filter(
            (img) => img.assignedQuestionId === q.id || img.assignedQuestionId === null,
          );
          return (
            <div key={q.id} style={{ marginBottom: "2em", paddingBottom: "1.6em", borderBottom: "2px solid var(--rule)" }}>
              <h3>Questão {q.number}</h3>

              <form action={updateDraftQuestionAction}>
                <input type="hidden" name="questionId" value={q.id} />

                <label htmlFor={`statement-${q.id}`}>Enunciado</label>
                <textarea id={`statement-${q.id}`} name="statement" rows={4} defaultValue={q.statement} style={{ maxWidth: "100%" }} />

                <div className="field-row">
                  <div>
                    <label htmlFor={`subject-${q.id}`}>Matéria</label>
                    <input id={`subject-${q.id}`} name="subjectName" list="subjects-datalist" defaultValue={q.subject.name} />
                  </div>
                  <div>
                    <label htmlFor={`topic-${q.id}`}>Tema</label>
                    <input id={`topic-${q.id}`} name="topicName" list="topics-datalist" defaultValue={q.topic?.name ?? ""} />
                  </div>
                  <div>
                    <label htmlFor={`correct-${q.id}`}>Alternativa correta</label>
                    <select id={`correct-${q.id}`} name="correctLetter" defaultValue={correctAlt?.letter ?? ""}>
                      <option value="">(sem gabarito)</option>
                      {q.alternatives.map((a) => (
                        <option key={a.id} value={a.letter}>{a.letter}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <ul className="list-plain">
                  {q.alternatives.map((a) => (
                    <li key={a.id}><strong>{a.letter})</strong> {a.text}</li>
                  ))}
                </ul>

                <p style={{ marginTop: "0.8em" }}>
                  <button type="submit" className="btn">Salvar alterações</button>
                </p>
              </form>

              {q.imageUrl && (
                <div style={{ margin: "0.6em 0" }}>
                  <p className="meta">Imagem atual:</p>
                  <Image src={q.imageUrl} alt={`Figura da questão ${q.number}`} width={220} height={220} style={{ width: "auto", maxWidth: "220px", height: "auto", border: "1px solid var(--rule-dark)" }} unoptimized />
                  <form action={clearImageAction} style={{ marginTop: "0.4em" }}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <button type="submit" className="btn">Remover imagem</button>
                  </form>
                </div>
              )}

              {questionImages.length > 0 && (
                <details>
                  <summary className="meta" style={{ cursor: "pointer" }}>
                    Escolher imagem entre as {questionImages.length} extraída(s) desta prova
                  </summary>
                  <div className="field-row" style={{ marginTop: "0.6em" }}>
                    {questionImages.map((img) => (
                      <form action={assignImageAction} key={img.id}>
                        <input type="hidden" name="questionId" value={q.id} />
                        <input type="hidden" name="imageId" value={img.id} />
                        <button type="submit" className="btn" style={{ padding: "0.3em" }}>
                          <Image src={img.filePath} alt={`Imagem da página ${img.pageNumber}`} width={100} height={100} style={{ width: "100px", height: "auto", display: "block" }} unoptimized />
                          <span className="meta">pág. {img.pageNumber}</span>
                        </button>
                      </form>
                    ))}
                  </div>
                </details>
              )}

              <div className="field-row" style={{ marginTop: "1em" }}>
                <form action={approveQuestionAction}>
                  <input type="hidden" name="questionId" value={q.id} />
                  <button type="submit" className="btn btn-primary">Aprovar e publicar</button>
                </form>
                <form action={discardQuestionAction}>
                  <input type="hidden" name="questionId" value={q.id} />
                  <button type="submit" className="btn">Descartar</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {publishedQuestions.length > 0 && (
        <>
          <div className="box-title-bar">{publishedQuestions.length} já publicada(s) nesta importação</div>
          <div className="box">
            <ul className="list-plain">
              {publishedQuestions.map((q) => (
                <li key={q.id}>
                  Questão {q.number} — {q.subject.name}{q.topic ? ` / ${q.topic.name}` : ""}{" "}
                  <Link href={`/provas/${job.exam.id}#questao-${q.number}`}>ver no site »</Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
