import "dotenv/config";
import { db } from "../src/lib/db";

// ---------------------------------------------------------------------------
// Dados de exemplo para desenvolvimento e demonstração.
//
// As questões abaixo são escritas pelo próprio projeto (não são transcrições
// literais de provas reais) apenas para popular a interface. Para um banco
// de dados de verdade, use os scripts de importação e respeite a licença de
// cada instituição — veja o README na seção "Fontes e licenciamento".
// ---------------------------------------------------------------------------

async function main() {
  console.log("Limpando dados existentes...");
  await db.attempt.deleteMany();
  await db.reviewSchedule.deleteMany();
  await db.studyListItem.deleteMany();
  await db.studyList.deleteMany();
  await db.video.deleteMany();
  await db.alternative.deleteMany();
  await db.question.deleteMany();
  await db.exam.deleteMany();
  await db.institution.deleteMany();
  await db.topic.deleteMany();
  await db.subject.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();

  console.log("Criando matérias e temas...");
  const subjectsData: Record<string, string[]> = {
    "Matemática": ["Funções", "Geometria Plana", "Estatística e Probabilidade", "Porcentagem e Razões"],
    "Português": ["Interpretação de Texto", "Gramática e Norma Culta", "Literatura"],
    "Física": ["Mecânica", "Eletricidade", "Termologia"],
    "Química": ["Química Orgânica", "Estequiometria"],
    "Biologia": ["Ecologia", "Genética"],
    "História": ["Brasil República", "História Geral"],
    "Geografia": ["Geopolítica", "Geografia do Brasil"],
  };

  const topicsBySlug: Record<string, string> = {};

  for (const [subjectName, topics] of Object.entries(subjectsData)) {
    const subject = await db.subject.create({
      data: {
        name: subjectName,
        slug: slugify(subjectName),
      },
    });
    for (const topicName of topics) {
      const slug = slugify(`${subjectName}-${topicName}`);
      const topic = await db.topic.create({
        data: { name: topicName, slug, subjectId: subject.id },
      });
      topicsBySlug[`${subjectName}::${topicName}`] = topic.id;
    }
  }

  console.log("Criando instituições...");
  const inep = await db.institution.create({
    data: { name: "ENEM (INEP)", shortName: "ENEM", siteUrl: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem" },
  });
  const fuvest = await db.institution.create({
    data: { name: "FUVEST (USP)", shortName: "FUVEST", siteUrl: "https://www.fuvest.br" },
  });
  const comvest = await db.institution.create({
    data: { name: "COMVEST (UNICAMP)", shortName: "UNICAMP", siteUrl: "https://www.comvest.unicamp.br" },
  });
  const vunesp = await db.institution.create({
    data: { name: "VUNESP (UNESP)", shortName: "VUNESP", siteUrl: "https://www.vunesp.com.br" },
  });

  console.log("Criando provas e questões de exemplo...");

  const examEnem2015 = await db.exam.create({
    data: {
      institutionId: inep.id,
      year: 2015,
      phase: "Dia 1 — Caderno Azul",
      title: "Linguagens, Códigos e Ciências Humanas",
      description: "Exemplo de exame para demonstração do site.",
    },
  });

  const examFuvest2020 = await db.exam.create({
    data: {
      institutionId: fuvest.id,
      year: 2020,
      phase: "1ª fase",
      title: "Prova objetiva",
      description: "Exemplo de exame para demonstração do site.",
    },
  });

  const examUnicamp2019 = await db.exam.create({
    data: {
      institutionId: comvest.id,
      year: 2019,
      phase: "1ª fase",
      title: "Prova objetiva e discursiva",
      description: "Exemplo de exame para demonstração do site.",
    },
  });

  const examVunesp2021 = await db.exam.create({
    data: {
      institutionId: vunesp.id,
      year: 2021,
      phase: "1ª fase",
      title: "Prova objetiva — UNESP",
      description: "Exemplo de exame para demonstração do site.",
    },
  });

  type AltDef = { letter: string; text: string };
  type QDef = {
    exam: { id: string };
    number: number;
    statement: string;
    subject: string;
    topic: string;
    correctLetter: string;
    alternatives: AltDef[];
  };

  const questions: QDef[] = [
    {
      exam: examEnem2015,
      number: 1,
      subject: "Português",
      topic: "Interpretação de Texto",
      statement:
        "Um cronista descreve, em tom bem-humorado, a rotina de quem pega ônibus lotado todos os dias, comparando a disputa por um lugar sentado a uma verdadeira maratona. O efeito de humor do texto se sustenta principalmente:",
      correctLetter: "B",
      alternatives: [
        { letter: "A", text: "na exposição de dados estatísticos sobre transporte público." },
        { letter: "B", text: "na comparação inesperada entre uma situação cotidiana e uma competição esportiva." },
        { letter: "C", text: "no uso exclusivo de linguagem técnica do transporte coletivo." },
        { letter: "D", text: "na crítica direta e sem ironia às empresas de ônibus." },
        { letter: "E", text: "na ausência de qualquer figura de linguagem." },
      ],
    },
    {
      exam: examEnem2015,
      number: 2,
      subject: "Geografia",
      topic: "Geografia do Brasil",
      statement:
        "O processo de urbanização brasileira, acelerado a partir da segunda metade do século XX, teve como uma de suas principais causas:",
      correctLetter: "A",
      alternatives: [
        { letter: "A", text: "a mecanização do campo, que reduziu a demanda por mão de obra rural." },
        { letter: "B", text: "a expansão do extrativismo vegetal na Amazônia." },
        { letter: "C", text: "o aumento da natalidade exclusivamente nas áreas urbanas." },
        { letter: "D", text: "a redução da migração inter-regional." },
        { letter: "E", text: "a criação de novas capitais estaduais." },
      ],
    },
    {
      exam: examEnem2015,
      number: 3,
      subject: "História",
      topic: "Brasil República",
      statement:
        "A Era Vargas (1930-1945) é marcada pela criação de leis trabalhistas e pelo fortalecimento do Estado na economia. Um exemplo direto dessa política é:",
      correctLetter: "B",
      alternatives: [
        { letter: "A", text: "a privatização das empresas siderúrgicas estatais." },
        { letter: "B", text: "a criação da Consolidação das Leis do Trabalho (CLT)." },
        { letter: "C", text: "o fim do voto obrigatório." },
        { letter: "D", text: "a extinção do Ministério do Trabalho." },
        { letter: "E", text: "a adoção do parlamentarismo." },
      ],
    },
    {
      exam: examFuvest2020,
      number: 1,
      subject: "Matemática",
      topic: "Funções",
      statement:
        "Uma empresa modela seu lucro mensal, em milhares de reais, pela função L(x) = -2x² + 40x - 150, em que x é a quantidade de unidades vendidas (em centenas). O valor de x que maximiza o lucro é:",
      correctLetter: "C",
      alternatives: [
        { letter: "A", text: "5" },
        { letter: "B", text: "8" },
        { letter: "C", text: "10" },
        { letter: "D", text: "15" },
        { letter: "E", text: "20" },
      ],
    },
    {
      exam: examFuvest2020,
      number: 2,
      subject: "Química",
      topic: "Estequiometria",
      statement:
        "Na reação de combustão completa do metano (CH₄ + 2 O₂ → CO₂ + 2 H₂O), a quantidade, em mol, de O₂ necessária para queimar completamente 3 mol de CH₄ é:",
      correctLetter: "D",
      alternatives: [
        { letter: "A", text: "1,5 mol" },
        { letter: "B", text: "3 mol" },
        { letter: "C", text: "4 mol" },
        { letter: "D", text: "6 mol" },
        { letter: "E", text: "9 mol" },
      ],
    },
    {
      exam: examFuvest2020,
      number: 3,
      subject: "Biologia",
      topic: "Genética",
      statement:
        "Em uma espécie hipotética, o alelo A (dominante) determina flores vermelhas e o alelo a (recessivo) determina flores brancas. Do cruzamento entre dois indivíduos heterozigotos (Aa x Aa), a proporção esperada de descendentes com flores brancas é:",
      correctLetter: "B",
      alternatives: [
        { letter: "A", text: "0%" },
        { letter: "B", text: "25%" },
        { letter: "C", text: "50%" },
        { letter: "D", text: "75%" },
        { letter: "E", text: "100%" },
      ],
    },
    {
      exam: examUnicamp2019,
      number: 1,
      subject: "Física",
      topic: "Mecânica",
      statement:
        "Um corpo de massa 2 kg parte do repouso e é acelerado uniformemente a 4 m/s² durante 5 segundos. A velocidade final do corpo, em m/s, é:",
      correctLetter: "C",
      alternatives: [
        { letter: "A", text: "8" },
        { letter: "B", text: "10" },
        { letter: "C", text: "20" },
        { letter: "D", text: "40" },
        { letter: "E", text: "100" },
      ],
    },
    {
      exam: examUnicamp2019,
      number: 2,
      subject: "Português",
      topic: "Gramática e Norma Culta",
      statement:
        "Assinale a alternativa em que a concordância verbal está de acordo com a norma-padrão da língua portuguesa:",
      correctLetter: "C",
      alternatives: [
        { letter: "A", text: "Fazem dois anos que ele não vem aqui." },
        { letter: "B", text: "Houveram muitos problemas na organização do evento." },
        { letter: "C", text: "Faz dois anos que ele não vem aqui." },
        { letter: "D", text: "Vai fazer dois anos que ele não vêm aqui." },
        { letter: "E", text: "Deve haver muitas dúvidas, pois é um tema novo, deverão ser explicadas." },
      ],
    },
    {
      exam: examUnicamp2019,
      number: 3,
      subject: "Matemática",
      topic: "Estatística e Probabilidade",
      statement:
        "Em uma urna há 4 bolas vermelhas e 6 bolas azuis. Retirando-se uma bola ao acaso, a probabilidade de ela ser vermelha é:",
      correctLetter: "C",
      alternatives: [
        { letter: "A", text: "10%" },
        { letter: "B", text: "20%" },
        { letter: "C", text: "40%" },
        { letter: "D", text: "60%" },
        { letter: "E", text: "80%" },
      ],
    },
    {
      exam: examVunesp2021,
      number: 1,
      subject: "Geografia",
      topic: "Geopolítica",
      statement:
        "O conceito de \"multipolaridade\" nas relações internacionais contemporâneas refere-se principalmente:",
      correctLetter: "B",
      alternatives: [
        { letter: "A", text: "à existência de uma única potência hegemônica global." },
        { letter: "B", text: "à distribuição de poder entre vários centros de influência (Estados ou blocos)." },
        { letter: "C", text: "ao fim completo dos organismos multilaterais." },
        { letter: "D", text: "à unificação de todos os países sob um só governo." },
        { letter: "E", text: "à ausência de qualquer disputa geopolítica." },
      ],
    },
    {
      exam: examVunesp2021,
      number: 2,
      subject: "Biologia",
      topic: "Ecologia",
      statement:
        "Em uma cadeia alimentar simplificada capim → gafanhoto → sapo → cobra → gavião, o gafanhoto ocupa o nível trófico de:",
      correctLetter: "B",
      alternatives: [
        { letter: "A", text: "produtor" },
        { letter: "B", text: "consumidor primário" },
        { letter: "C", text: "consumidor secundário" },
        { letter: "D", text: "consumidor terciário" },
        { letter: "E", text: "decompositor" },
      ],
    },
    {
      exam: examVunesp2021,
      number: 3,
      subject: "Matemática",
      topic: "Geometria Plana",
      statement:
        "Um terreno retangular tem 12 m de comprimento por 8 m de largura. A área desse terreno, em m², é:",
      correctLetter: "D",
      alternatives: [
        { letter: "A", text: "20" },
        { letter: "B", text: "40" },
        { letter: "C", text: "80" },
        { letter: "D", text: "96" },
        { letter: "E", text: "144" },
      ],
    },
  ];

  const subjectIdByName: Record<string, string> = {};
  for (const name of Object.keys(subjectsData)) {
    const s = await db.subject.findUniqueOrThrow({ where: { name } });
    subjectIdByName[name] = s.id;
  }

  for (const q of questions) {
    const topicId = topicsBySlug[`${q.subject}::${q.topic}`];
    const alternatives = q.alternatives.map((a) => ({
      letter: a.letter,
      text: a.text,
      isCorrect: a.letter === q.correctLetter,
    }));

    await db.question.create({
      data: {
        examId: q.exam.id,
        number: q.number,
        statement: q.statement,
        subjectId: subjectIdByName[q.subject],
        topicId,
        alternatives: { create: alternatives },
      },
    });
  }

  console.log("Cadastrando vídeos recomendados por tema...");
  const videoSeeds: Array<{ subject: string; topic: string; title: string; channel: string; rating: number; votes: number }> = [
    { subject: "Matemática", topic: "Funções", title: "Função do 2º grau — teoria e exercícios", channel: "Canal educativo de Matemática", rating: 4.8, votes: 320 },
    { subject: "Matemática", topic: "Geometria Plana", title: "Áreas de figuras planas na prática", channel: "Canal educativo de Matemática", rating: 4.6, votes: 210 },
    { subject: "Matemática", topic: "Estatística e Probabilidade", title: "Probabilidade básica para vestibular", channel: "Canal educativo de Matemática", rating: 4.7, votes: 180 },
    { subject: "Português", topic: "Interpretação de Texto", title: "Estratégias de interpretação de texto para o ENEM", channel: "Canal educativo de Português", rating: 4.9, votes: 540 },
    { subject: "Português", topic: "Gramática e Norma Culta", title: "Concordância verbal sem decoreba", channel: "Canal educativo de Português", rating: 4.5, votes: 260 },
    { subject: "Física", topic: "Mecânica", title: "Cinemática: movimento uniformemente variado", channel: "Canal educativo de Física", rating: 4.7, votes: 300 },
    { subject: "Química", topic: "Estequiometria", title: "Estequiometria passo a passo", channel: "Canal educativo de Química", rating: 4.6, votes: 190 },
    { subject: "Biologia", topic: "Genética", title: "1ª Lei de Mendel explicada com exemplos", channel: "Canal educativo de Biologia", rating: 4.8, votes: 400 },
    { subject: "Biologia", topic: "Ecologia", title: "Cadeias e teias alimentares", channel: "Canal educativo de Biologia", rating: 4.4, votes: 150 },
    { subject: "História", topic: "Brasil República", title: "Era Vargas: resumo completo", channel: "Canal educativo de História", rating: 4.7, votes: 280 },
    { subject: "Geografia", topic: "Geografia do Brasil", title: "Urbanização brasileira: causas e consequências", channel: "Canal educativo de Geografia", rating: 4.5, votes: 170 },
    { subject: "Geografia", topic: "Geopolítica", title: "Ordem mundial multipolar: o que é", channel: "Canal educativo de Geografia", rating: 4.3, votes: 120 },
  ];

  for (const v of videoSeeds) {
    const topicId = topicsBySlug[`${v.subject}::${v.topic}`];
    await db.video.create({
      data: {
        topicId,
        title: v.title,
        channel: v.channel,
        // Placeholder: aponta para uma busca no YouTube pelo tema. Substitua
        // por um link direto para a aula recomendada ao curar conteúdo real.
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(v.title)}`,
        rating: v.rating,
        votes: v.votes,
      },
    });
  }

  console.log("Criando usuário de demonstração...");
  const bcrypt = await import("bcryptjs");
  const demoUser = await db.user.create({
    data: {
      name: "Convidado Demo",
      email: "demo@provasantigas.exemplo",
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });
  console.log(`Usuário de demonstração: ${demoUser.email} / senha: demo1234`);

  console.log("Seed concluído.");
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
