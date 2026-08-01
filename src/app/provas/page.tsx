import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Provas — Provas Antigas" };

export default async function ProvasPage(props: PageProps<"/provas">) {
  const searchParams = await props.searchParams;
  const institutionId = typeof searchParams.instituicao === "string" ? searchParams.instituicao : undefined;
  const year = typeof searchParams.ano === "string" ? Number(searchParams.ano) : undefined;

  const [institutions, exams] = await Promise.all([
    db.institution.findMany({ orderBy: { shortName: "asc" } }),
    db.exam.findMany({
      where: {
        institutionId: institutionId || undefined,
        year: year || undefined,
      },
      orderBy: [{ year: "desc" }, { title: "asc" }],
      include: { institution: true, _count: { select: { questions: true } } },
    }),
  ]);

  const years = await db.exam.findMany({
    distinct: ["year"],
    select: { year: true },
    orderBy: { year: "desc" },
  });

  return (
    <div>
      <div className="breadcrumbs"><Link href="/">Início</Link> &gt; Provas</div>
      <h1>Provas na íntegra</h1>
      <p>Navegue pelas provas cadastradas, veja a lista de questões de cada uma e, quando
      disponível, acesse o caderno completo em PDF.</p>

      <div className="box-title-bar">Filtrar</div>
      <div className="box">
        <form method="get">
          <div className="field-row">
            <div>
              <label htmlFor="instituicao">Instituição</label>
              <select id="instituicao" name="instituicao" defaultValue={institutionId ?? ""}>
                <option value="">Todas</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.shortName}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ano">Ano</label>
              <select id="ano" name="ano" defaultValue={year ? String(year) : ""}>
                <option value="">Todos</option>
                {years.map((y) => (
                  <option key={y.year} value={y.year}>{y.year}</option>
                ))}
              </select>
            </div>
          </div>
          <p style={{ marginTop: "0.8em" }}>
            <button type="submit" className="btn btn-primary">Filtrar</button>{" "}
            <Link href="/provas" className="btn">Limpar</Link>
          </p>
        </form>
      </div>

      <div className="box-title-bar">{exams.length} prova(s) encontrada(s)</div>
      <div className="box">
        {exams.length === 0 && <p>Nenhuma prova encontrada com esses filtros.</p>}
        <ul className="list-plain">
          {exams.map((exam) => (
            <li key={exam.id}>
              <Link href={`/provas/${exam.id}`}>
                <strong>{exam.institution.shortName} {exam.year}</strong> — {exam.title}
              </Link>
              {exam.phase && <span className="tag">{exam.phase}</span>}
              <div className="meta">{exam._count.questions} questões cadastradas</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
