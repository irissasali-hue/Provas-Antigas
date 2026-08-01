import Link from "next/link";
import { registerAction } from "@/app/actions/auth";

export const metadata = { title: "Criar conta — Provas Antigas" };

export default async function RegistroPage(props: PageProps<"/registro">) {
  const searchParams = await props.searchParams;
  const erro = typeof searchParams.erro === "string" ? searchParams.erro : null;

  return (
    <div className="two-col">
      <div>
        <div className="breadcrumbs"><Link href="/">Início</Link> &gt; Criar conta</div>
        <h1>Criar conta</h1>

        {erro && <div className="notice bad">{erro}</div>}

        <div className="box">
          <form action={registerAction}>
            <label htmlFor="name">Nome</label>
            <input type="text" id="name" name="name" required />

            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" name="email" required />

            <label htmlFor="password">Senha (mínimo 6 caracteres)</label>
            <input type="password" id="password" name="password" required minLength={6} />

            <p style={{ marginTop: "1em" }}>
              <button type="submit" className="btn btn-primary">Criar conta</button>
            </p>
          </form>
          <p className="meta">
            Já tem conta? <Link href="/login">Entre aqui</Link>.
          </p>
        </div>
      </div>

      <aside>
        <div className="box-title-bar">Projeto aberto</div>
        <div className="box">
          <p>Não usamos seus dados para nada além de guardar seu progresso de estudo.
          Veja mais em <Link href="/sobre">Sobre o projeto</Link>.</p>
        </div>
      </aside>
    </div>
  );
}
