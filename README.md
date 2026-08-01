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
cp .env.example .env  # variáveis de ambiente locais (não vêm versionadas)
npm install            # instala dependências e já gera o Prisma Client
npm run db:migrate     # cria o banco SQLite local (dev.db) e aplica o schema
npm run db:seed        # popula com matérias, provas e questões de exemplo
npm run dev            # inicia o servidor em http://localhost:3000
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

Questões novas nascem com `status: DRAFT` quando vêm do pipeline de
importação (abaixo) e só ficam visíveis no site depois de aprovadas — todas
as páginas públicas filtram por `status: PUBLISHED`.

## Importando provas com IA

Para provas em **PDF com texto selecionável**, dá para extrair as questões
automaticamente com ajuda de um modelo de IA (Claude), em vez de digitar
tudo na mão:

```bash
npm run import:exam -- \
  --pdf caminho/da/prova.pdf \
  --instituicao FUVEST \
  --ano 2024 \
  --titulo "Prova objetiva" \
  --fase "1ª fase" \
  --gabarito caminho/do/gabarito.txt
```

- `--instituicao` precisa bater com o `shortName` de uma instituição já
  cadastrada (ENEM, FUVEST, UNICAMP, VUNESP no seed).
- `--gabarito` é opcional: um `.txt` com uma questão por linha, no formato
  `1 B`, `1-B` ou `1) B`. Sem gabarito, a IA só marca a alternativa correta
  quando tem certeza (senão fica em branco pra você preencher na revisão).
- Requer `ANTHROPIC_API_KEY` configurada no `.env` (veja `.env.example`).

O script:
1. Extrai o texto do PDF por página (`pdf-parse`).
2. Extrai as imagens embutidas no PDF (figuras/gráficos), quando existirem.
   **Isso cobre bem o caso comum de fotos incorporadas, mas não é perfeito**
   — desenhos vetoriais complexos podem não ser capturados; nesse caso, dá
   pra colar a imagem manualmente na revisão.
3. Manda o texto pro Claude pedindo o enunciado, alternativas, matéria/tema
   (reaproveitando a taxonomia já cadastrada quando possível) e, se souber,
   a alternativa correta.
4. Grava tudo como **rascunho** (`status: DRAFT`) — nada aparece no site
   ainda.

Depois, revise em `/admin/importacoes` (é preciso ser administrador — veja
abaixo). Lá dá pra editar o enunciado, ajustar matéria/tema/gabarito,
escolher a imagem certa entre as extraídas e só então **aprovar e publicar**
questão por questão, ou descartar as que saíram erradas.

Para virar administrador:

```bash
npm run make-admin -- seu-email@exemplo.com
```

(a conta precisa já existir — crie pelo site em "Criar conta" primeiro).

## Contribuindo

Este é um projeto aberto e a ideia é que a comunidade mantenha o acervo
atualizado. Formas de contribuir:

- **Questões e provas novas**: use o pipeline de importação acima, ou
  adicione direto ao banco seguindo o formato usado em `prisma/seed.ts`.
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
