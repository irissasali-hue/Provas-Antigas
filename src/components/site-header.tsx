import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="site-banner">
        <div className="site-title">
          <Link href="/">Provas Antigas</Link>
        </div>
        <div className="site-tagline">
          Questões de ENEM e vestibulares de São Paulo — monte listas, resolva e revise por tema.
        </div>
      </div>
      <nav className="site-nav">
        <ul>
          <li><Link href="/">Início</Link></li>
          <li><Link href="/provas">Provas</Link></li>
          <li><Link href="/questoes">Questões</Link></li>
          <li><Link href="/listas">Minhas listas</Link></li>
          <li><Link href="/revisao">Revisão</Link></li>
          <li><Link href="/sobre">Sobre o projeto</Link></li>
          <li className="nav-user">
            {user ? (
              <>
                {user.name} &nbsp;
                <form action={logoutAction} style={{ display: "inline" }}>
                  <button type="submit" className="btn" style={{ fontSize: "0.8rem", padding: "0.15em 0.5em" }}>
                    Sair
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">Entrar</Link> | <Link href="/registro">Criar conta</Link>
              </>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
