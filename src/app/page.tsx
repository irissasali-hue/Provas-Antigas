import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const [examCount, questionCount, institutionCount, topicCount, user] = await Promise.all([
    db.exam.count(),
    db.question.count({ where: { status: "PUBLISHED" } }),
    db.institution.count(),
    db.topic.count(),
    getCurrentUser(),
  ]);

  const recentExams = await db.exam.findMany({
    orderBy: { year: "desc" },
    take: 5,
    include: {
      institution: true,
      _count: { select: { questions: { where: { status: "PUBLISHED" } } } },
    },
  });

  return (
    <div className="two-col">
      <div>
        <h1>Provas Antigas</h1>
        <p>
          Um acervo aberto de questões de <strong>ENEM</strong> e vestibulares do estado de
          São Paulo (FUVEST, UNICAMP, VUNESP e outros). Monte listas de estudo, resolva
          questões, classifique <em>por que</em> você errou e deixe o site te lembrar de
          revisar cada tema, com aulas do YouTube bem avaliadas pela comunidade.
        </p>

        <div className="stat-grid">
          <div className="stat-box">
            <div className="num">{examCount}</div>
            <div className="label">Provas</div>
          </div>
          <div className="stat-box">
            <div className="num">{questionCount}</div>
            <div className="label">Questões</div>
          </div>
          <div className="stat-box">
            <div className="num">{institutionCount}</div>
            <div className="label">Instituições</div>
          </div>
          <div className="stat-box">
            <div className="num">{topicCount}</div>
            <div className="label">Temas</div>
          </div>
        </div>

        <div className="box-title-bar">Provas recentes no acervo</div>
        <div className="box">
          <ul className="list-plain">
            {recentExams.map((exam) => (
              <li key={exam.id}>
                <Link href={`/provas/${exam.id}`}>
                  {exam.institution.shortName} {exam.year} — {exam.title}
                </Link>
                <div className="meta">{exam._count.questions} questões cadastradas</div>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: "1em" }}>
            <Link href="/provas" className="btn">Ver todas as provas »</Link>
          </p>
        </div>

        <div className="box-title-bar">Como funciona</div>
        <div className="box">
          <ol>
            <li>Monte uma lista filtrando por matéria, tema, instituição ou ano em <Link href="/listas/nova">Nova lista</Link>.</li>
            <li>Responda as questões. Quando errar, classifique o motivo: erro teórico, de interpretação, de cálculo, distração, falta de tempo ou chute.</li>
            <li>Acompanhe o <Link href="/revisao">calendário de revisão</Link>: os temas em que você mais erra voltam a aparecer, com aulas de YouTube recomendadas para reforçar o conteúdo.</li>
          </ol>
        </div>
      </div>

      <aside>
        <div className="box-title-bar">Comece por aqui</div>
        <div className="box">
          {user ? (
            <>
              <p>Bem-vindo(a) de volta, {user.name}.</p>
              <p><Link href="/listas/nova" className="btn btn-primary">Montar nova lista</Link></p>
              <p><Link href="/revisao">Ver minha revisão »</Link></p>
            </>
          ) : (
            <>
              <p>Crie uma conta gratuita para guardar suas listas e seu histórico de erros.</p>
              <p><Link href="/registro" className="btn btn-primary">Criar conta</Link></p>
              <p><Link href="/login">Já tenho conta »</Link></p>
            </>
          )}
        </div>

        <div className="box-title-bar">Projeto aberto</div>
        <div className="box">
          <p>O código e os dados deste site são abertos. Veja como contribuir com
          questões, provas ou vídeos em <Link href="/sobre">Sobre o projeto</Link>.</p>
        </div>
      </aside>
    </div>
  );
}
