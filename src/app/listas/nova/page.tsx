import Link from "next/link";
import { db } from "@/lib/db";
import { createListAction } from "@/app/actions/lists";

export const metadata = { title: "Nova lista — Provas Antigas" };

export default async function NovaListaPage(props: PageProps<"/listas/nova">) {
  const sp = await props.searchParams;
  const erro = typeof sp.erro === "string" ? sp.erro : null;
  const topicoPre = typeof sp.tema === "string" ? sp.tema : "";

  const [subjects, institutions] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" }, include: { topics: { orderBy: { name: "asc" } } } }),
    db.institution.findMany({ orderBy: { shortName: "asc" } }),
  ]);

  return (
    <div>
      <div className="breadcrumbs"><Link href="/">Início</Link> &gt; <Link href="/listas">Minhas listas</Link> &gt; Nova</div>
      <h1>Montar nova lista</h1>
      <p>Escolha os filtros e a quantidade de questões. As questões que combinarem com os
      filtros serão adicionadas automaticamente à sua lista.</p>

      {erro && <div className="notice bad">{erro}</div>}

      <div className="box">
        <form action={createListAction}>
          <label htmlFor="title">Título da lista</label>
          <input type="text" id="title" name="title" placeholder="ex.: Revisão de Matemática — semana 1" />

          <div className="field-row">
            <div>
              <label htmlFor="subjectId">Matéria</label>
              <select id="subjectId" name="subjectId">
                <option value="">Todas</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="topicId">Tema</label>
              <select id="topicId" name="topicId" defaultValue={topicoPre}>
                <option value="">Todos</option>
                {subjects.flatMap((s) => s.topics).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="institutionId">Instituição</label>
              <select id="institutionId" name="institutionId">
                <option value="">Todas</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>{i.shortName}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year">Ano</label>
              <input type="number" id="year" name="year" placeholder="ex.: 2015" />
            </div>
          </div>

          <label htmlFor="search">Buscar palavra-chave no enunciado (opcional)</label>
          <input type="text" id="search" name="search" />

          <label htmlFor="quantity">Quantidade de questões</label>
          <input type="number" id="quantity" name="quantity" defaultValue={20} min={1} max={100} style={{ maxWidth: "120px" }} />

          <p style={{ marginTop: "1em" }}>
            <button type="submit" className="btn btn-primary">Gerar lista</button>
          </p>
        </form>
      </div>
    </div>
  );
}
