import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Revisão — Provas Antigas" };

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function ReviewGroup({
  title,
  schedules,
  status,
}: {
  title: string;
  schedules: Array<{
    id: string;
    dueDate: Date;
    timesWrong: number;
    timesRight: number;
    topic: {
      id: string;
      name: string;
      subject: { name: string };
      videos: Array<{ id: string; title: string; channel: string; rating: number; youtubeUrl: string }>;
    };
  }>;
  status: "due-late" | "due-today" | "due-soon";
}) {
  if (schedules.length === 0) return null;

  return (
    <>
      <div className="box-title-bar">{title} ({schedules.length})</div>
      <div className="box">
        {schedules.map((s) => (
          <div key={s.id} style={{ marginBottom: "1em", paddingBottom: "1em", borderBottom: "1px dotted var(--rule)" }}>
            <p>
              <Link href={`/temas/${s.topic.id}`}><strong>{s.topic.name}</strong></Link>{" "}
              <span className="tag">{s.topic.subject.name}</span>{" "}
              <span className={status}>revisar em {s.dueDate.toLocaleDateString("pt-BR")}</span>
            </p>
            <p className="meta">{s.timesWrong} erro(s) · {s.timesRight} acerto(s) desde então</p>
            {s.topic.videos.length > 0 && (
              <ul className="list-plain">
                {s.topic.videos.map((v) => (
                  <li key={v.id}>
                    <a href={v.youtubeUrl} target="_blank" rel="noopener noreferrer">{v.title}</a>
                    <span className="meta"> — {v.channel} · nota {v.rating.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p>
              <Link href={`/listas/nova?tema=${s.topic.id}`} className="btn">Praticar este tema »</Link>
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

export default async function RevisaoPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?erro=" + encodeURIComponent("Entre na sua conta para ver seu calendário de revisão."));
  }

  const schedules = await db.reviewSchedule.findMany({
    where: { userId: user.id },
    orderBy: { dueDate: "asc" },
    include: {
      topic: {
        include: {
          subject: true,
          videos: { orderBy: { rating: "desc" }, take: 2 },
        },
      },
    },
  });

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const late = schedules.filter((s) => startOfDay(s.dueDate) < today);
  const dueToday = schedules.filter((s) => startOfDay(s.dueDate).getTime() === today.getTime());
  const upcoming = schedules.filter((s) => startOfDay(s.dueDate) >= tomorrow);

  return (
    <div>
      <div className="breadcrumbs"><Link href="/">Início</Link> &gt; Revisão</div>
      <h1>Calendário de revisão</h1>
      <p>Sempre que você erra uma questão, o tema dela entra nesta fila. Quando você acerta
      de novo, o tema volta a aparecer só mais adiante — como numa repetição espaçada.</p>

      {schedules.length === 0 && (
        <div className="notice">
          Nenhum tema para revisar ainda. Responda algumas questões em uma{" "}
          <Link href="/listas/nova">lista de estudo</Link> — quando errar, o tema aparece aqui.
        </div>
      )}

      <ReviewGroup title="Atrasadas" schedules={late} status="due-late" />
      <ReviewGroup title="Para hoje" schedules={dueToday} status="due-today" />
      <ReviewGroup title="Próximas revisões" schedules={upcoming} status="due-soon" />
    </div>
  );
}
