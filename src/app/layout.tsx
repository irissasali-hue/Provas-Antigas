import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Provas Antigas — ENEM e vestibulares de São Paulo",
  description:
    "Banco de questões de provas antigas do ENEM e vestibulares paulistas (FUVEST, UNICAMP, VUNESP). Monte listas, classifique seus erros e revise por tema com vídeos recomendados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <SiteHeader />
        <main className="page">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
