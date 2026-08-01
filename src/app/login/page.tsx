import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export const metadata = { title: "Entrar — Provas Antigas" };

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const erro = typeof searchParams.erro === "string" ? searchParams.erro : null;

  return (
    <div className="two-col">
      <div>
        <div className="breadcrumbs"><Link href="/">Início</Link> &gt; Entrar</div>
        <h1>Entrar</h1>

        {erro && <div className="notice bad">{erro}</div>}

        <div className="box">
          <form action={loginAction}>
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" name="email" required />

            <label htmlFor="password">Senha</label>
            <input type="password" id="password" name="password" required />

            <p style={{ marginTop: "1em" }}>
              <button type="submit" className="btn btn-primary">Entrar</button>
            </p>
          </form>
          <p className="meta">
            Ainda não tem conta? <Link href="/registro">Crie uma agora</Link>.
          </p>
        </div>
      </div>

      <aside>
        <div className="box-title-bar">Por que criar conta?</div>
        <div className="box">
          <p>Sua conta guarda suas listas de estudo, suas respostas e a classificação dos
          seus erros, para montar seu calendário de revisão pessoal.</p>
        </div>
      </aside>
    </div>
  );
}
