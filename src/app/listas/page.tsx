import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteListAction } from "@/app/actions/lists";

export const metadata = { title: "Minhas listas — Provas Antigas" };

export default async function ListasPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?erro=" + encodeURIComponent("Entre na sua conta para ver suas listas."));
  }

  const lists = await db.studyList.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          question: {
            include: { attempts: { where: { userId: user.id }, orderBy: { answeredAt: "desc" }, take: 1 } },
          },
        },
      },
    },
  });

  return (
    <div>
      <div className="breadcrumbs"><Link href="/">Início</Link> &gt; Minhas listas</div>
      <h1>Minhas listas de estudo</h1>
      <p><Link href="/listas/nova" className="btn btn-primary">+ Montar nova lista</Link></p>

      {lists.length === 0 && (
        <div className="notice">Você ainda não tem nenhuma lista. Monte uma a partir de filtros de matéria, tema, instituição ou ano.</div>
      )}

      <ul className="list-plain">
        {lists.map((list) => {
          const total = list.items.length;
          const answered = list.items.filter((it) => it.question.attempts.length > 0).length;
          const correct = list.items.filter((it) => it.question.attempts[0]?.isCorrect).length;
          return (
            <li key={list.id}>
              <Link href={`/listas/${list.id}`}><strong>{list.title}</strong></Link>
              <div className="meta">
                {answered}/{total} respondidas · {correct} corretas · criada em{" "}
                {list.createdAt.toLocaleDateString("pt-BR")}
              </div>
              <form action={deleteListAction} style={{ display: "inline" }}>
                <input type="hidden" name="listId" value={list.id} />
                <button type="submit" className="btn" style={{ fontSize: "0.75rem", padding: "0.1em 0.5em" }}>
                  excluir
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
