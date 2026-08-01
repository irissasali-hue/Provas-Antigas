import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Importações — Admin" };

export default async function ImportacoesPage() {
  await requireAdmin();

  const jobs = await db.importJob.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      exam: { include: { institution: true } },
      questions: { select: { status: true } },
    },
  });

  return (
    <div>
      <div className="breadcrumbs"><Link href="/">Início</Link> &gt; Admin &gt; Importações</div>
      <h1>Importações de provas</h1>
      <p>Cada linha é uma execução do script <code>npm run import:exam</code>. Revise os
      rascunhos antes de publicá-los no site.</p>

      <div className="box-title-bar">{jobs.length} importação(ões)</div>
      <div className="box">
        {jobs.length === 0 && <p>Nenhuma importação ainda. Rode o script de importação pelo terminal.</p>}
        <table>
          <thead>
            <tr>
              <th>Prova</th>
              <th>Arquivo</th>
              <th>Modelo</th>
              <th>Rascunhos</th>
              <th>Publicadas</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const draft = job.questions.filter((q) => q.status === "DRAFT").length;
              const published = job.questions.filter((q) => q.status === "PUBLISHED").length;
              return (
                <tr key={job.id}>
                  <td>{job.exam.institution.shortName} {job.exam.year} — {job.exam.title}</td>
                  <td>{job.sourceFileName}</td>
                  <td className="meta">{job.model}</td>
                  <td>{draft}</td>
                  <td>{published}</td>
                  <td className="meta">{job.createdAt.toLocaleString("pt-BR")}</td>
                  <td><Link href={`/admin/importacoes/${job.id}`}>revisar »</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
