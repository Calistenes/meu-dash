import { Colaborador, CalculoResultado, ConfiguracoesCiclo } from '../types';

export function capitalizarNome(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const FRASES_MOTIVACIONAIS = [
  "A excelência no detalhe é o que diferencia um bom profissional de um extraordinário.",
  "O capricho de hoje evita o retrabalho de amanhã. Vamos pra cima!",
  "O sucesso da operação está nas suas mãos. Cada atendimento conta!",
  "Não é apenas sobre velocidade, é sobre fazer bem feito e com qualidade.",
  "O seu esforço diário é o que garante a nossa qualidade em campo. Confio no seu trabalho!",
  "Com foco na qualidade e disciplina diária, nenhuma meta fica distante!",
  "Superar desafios em campo faz parte da nossa essência de campeões."
];

export function calcularAtingimentoEBonus(
  colaboradores: Colaborador[],
  config: ConfiguracoesCiclo,
  telefonesMapa: Record<string, string> = {}
): CalculoResultado[] {
  const { diasUteisRestantes, metaPadrao, mesAno } = config;

  // 1. Filtrar elegíveis (statusMes === "-" ou vazio)
  const elegiveis = colaboradores.filter((c) => {
    const status = (c.statusMes || '-').trim();
    return status === '-' || status === '';
  });

  // 2. Calcular atingimento e bônus base
  const comCalculo = elegiveis.map((c) => {
    const metaTarget = c.meta > 0 ? c.meta : metaPadrao;
    const percentualAtingimento = metaTarget > 0 ? (c.pontos / metaTarget) * 100 : 0;

    const pontosFaltantes = Math.max(0, metaTarget - c.pontos);
    const pontosDiariosNecessarios =
      diasUteisRestantes > 0 ? pontosFaltantes / diasUteisRestantes : 0;

    let ritmoStatus: 'BATIDA' | 'FACIL' | 'MODERADO' | 'DESAFIADOR' | 'CRITICO' = 'MODERADO';
    if (pontosFaltantes === 0) {
      ritmoStatus = 'BATIDA';
    } else if (pontosDiariosNecessarios <= 2.0) {
      ritmoStatus = 'FACIL';
    } else if (pontosDiariosNecessarios <= 4.0) {
      ritmoStatus = 'MODERADO';
    } else if (pontosDiariosNecessarios <= 7.0) {
      ritmoStatus = 'DESAFIADOR';
    } else {
      ritmoStatus = 'CRITICO';
    }

    return {
      colaborador: c,
      percentualAtingimento,
      pontosFaltantes,
      pontosDiariosNecessarios,
      ritmoStatus,
    };
  });

  // 3. Ordenar para o ranking: % atingimento desc, recorrência asc
  comCalculo.sort((a, b) => {
    if (b.percentualAtingimento !== a.percentualAtingimento) {
      return b.percentualAtingimento - a.percentualAtingimento;
    }
    return a.colaborador.recPercent - b.colaborador.recPercent;
  });

  // 4. Gerar Feedbacks e Mensagem WhatsApp para cada um
  return comCalculo.map((item) => {
    const c = item.colaborador;
    const metaTarget = c.meta > 0 ? c.meta : metaPadrao;
    const primeiroNome = capitalizarNome(c.funcionario.split('-')[0].trim().split(' ')[0]);

    // Feedbacks customizados
    let feedbackOrientativo = '';
    let feedbackIncentivo = '';

    if (item.ritmoStatus === 'BATIDA') {
      feedbackOrientativo = `Parabéns! Sua meta de ${metaTarget} pontos já foi atingida (${item.percentualAtingimento.toFixed(1)}%). Mantenha o foco em evitar infrações de qualidade e manter a recorrência abaixo de 10% para assegurar seu excelente resultado no ciclo.`;
      feedbackIncentivo = `Excelente desempenho, ${primeiroNome}! Você é referência de produtividade e qualidade no time. Continue firme para buscar/manter a liderança no ranking TOP 3!`;
    } else if (item.ritmoStatus === 'FACIL') {
      feedbackOrientativo = `Faltam apenas ${item.pontosFaltantes.toFixed(2)} pontos para os ${metaTarget} pts (${item.percentualAtingimento.toFixed(1)}%). Com ${diasUteisRestantes} dias úteis restantes, sua necessidade é de apenas ${item.pontosDiariosNecessarios.toFixed(2)} pts/dia. Realizando cerca de 1 instalação ou 2 reparos/dia você bate a meta.`;
      feedbackIncentivo = `Você está muito perto do objetivo, ${primeiroNome}! A meta está ao seu alcance. Mantenha o ritmo consistente nestes dias e garanta sua conquista!`;
    } else if (item.ritmoStatus === 'MODERADO') {
      feedbackOrientativo = `Você está com ${c.pontos.toFixed(2)} pontos (${item.percentualAtingimento.toFixed(1)}%). Para atingir os ${metaTarget} pts em ${diasUteisRestantes} dias úteis, sua meta diária é de ${item.pontosDiariosNecessarios.toFixed(2)} pts/dia. Recomenda-se focar no mix de instalações e regularizações sem gerar infrações de qualidade.`;
      feedbackIncentivo = `Boa evolução, ${primeiroNome}! Com disciplina diária nos ${diasUteisRestantes} dias úteis que restam, você tem totais condições de bater a meta e atingir o topo do ranking!`;
    } else if (item.ritmoStatus === 'DESAFIADOR') {
      feedbackOrientativo = `Você tem ${c.pontos.toFixed(2)} pontos (${item.percentualAtingimento.toFixed(1)}%) e restam ${item.pontosFaltantes.toFixed(2)} pts. Para alcançar os ${metaTarget} pts, o ritmo diário necessário nos ${diasUteisRestantes} dias úteis é de ${item.pontosDiariosNecessarios.toFixed(2)} pts/dia. Alinhe com seu supervisor o plano de rotas e suporte de materiais.`;
      feedbackIncentivo = `Ainda há tempo, ${primeiroNome}! O desafio é acelerar o ritmo diário. Foco total em resoluções no primeiro atendimento para evitar retrabalhos de recorrência e alavancar seus pontos!`;
    } else {
      feedbackOrientativo = `Pontuação atual: ${c.pontos.toFixed(2)} pts (${item.percentualAtingimento.toFixed(1)}%). Faltam ${item.pontosFaltantes.toFixed(2)} pts (${item.pontosDiariosNecessarios.toFixed(2)} pts/dia em ${diasUteisRestantes} dias úteis). É fundamental agendar um alinhamento urgente de rotas e apoio técnico com seu supervisor.`;
      feedbackIncentivo = `Não desista, ${primeiroNome}! A liderança está à disposição para te apoiar. Cada OS finalizada com qualidade conta muito para reverter o cenário e garantir o resultado!`;
    }

    // Frase motivacional aleatória
    const fraseSorteada = FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)];

    // Montagem da Mensagem do WhatsApp
    let txt = `📊 *FECHAMENTO RAIO-X | ${mesAno.toUpperCase()}* 📊\n\n`;
    txt += `Olá, *${primeiroNome}*! Tudo bem?\n`;
    txt += `Segue o panorama detalhado da sua produtividade e o plano de ação para atingir a meta:\n\n`;

    txt += `🏆 *RESUMO GERAL*\n`;
    if (c.cidade) txt += `📍 *Cidade:* ${c.cidade}\n`;
    if (c.tipo) txt += `🧾 *Tipo:* ${c.tipo}\n`;
    txt += `📈 *% Atingimento da Meta:* ${item.percentualAtingimento.toFixed(1)}%\n`;
    if (c.quartil) txt += `🏅 *Quartil:* ${c.quartil}\n`;
    txt += `—\n\n`;

    txt += `⚙️ *PONTUAÇÃO DETALHADA*\n`;
    txt += `🔧 *PT Instalação:* ${c.ptInst.toFixed(2)}\n`;
    txt += `🔁 *PT Reparo:* ${c.ptRep.toFixed(2)}\n`;
    txt += `📋 *PT Regularização:* ${c.ptReg.toFixed(2)}\n`;
    txt += `🔄 *PT Recorrência:* ${c.ptRec.toFixed(2)}\n`;
    txt += `➕ *PT Produção Extra:* ${c.ptProdExtra.toFixed(2)}\n`;
    txt += `${c.infracoesQualidade === 0 ? '✅' : '🚨'} *Infrações de Qualidade:* ${c.infracoesQualidade.toFixed(2)}\n`;
    txt += `🔢 *Total de Pontos:* ${c.pontos.toFixed(2)} _(Meta: ${metaTarget.toFixed(2)})_\n`;
    txt += `—\n\n`;

    txt += `🎯 *CALCULADORA DE DIAS ÚTEIS (META ${metaTarget} PTS)*\n`;
    txt += `📅 *Dias Úteis Restantes:* ${diasUteisRestantes} dias\n`;
    txt += `⚠️ *Pontos Faltantes:* ${item.pontosFaltantes.toFixed(2)} pts\n`;
    if (item.ritmoStatus === 'BATIDA') {
      txt += `🎉 *Status Diário:* META BATIDA! (100% Alcançado)\n`;
    } else {
      txt += `📌 *Meta Diária Necessária:* *${item.pontosDiariosNecessarios.toFixed(2)} pts/dia* em ${diasUteisRestantes} dias úteis\n`;
    }
    txt += `—\n\n`;

    txt += `📉 *QUALIDADE & VOLUME*\n`;
    txt += `${c.recPercent <= 10 ? '✅' : '🚨'} *Recorrência:* ${c.recPercent.toFixed(1)}% _(Meta: ≤10%)_\n`;
    txt += `👥 *Clientes Totais:* ${c.clientesTotais}\n\n`;

    txt += `💡 *FEEDBACK ORIENTATIVO*\n${feedbackOrientativo}\n\n`;
    txt += `🚀 *INCENTIVO DO LÍDER*\n${feedbackIncentivo}\n\n`;
    txt += `_"${fraseSorteada}"_`;

    const telefoneLimpo = telefonesMapa[c.funcionario.split('-')[0].trim().toUpperCase()] || '';
    const whatsappLink = telefoneLimpo
      ? `https://api.whatsapp.com/send?phone=${telefoneLimpo}&text=${encodeURIComponent(txt)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`;

    return {
      ...item,
      feedbackOrientativo,
      feedbackIncentivo,
      whatsappMessage: txt,
      whatsappLink,
    };
  });
}
