import "dotenv/config";
import { parseArgs } from "node:util";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { db } from "../src/lib/db";
import { slugify } from "../src/lib/slugify";
import { extractQuestionsFromText, type TaxonomyEntry } from "../src/lib/extraction";
import { EXTRACTION_MODEL } from "../src/lib/ai";

// -----------------------------------------------------------------------------
// Importa uma prova a partir de um PDF com texto selecionável: extrai o texto,
// as imagens embutidas e usa um modelo de IA para estruturar as questões em
// rascunhos (status DRAFT). Nada fica visível no site até ser revisado e
// aprovado em /admin/importacoes.
//
// Uso:
//   npm run import:exam -- --pdf caminho/prova.pdf --instituicao FUVEST \
//     --ano 2024 --titulo "Prova objetiva" [--fase "1ª fase"] \
//     [--gabarito caminho/gabarito.txt]
//
// Formato do arquivo de gabarito (opcional, texto simples): uma questão por
// linha, ex.: "1 B" ou "1-B" ou "1) B".
// -----------------------------------------------------------------------------

function parseGabarito(raw: string): Map<number, string> {
  const map = new Map<number, string>();
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/(\d+)\D+([A-Fa-f])\b/);
    if (match) {
      map.set(Number(match[1]), match[2].toUpperCase());
    }
  }
  return map;
}

async function findOrCreateSubject(name: string) {
  const existing = await db.subject.findFirst({
    where: { name: { equals: name } },
  });
  if (existing) return existing;

  const bySlug = await db.subject.findUnique({ where: { slug: slugify(name) } });
  if (bySlug) return bySlug;

  return db.subject.create({ data: { name, slug: slugify(name) } });
}

async function findOrCreateTopic(subjectId: string, subjectName: string, name: string) {
  const existing = await db.topic.findFirst({ where: { subjectId, name: { equals: name } } });
  if (existing) return existing;

  const slug = slugify(`${subjectName}-${name}`);
  const bySlug = await db.topic.findUnique({ where: { slug } });
  if (bySlug) return bySlug;

  return db.topic.create({ data: { subjectId, name, slug } });
}

async function main() {
  const { values } = parseArgs({
    options: {
      pdf: { type: "string" },
      instituicao: { type: "string" },
      ano: { type: "string" },
      titulo: { type: "string" },
      fase: { type: "string" },
      gabarito: { type: "string" },
      descricao: { type: "string" },
    },
  });

  if (!values.pdf || !values.instituicao || !values.ano || !values.titulo) {
    console.error(
      "Uso: npm run import:exam -- --pdf <arquivo.pdf> --instituicao <sigla> --ano <ano> --titulo <titulo> [--fase <fase>] [--gabarito <arquivo.txt>] [--descricao <texto>]",
    );
    process.exitCode = 1;
    return;
  }

  const allInstitutions = await db.institution.findMany();
  const wantedInstitution = values.instituicao.trim().toLowerCase();
  const institution = allInstitutions.find((i) => i.shortName.toLowerCase() === wantedInstitution);
  if (!institution) {
    console.error(
      `Instituição "${values.instituicao}" não encontrada. Cadastradas: ${allInstitutions.map((i) => i.shortName).join(", ") || "(nenhuma)"}`,
    );
    process.exitCode = 1;
    return;
  }

  const year = Number(values.ano);
  if (!Number.isInteger(year)) {
    console.error(`Ano inválido: ${values.ano}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Lendo PDF: ${values.pdf}`);
  const pdfBuffer = await readFile(values.pdf);

  const parser = new PDFParse({ data: pdfBuffer });
  const textResult = await parser.getText();
  const imageResult = await parser.getImage({ imageThreshold: 60 });
  await parser.destroy();

  const pagedText = textResult.pages
    .map((p) => `\n\n=== PÁGINA ${p.num} ===\n${p.text}`)
    .join("");

  console.log(
    `Texto extraído: ${textResult.total} página(s), ${pagedText.length} caracteres. Imagens encontradas: ${imageResult.pages.reduce((n, p) => n + p.images.length, 0)}.`,
  );

  let gabarito: Map<number, string> | null = null;
  if (values.gabarito) {
    const raw = await readFile(values.gabarito, "utf-8");
    gabarito = parseGabarito(raw);
    console.log(`Gabarito lido: ${gabarito.size} questão(ões).`);
  }

  const subjects = await db.subject.findMany({
    include: { topics: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  const taxonomy: TaxonomyEntry[] = subjects.map((s) => ({
    subject: s.name,
    topics: s.topics.map((t) => t.name),
  }));

  console.log(`Chamando ${EXTRACTION_MODEL} para estruturar as questões...`);
  const extraction = await extractQuestionsFromText({
    examLabel: `${institution.shortName} ${year} — ${values.titulo}`,
    pagedText,
    taxonomy,
    gabarito,
  });

  console.log(`IA extraiu ${extraction.questions.length} questão(ões).`);
  if (extraction.warnings.length > 0) {
    console.log("Avisos da IA:");
    for (const w of extraction.warnings) console.log(`  - ${w}`);
  }

  let exam = await db.exam.findFirst({
    where: { institutionId: institution.id, year, title: values.titulo },
  });
  if (!exam) {
    exam = await db.exam.create({
      data: {
        institutionId: institution.id,
        year,
        title: values.titulo,
        phase: values.fase ?? null,
        description: values.descricao ?? null,
      },
    });
    console.log(`Prova criada: ${exam.id}`);
  } else {
    console.log(`Reaproveitando prova existente: ${exam.id}`);
  }

  const job = await db.importJob.create({
    data: {
      examId: exam.id,
      sourceFileName: path.basename(values.pdf),
      model: EXTRACTION_MODEL,
    },
  });

  const uploadDir = path.join(process.cwd(), "public", "uploads", "imports", job.id);
  await mkdir(uploadDir, { recursive: true });

  const savedImagesByPage = new Map<number, string[]>();
  for (const page of imageResult.pages) {
    const paths: string[] = [];
    for (const [idx, image] of page.images.entries()) {
      const ext = image.dataUrl.match(/^data:image\/(\w+);/)?.[1] ?? "png";
      const fileName = `page${page.pageNumber}-img${idx + 1}.${ext}`;
      await writeFile(path.join(uploadDir, fileName), image.data);
      const webPath = `/uploads/imports/${job.id}/${fileName}`;
      await db.importedImage.create({
        data: { importJobId: job.id, filePath: webPath, pageNumber: page.pageNumber },
      });
      paths.push(webPath);
    }
    if (paths.length > 0) savedImagesByPage.set(page.pageNumber, paths);
  }

  const notes: string[] = [...extraction.warnings];
  let created = 0;
  let skipped = 0;
  let autoAssignedImages = 0;

  for (const q of extraction.questions) {
    const existingQuestion = await db.question.findUnique({
      where: { examId_number: { examId: exam.id, number: q.number } },
    });
    if (existingQuestion) {
      notes.push(`Questão ${q.number} já existia nesta prova — pulada.`);
      skipped += 1;
      continue;
    }

    const subject = await findOrCreateSubject(q.subject.trim());
    const topic = q.topic?.trim()
      ? await findOrCreateTopic(subject.id, subject.name, q.topic.trim())
      : null;

    const correctLetter = gabarito?.get(q.number) ?? q.correctLetter;

    const question = await db.question.create({
      data: {
        examId: exam.id,
        number: q.number,
        statement: q.statement,
        subjectId: subject.id,
        topicId: topic?.id ?? null,
        status: "DRAFT",
        importJobId: job.id,
        alternatives: {
          create: q.alternatives.map((a) => ({
            letter: a.letter,
            text: a.text,
            isCorrect: !!correctLetter && a.letter.toUpperCase() === correctLetter.toUpperCase(),
          })),
        },
      },
    });
    created += 1;

    if (q.hasFigure && q.page) {
      const candidates = savedImagesByPage.get(q.page);
      if (candidates?.length === 1) {
        const claimed = await db.importedImage.updateMany({
          where: { filePath: candidates[0], assignedQuestionId: null },
          data: { assignedQuestionId: question.id },
        });
        if (claimed.count > 0) {
          await db.question.update({ where: { id: question.id }, data: { imageUrl: candidates[0] } });
          autoAssignedImages += 1;
        } else {
          notes.push(`Questão ${q.number}: a imagem da página ${q.page} já estava associada a outra questão — escolha manualmente na revisão.`);
        }
      } else if (!candidates) {
        notes.push(`Questão ${q.number}: parece ter figura, mas nenhuma imagem foi encontrada na página ${q.page}.`);
      } else {
        notes.push(`Questão ${q.number}: há ${candidates.length} imagens na página ${q.page} — escolha manualmente na revisão.`);
      }
    }
  }

  await db.importJob.update({ where: { id: job.id }, data: { notes: notes.join("\n") || null } });

  console.log("");
  console.log(`Concluído: ${created} questão(ões) criada(s) como rascunho, ${skipped} pulada(s) (já existiam).`);
  console.log(`Imagens: ${autoAssignedImages} associada(s) automaticamente, revise as demais na tela de importação.`);
  console.log(`Revise e publique em: /admin/importacoes/${job.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
