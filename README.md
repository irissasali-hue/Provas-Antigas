# Provas Antigas

Acervo aberto de questões de **ENEM** e dos principais vestibulares do estado
de São Paulo (FUVEST, UNICAMP, VUNESP e outros). O site deixa montar listas
de estudo filtrando por matéria, tema, instituição ou ano, resolver as
questões, classificar *por que* você errou (erro teórico, de interpretação,
de cálculo, distração, falta de tempo ou chute) e acompanhar um calendário
de revisão por tema, com aulas de YouTube recomendadas.

O design é propositalmente simples e denso em informação — o objetivo é
parecer um site "de internet" (tipografia serifada, links azuis, caixas com
borda), não um aplicativo genérico estilo Material Design.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript, sem Tailwind — CSS
  próprio em `src/app/globals.css`.
- [Prisma](https://www.prisma.io) + SQLite (via `@prisma/adapter-better-sqlite3`)
  como banco de dados.
- Autenticação simples e própria (sem NextAuth): sessão por cookie httpOnly +
  senha com `bcryptjs`. Veja `src/lib/auth.ts`.
- Toda mutação de dados é feita com Server Actions (`src/app/actions/*`), com
  progressive enhancement — os formulários funcionam mesmo sem JavaScript.

## Rodando localmente

Pré-requisitos: Node.js 20+.

```bash
npm install        # instala dependências e já gera o Prisma Client
npm run db:migrate  # cria o banco SQLite local (prisma/dev.db) e aplica o schema
npm run db:seed     # popula com matérias, provas e questões de exemplo
npm run dev          # inicia o servidor em http://localhost:3000
```

Um usuário de demonstração é criado pelo seed:
`demo@provasantigas.exemplo` / senha `demo1234`.

Outros comandos úteis:

```bash
npm run build       # build de produção
npm run lint         # eslint
npm run db:studio   # abre o Prisma Studio para inspecionar o banco
```

## Estrutura de dados (resumo)

- `Institution` / `Exam` / `Question` / `Alternative` — as provas e suas
  questões, cada uma ligada a uma `Subject` (matéria) e opcionalmente a um
  `Topic` (tema).
- `StudyList` / `StudyListItem` — as listas de estudo que cada usuário monta.
- `Attempt` — cada resposta dada pelo usuário, com o resultado e, quando
  errada, o `ErrorType` escolhido por ele.
- `ReviewSchedule` — a fila de revisão por tema, calculada com uma repetição
  espaçada simples (tipo Leitner): errar um tema volta o estágio para o
  início; acertar avança para o próximo intervalo. Veja `src/lib/review.ts`.
- `Video` — vídeos do YouTube recomendados por tema.

O schema completo está em `prisma/schema.prisma`.

## Contribuindo

Este é um projeto aberto e a ideia é que a comunidade mantenha o acervo
atualizado. Formas de contribuir:

- **Questões e provas novas**: adicione ao banco seguindo o formato usado em
  `prisma/seed.ts`, ou escreva um script de importação próprio em
  `prisma/` a partir de uma fonte de dados (PDF, planilha, API).
- **Vídeos recomendados**: adicione entradas em `Video` apontando para aulas
  de boa qualidade sobre cada tema.
- **Código**: abra uma issue ou pull request. Mudanças de schema devem vir
  acompanhadas de uma migration (`npx prisma migrate dev --name ...`).

### Fontes e licenciamento

As provas do ENEM são elaboradas pelo INEP (órgão do governo federal) e, via
de regra, são publicadas oficialmente para uso livre — ainda assim, sempre
vale conferir a fonte original antes de redistribuir. Provas de vestibulares
estaduais (FUVEST, UNICAMP, VUNESP) pertencem às respectivas instituições;
este projeto aponta para as fontes oficiais (`Exam.pdfUrl` /
`Exam.answerKeyUrl`) em vez de hospedar cópias não autorizadas dos cadernos
completos. Os dados de exemplo em `prisma/seed.ts` são questões escritas
para fins de demonstração, não transcrições de provas reais.
