import { z } from "zod";
import { getAnthropicClient, EXTRACTION_MODEL } from "@/lib/ai";

export const ExtractedAlternativeSchema = z.object({
  letter: z.enum(["A", "B", "C", "D", "E", "F"]),
  text: z.string().min(1),
});

export const ExtractedQuestionSchema = z.object({
  number: z.number().int().positive(),
  page: z.number().int().positive().nullable(),
  statement: z.string().min(1),
  hasFigure: z.boolean(),
  alternatives: z.array(ExtractedAlternativeSchema).min(2).max(6),
  correctLetter: z.string().nullable(),
  subject: z.string().min(1),
  topic: z.string().nullable(),
});

export const ExtractionResultSchema = z.object({
  questions: z.array(ExtractedQuestionSchema),
  warnings: z.array(z.string()).default([]),
});

export type ExtractedQuestion = z.infer<typeof ExtractedQuestionSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

const EXTRACTION_TOOL = {
  name: "registrar_questoes",
  description: "Registra as questões extraídas da prova em formato estruturado.",
  input_schema: {
    type: "object" as const,
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            number: { type: "integer", description: "Número da questão impresso no caderno." },
            page: { type: ["integer", "null"], description: "Página (a partir de 1) onde a questão começa, ou null se não souber." },
            statement: { type: "string", description: "Enunciado completo da questão." },
            hasFigure: { type: "boolean", description: "true se o enunciado menciona ou depende de figura/gráfico/tabela/imagem." },
            alternatives: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  letter: { type: "string", description: "Letra da alternativa (A, B, C, D, E...)." },
                  text: { type: "string" },
                },
                required: ["letter", "text"],
              },
            },
            correctLetter: { type: ["string", "null"], description: "Letra da alternativa correta, se souber (ex.: pelo gabarito fornecido); senão null." },
            subject: { type: "string", description: "Nome da matéria. Use um nome da lista de matérias existentes sempre que possível." },
            topic: { type: ["string", "null"], description: "Nome do tema/assunto específico dentro da matéria. Use um nome da lista de temas existentes sempre que possível; null se não for possível classificar." },
          },
          required: ["number", "page", "statement", "hasFigure", "alternatives", "correctLetter", "subject", "topic"],
        },
      },
      warnings: {
        type: "array",
        items: { type: "string" },
        description: "Avisos gerais sobre a extração (ex.: questões anuladas, páginas ilegíveis, questões discursivas fora do padrão de múltipla escolha).",
      },
    },
    required: ["questions", "warnings"],
  },
};

export type TaxonomyEntry = { subject: string; topics: string[] };

export async function extractQuestionsFromText(params: {
  examLabel: string;
  pagedText: string;
  taxonomy: TaxonomyEntry[];
  gabarito: Map<number, string> | null;
}): Promise<ExtractionResult> {
  const client = getAnthropicClient();

  const taxonomyText = params.taxonomy
    .map((t) => `- ${t.subject}: ${t.topics.join(", ") || "(sem temas cadastrados ainda)"}`)
    .join("\n");

  const gabaritoText = params.gabarito
    ? Array.from(params.gabarito.entries())
        .map(([n, letter]) => `${n}: ${letter}`)
        .join(", ")
    : null;

  const prompt = `Você está extraindo questões de múltipla escolha de uma prova de vestibular/ENEM
chamada "${params.examLabel}", a partir do texto extraído de um PDF (o texto de cada página
está marcado com "=== PÁGINA N ===").

Para cada questão de múltipla escolha encontrada, chame a ferramenta "registrar_questoes" com:
- o número da questão, a página onde ela começa, o enunciado completo (sem as alternativas)
  e a lista de alternativas;
- "hasFigure": true se o enunciado depender de uma figura, gráfico, tabela ou imagem (mesmo que
  o texto extraído não tenha conseguido capturar o conteúdo visual);
- "subject" e "topic": classifique a questão usando, de preferência, um nome já existente nesta
  lista de matérias/temas do site:
${taxonomyText || "(nenhuma matéria cadastrada ainda)"}
  Só proponha um nome novo se nenhum dos existentes fizer sentido.
- "correctLetter": a letra da alternativa correta, SE você souber com confiança (por exemplo,
  a partir do gabarito abaixo). Caso contrário, deixe null — não adivinhe.

${gabaritoText ? `Gabarito fornecido (questão: letra correta): ${gabaritoText}` : "Nenhum gabarito foi fornecido."}

Ignore questões discursivas/dissertativas (sem alternativas) e cabeçalhos/instruções gerais da
prova. Se uma questão estiver claramente anulada ou o enunciado estiver incompleto/ilegível no
texto extraído, inclua um aviso em "warnings" em vez de inventar conteúdo.

Texto extraído do PDF:
"""
${params.pagedText}
"""`;

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 16000,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: "registrar_questoes" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("O modelo não retornou o resultado estruturado esperado.");
  }

  return ExtractionResultSchema.parse(toolUse.input);
}
