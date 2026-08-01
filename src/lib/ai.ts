import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Copie .env.example para .env, crie uma chave em " +
        "https://console.anthropic.com e cole ela lá.",
    );
  }
  return new Anthropic({ apiKey });
}

export const EXTRACTION_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
