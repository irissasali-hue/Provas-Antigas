import Link from "next/link";
import { db } from "@/lib/db";
import { buildQuestionWhere } from "@/lib/questions";

export const metadata = { title: "Questões — Provas Antigas" };

export default async function QuestoesPage(props: PageProps<"/questoes">) {
  const sp = await props.searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);

  const subjectId = str(sp.materia);
  const topicId = str(sp.tema);
  const institutionId = str(sp.instituicao);
  const yearStr = str(sp.ano);
  const year = yearStr ? Number(yearStr) : undefined;
  const search = str(sp.q);

  const where = buildQuestionWhere({ subjectId, topicId, institutionId, year, search });

  const [subjects, institutions, questions] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" }, include: { topics: { orderBy: { name: "asc" } } } }),
    db.institution.findMany({ orderBy: { shortName: "asc" } }),
    db.question.findMany({
      where,
      take: 40,
      orderBy: { id: "asc" },
      include: { exam: { include: { institution: true } }, subject: true, topic: true },
    }),
  ]);

  const topicsForSubject = subjectId ? subjects.find((s) => s.id === subjectId)?.topics ?? [] : [];

  return (
    <div>
      <div className="breadcrumbs"><Link href="/">Início</Link> &gt; Questões</div>
      <h1>Banco de questões</h1>
      <p>Filtre por matéria, tema, instituição, ano ou palavra-chave. Para resolver várias
      questões seguidas e acompanhar seus erros, monte uma <Link href="/listas/nova">lista de estudo</Link>.</p>

      <div className="box-title-bar">Filtrar</div>
      <div className="box">
        <form method="get">
          <div className="field-row">
            <div>
              <label htmlFor="materia">Matéria</label>
              <select id="materia" name="materia" defaultValue={subjectId ?? ""}>
                <option value="">Todas</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tema">Tema</label>
              <select id="tema" name="tema" defaultValue={topicId ?? ""}>
                <option value="">Todos</option>
                {(subjectId ? topicsForSubject : subjects.flatMap((s) => s.topics)).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="instituicao">Instituição</label>
              <select id="instituicao" name="instituicao" defaultValue={institutionId ?? ""}>
                <option value="">Todas</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>{i.shortName}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ano">Ano</label>
              <input type="number" id="ano" name="ano" defaultValue={year ?? ""} placeholder="ex.: 2015" />
            </div>
          </div>
          <label htmlFor="q">Buscar no enunciado</label>
          <input type="text" id="q" name="q" defaultValue={search ?? ""} placeholder="palavra-chave..." />
          <p style={{ marginTop: "0.8em" }}>
            <button type="submit" className="btn btn-primary">Buscar</button>{" "}
            <Link href="/questoes" className="btn">Limpar</Link>
          </p>
        </form>
      </div>

      <div className="box-title-bar">{questions.length} questão(ões) encontradas (máx. 40 exibidas)</div>
      <div className="box">
        {questions.length === 0 && <p>Nenhuma questão encontrada com esses filtros.</p>}
        <ul className="list-plain">
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`/provas/${q.examId}#questao-${q.number}`}>
                {q.exam.institution.shortName} {q.exam.year} — Questão {q.number}
              </Link>
              <p>{q.statement.slice(0, 180)}{q.statement.length > 180 ? "…" : ""}</p>
              <span className="tag">{q.subject.name}</span>
              {q.topic && <Link href={`/temas/${q.topic.id}`} className="tag">{q.topic.name}</Link>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
