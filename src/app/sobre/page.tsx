import Link from "next/link";

export const metadata = { title: "Sobre o projeto — Provas Antigas" };

export default function SobrePage() {
  return (
    <div>
      <div className="breadcrumbs"><Link href="/">Início</Link> &gt; Sobre o projeto</div>
      <h1>Sobre o projeto</h1>

      <p>
        <strong>Provas Antigas</strong> é um projeto aberto que reúne questões de ENEM e dos
        principais vestibulares do estado de São Paulo — FUVEST, UNICAMP, VUNESP e outros —
        em um só lugar. A ideia é simples: em vez de caçar PDFs espalhados, você monta listas
        de questões por matéria, tema, instituição ou ano, resolve, e o site te ajuda a
        entender <em>por que</em> você errou e quando vale a pena revisar cada assunto de novo.
      </p>

      <div className="box-title-bar">O que o site faz</div>
      <div className="box">
        <ul>
          <li>Organiza provas antigas na íntegra, com link para o caderno original e gabarito.</li>
          <li>Deixa montar listas de estudo filtrando o banco de questões.</li>
          <li>Depois de errar uma questão, pede para você classificar o motivo: erro teórico,
          de interpretação, de cálculo, distração, falta de tempo ou chute.</li>
          <li>Usa essas classificações para montar um calendário pessoal de revisão por tema,
          com aulas de YouTube recomendadas para cada assunto.</li>
        </ul>
      </div>

      <div className="box-title-bar">Projeto aberto</div>
      <div className="box">
        <p>
          O código deste site é aberto e qualquer pessoa pode contribuir: adicionando novas
          questões, cadastrando provas, corrigindo gabaritos ou sugerindo vídeos de boa
          qualidade para cada tema. O objetivo é que a comunidade de estudantes mantenha o
          acervo atualizado — em vez de depender de um serviço fechado.
        </p>
        <p>
          Quer contribuir com questões, provas ou vídeos? Abra uma issue ou um pull request
          no repositório do projeto no GitHub.
        </p>
      </div>

      <div className="box-title-bar">Fontes e licenciamento</div>
      <div className="box">
        <p>
          As provas do ENEM são elaboradas pelo INEP, órgão do governo federal, e via de
          regra são publicadas oficialmente para uso livre; ainda assim, sempre vale conferir
          a fonte original. Provas de vestibulares estaduais (FUVEST, UNICAMP, VUNESP) são de
          titularidade das respectivas instituições — este site aponta para as fontes
          oficiais e não hospeda cópias não autorizadas dos cadernos completos. Se você é
          titular de algum conteúdo e tem dúvidas sobre como ele é usado aqui, entre em
          contato pelo repositório do projeto.
        </p>
      </div>

      <div className="box-title-bar">Privacidade</div>
      <div className="box">
        <p>
          Guardamos apenas o necessário para o site funcionar: seu nome, e-mail, as listas
          que você monta e as respostas que você dá às questões (incluindo a classificação
          de erros), para calcular seu calendário de revisão. Nada disso é vendido ou
          compartilhado com terceiros.
        </p>
      </div>
    </div>
  );
}
