import { ErrorType } from "@/generated/prisma/enums";

export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  ERRO_TEORICO: "Erro teórico — eu não sabia o conteúdo",
  ERRO_INTERPRETACAO: "Erro de interpretação — entendi errado o enunciado",
  ERRO_DISTRACAO: "Distração — eu sabia, mas me distraí",
  ERRO_CALCULO: "Erro de cálculo/execução",
  FALTA_DE_TEMPO: "Falta de tempo — não deu para pensar com calma",
  CHUTE: "Chute — respondi sem saber",
};

export const ERROR_TYPE_OPTIONS = Object.entries(ERROR_TYPE_LABELS).map(([value, label]) => ({
  value: value as ErrorType,
  label,
}));
