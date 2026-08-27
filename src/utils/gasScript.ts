export const GOOGLE_APPS_SCRIPT_CODE = `// =========================================================================
// SCRIPT ATUALIZADO — Estrutura "PRODUTIVIDADE IAT / VISÃO LÍDER"
// Com Cálculo de Pontos Diários (Dias Úteis) + Feedback Orientativo e Incentivo
// -------------------------------------------------------------------------
// REGRAS IMPLEMENTADAS:
//  1. Meta Diária (Dias Úteis): Pergunta ao usuário os dias úteis restantes no mês
//     e calcula quantos pontos diários o colaborador precisa para atingir a meta (176 pts).
//  2. Ranking de Desempenho por % de Atingimento = (PONTOS ÷ META) x 100.
//  3. Feedbacks Personalizados: Gera feedback orientativo e de incentivo no WhatsApp.
//  4. Exclusão de Status Mês: Quem não tem status "-" é ignorado do ranking, mas listado com aviso.
// =========================================================================

function calcularPremiacaoPeloCSV() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var abaDados = ss.getSheetByName("Base Raio-X");
  if (!abaDados) {
    ui.alert("⚠️ Crie uma aba chamada 'Base Raio-X' e cole os dados lá dentro.");
    return;
  }

  // Solicitador de Dias Úteis Restantes
  var respostaDias = ui.prompt("📅 Dias Úteis Restantes", "Informe quantos dias úteis restam no mês para atingir a meta (Ex: 12):", ui.ButtonSet.OK_CANCEL);
  var diasUteisRestantes = 12; // Valor padrão
  if (respostaDias.getSelectedButton() === ui.Button.OK) {
    var val = parseInt(respostaDias.getResponseText().replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) diasUteisRestantes = val;
  }

  var dados = abaDados.getDataRange().getValues();
  if (dados.length <= 1) return ui.alert("⚠️ A aba 'Base Raio-X' está vazia.");

  var cabecalho = dados[0];
  var colunas = {};
  for (var i = 0; i < cabecalho.length; i++) {
    colunas[cabecalho[i].toString().toUpperCase().trim()] = i;
  }

  if (colunas["FUNCIONÁRIO"] === undefined) {
    return ui.alert("🛑 ERRO: Coluna 'FUNCIONÁRIO' não encontrada na aba Base Raio-X.");
  }
  if (colunas["PONTOS"] === undefined || colunas["META"] === undefined) {
    return ui.alert("🛑 ERRO: Colunas 'PONTOS' e/ou 'META' não encontradas na aba Base Raio-X.");
  }

  var resultados = [];

  for (var r = 1; r < dados.length; r++) {
    var l = dados[r];
    var funcionario = l[colunas["FUNCIONÁRIO"]];
    if (!funcionario || funcionario === "") continue;

    var supervisor = colunas["SUPERVISOR"] !== undefined ? l[colunas["SUPERVISOR"]] : "";
    var quartil = colunas["QUARTIL"] !== undefined ? l[colunas["QUARTIL"]] : "-";
    var statusMes = colunas["STATUS MÊS"] !== undefined ? l[colunas["STATUS MÊS"]].toString().trim() : "-";

    // Exclui do ranking quem está com status diferente de "-" (férias, afastado, etc.)
    if (statusMes !== "-" && statusMes !== "") continue;

    var vRecStr = colunas["REC (%)"] !== undefined ? l[colunas["REC (%)"]].toString() : "0";
    var vRec = parseFloat(vRecStr.replace(",", ".").replace("%", "")) || 0;
    if (vRecStr.indexOf("%") === -1 && vRec <= 1 && vRec > 0) vRec = vRec * 100;

    var vPontos = parseFloat(l[colunas["PONTOS"]].toString().replace(",", ".")) || 0;
    var vMeta = parseFloat(l[colunas["META"]].toString().replace(",", ".")) || 0;
    if (vMeta <= 0) vMeta = 176; // Meta Padrão IAT se não informada

    var percentualAtingimento = vMeta > 0 ? (vPontos / vMeta) * 100 : 0;

    var pontosFaltantes = Math.max(0, vMeta - vPontos);
    var metaDiaria = diasUteisRestantes > 0 ? (pontosFaltantes / diasUteisRestantes) : 0;

    resultados.push({
      funcionario: funcionario,
      supervisor: supervisor,
      quartil: quartil,
      percentualAtingimento: percentualAtingimento,
      pontos: vPontos,
      meta: vMeta,
      pontosFaltantes: pontosFaltantes,
      metaDiaria: metaDiaria,
      vRec: vRec
    });
  }

  resultados.sort(function(a, b) {
    if (b.percentualAtingimento !== a.percentualAtingimento) return b.percentualAtingimento - a.percentualAtingimento;
    return a.vRec - b.vRec;
  });

  var relatorio = [["🏆 RANKING", "👤 FUNCIONÁRIO", "👥 SUPERVISOR", "📊 QUARTIL", "📉 RECORRÊNCIA", "📈 % ATINGIMENTO", "🔢 PONTOS", "🎯 META", "📅 PTS DIÁRIOS (" + diasUteisRestantes + "d)"]];
  for (var x = 0; x < resultados.length; x++) {
    var txtMetaDiaria = resultados[x].pontosFaltantes <= 0 ? "Meta Batida!" : resultados[x].metaDiaria.toFixed(2) + " pts/dia";
    relatorio.push([
      (x + 1) + "º Lugar",
      resultados[x].funcionario,
      resultados[x].supervisor,
      resultados[x].quartil,
      resultados[x].vRec.toFixed(1) + "%",
      resultados[x].percentualAtingimento.toFixed(1) + "%",
      resultados[x].pontos.toFixed(2),
      resultados[x].meta.toFixed(2),
      txtMetaDiaria
    ]);
  }

  var sheetFinal = ss.getSheetByName("🏆 Ranking de Desempenho");
  if (!sheetFinal) sheetFinal = ss.insertSheet("🏆 Ranking de Desempenho");
  sheetFinal.clear();
  sheetFinal.getRange(1, 1, relatorio.length, 9).setValues(relatorio);
  sheetFinal.getRange("A1:I1").setBackground("#1F4E79").setFontColor("white").setFontWeight("bold");
  if (resultados.length > 0) sheetFinal.getRange(2, 1, Math.min(3, resultados.length), 9).setBackground("#FFF2CC");
  sheetFinal.getRange(2, 4, relatorio.length, 6).setHorizontalAlignment("center");
  sheetFinal.autoResizeColumns(1, 9);

  ui.alert("✅ Ranking gerado com sucesso! (" + resultados.length + " funcionário(s) elegíveis considerados. Dias úteis considerados: " + diasUteisRestantes + ")");
}

// =========================================================================
// 2. FUNÇÃO: WHATSAPP - MENSAGEM COM META DIÁRIA & FEEDBACK ORIENTATIVO
// =========================================================================
function gerarLinksWhatsApp() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var abaDados = ss.getSheetByName("Base Raio-X");
  var abaContatos = ss.getSheetByName("Contatos");

  if (!abaDados || !abaContatos) {
    ui.alert("⚠️ Crie as abas 'Base Raio-X' e 'Contatos'.");
    return;
  }

  // Solicitador de Dias Úteis Restantes
  var respostaDias = ui.prompt("📅 Dias Úteis Restantes no Mês", "Quantos dias úteis restam para fechar a meta de 176 pontos?", ui.ButtonSet.OK_CANCEL);
  var diasUteisRestantes = 12; // padrão
  if (respostaDias.getSelectedButton() === ui.Button.OK) {
    var val = parseInt(respostaDias.getResponseText().replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) diasUteisRestantes = val;
  }

  var dadosContatos = abaContatos.getDataRange().getValues();
  var mapaWhats = {};

  for (var c = 1; c < dadosContatos.length; c++) {
    var nomeContatoBruto = dadosContatos[c][0];
    var whatsContato = dadosContatos[c][1];
    if (!whatsContato || whatsContato.toString().trim() === "") {
      whatsContato = dadosContatos[c][2];
    }

    if (nomeContatoBruto) {
      var nomeLimpo = nomeContatoBruto.toString().split("-")[0].trim().toUpperCase();
      mapaWhats[nomeLimpo] = whatsContato ? whatsContato.toString().replace(/\\D/g, '') : "";
    }
  }

  var dados = abaDados.getDataRange().getValues();
  var col = {};
  for (var i = 0; i < dados[0].length; i++) {
    col[dados[0][i].toString().toUpperCase().trim()] = i;
  }

  if (col["FUNCIONÁRIO"] === undefined) {
    return ui.alert("🛑 ERRO: Coluna 'FUNCIONÁRIO' não encontrada na Base Raio-X.");
  }

  var relatorioWhats = [["👤 FUNCIONÁRIO", "📱 LINK DE DISPARO (WHATSAPP)"]];
  var funcionariosProcessados = {};

  var dataAtual = new Date();
  var meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  var frasesMotivacionais = [
    "A excelência no detalhe é o que diferencia um bom profissional de um extraordinário.",
    "O capricho de hoje evita o retrabalho de amanhã. Vamos pra cima!",
    "O sucesso da operação está nas suas mãos. Cada atendimento conta!",
    "Não é apenas sobre velocidade, é sobre fazer bem feito e com qualidade.",
    "O seu esforço diário é o que garante a nossa qualidade em campo. Confio no seu trabalho!"
  ];

  for (var r = 1; r < dados.length; r++) {
    var funcionario = dados[r][col["FUNCIONÁRIO"]];
    if (!funcionario || funcionario === "") continue;

    var nomeLimpoFunc = funcionario.toString().split("-")[0].trim().toUpperCase();

    if (funcionariosProcessados[nomeLimpoFunc]) continue;
    funcionariosProcessados[nomeLimpoFunc] = true;

    var numeroWhats = mapaWhats[nomeLimpoFunc];

    if (!numeroWhats || numeroWhats === "") {
      relatorioWhats.push([funcionario, "❌ NÚMERO NÃO ENCONTRADO NA ABA CONTATOS"]);
      continue;
    }

    var statusMes = col["STATUS MÊS"] !== undefined ? dados[r][col["STATUS MÊS"]].toString().trim() : "-";

    if (statusMes !== "-" && statusMes !== "") {
      relatorioWhats.push([funcionario, "ℹ️ Status do mês: " + statusMes + " — fora do ciclo de premiação"]);
      continue;
    }

    var vCidade = col["CIDADE"] !== undefined ? dados[r][col["CIDADE"]].toString() : "";
    var vTipo = col["TIPO"] !== undefined ? dados[r][col["TIPO"]].toString() : "";
    var vQuartil = col["QUARTIL"] !== undefined ? dados[r][col["QUARTIL"]].toString().trim() : "";

    var vPtInst = col["PT INST."] !== undefined ? (parseFloat(dados[r][col["PT INST."]].toString().replace(",", ".")) || 0) : 0;
    var vPtRep = col["PT REP."] !== undefined ? (parseFloat(dados[r][col["PT REP."]].toString().replace(",", ".")) || 0) : 0;
    var vPtReg = col["PT REG."] !== undefined ? (parseFloat(dados[r][col["PT REG."]].toString().replace(",", ".")) || 0) : 0;
    var vPtRec = col["PT REC."] !== undefined ? (parseFloat(dados[r][col["PT REC."]].toString().replace(",", ".")) || 0) : 0;
    var vPtProdExtra = col["PT PROD.EXTRA"] !== undefined ? (parseFloat(dados[r][col["PT PROD.EXTRA"]].toString().replace(",", ".")) || 0) : 0;
    var vInfracoes = col["INFRAÇÕES QUALIDADE"] !== undefined ? (parseFloat(dados[r][col["INFRAÇÕES QUALIDADE"]].toString().replace(",", ".")) || 0) : 0;

    var vPontos = col["PONTOS"] !== undefined ? (parseFloat(dados[r][col["PONTOS"]].toString().replace(",", ".")) || 0) : 0;
    var vMeta = col["META"] !== undefined ? (parseFloat(dados[r][col["META"]].toString().replace(",", ".")) || 0) : 0;
    if (vMeta <= 0) vMeta = 176;

    var percentualAtingimento = vMeta > 0 ? (vPontos / vMeta) * 100 : 0;
    var faltaPontos = Math.max(0, vMeta - vPontos);
    var metaDiaria = diasUteisRestantes > 0 ? (faltaPontos / diasUteisRestantes) : 0;

    var vRecStr = col["REC (%)"] !== undefined ? dados[r][col["REC (%)"]].toString() : "0";
    var vRec = parseFloat(vRecStr.replace(",", ".").replace("%", "")) || 0;
    if (vRecStr.indexOf("%") === -1 && vRec <= 1 && vRec > 0) vRec = vRec * 100;

    var vClientesTotais = col["CLIENTES TOTAIS"] !== undefined ? (parseFloat(dados[r][col["CLIENTES TOTAIS"]].toString().replace(",", ".")) || 0) : 0;

    var mesPlanilha = col["MÊS (ANO E MÊS)"] !== undefined ? dados[r][col["MÊS (ANO E MÊS)"]] : null;
    var mesVigente = mesPlanilha ? mesPlanilha.toString().toUpperCase() : (meses[dataAtual.getMonth()] + " DE " + dataAtual.getFullYear()).toUpperCase();

    var primeiroNome = capitalizarNome(nomeLimpoFunc.split(" ")[0]);
    var fraseSorteada = frasesMotivacionais[Math.floor(Math.random() * frasesMotivacionais.length)];

    // GERAÇÃO DE FEEDBACK ORIENTATIVO & INCENTIVO
    var feedbackOrientativo = "";
    var feedbackIncentivo = "";

    if (faltaPontos === 0) {
      feedbackOrientativo = "Sua meta principal de " + vMeta + " pontos já foi atingida! Mantenha o foco na qualidade (recorrência ≤ 10% e zero infrações) para proteger seu prêmio integral.";
      feedbackIncentivo = "Sensacional trabalho, " + primeiroNome + "! Você superou os " + vMeta + " pontos e é destaque na operação. Vamos firme para conquistar o TOP 3 do ranking!";
    } else if (metaDiaria <= 2.5) {
      feedbackOrientativo = "Faltam apenas " + faltaPontos.toFixed(2) + " pontos para atingir os " + vMeta + " pts. Em " + diasUteisRestantes + " dias úteis, sua meta é de apenas " + metaDiaria.toFixed(2) + " pts/dia (cerca de 1 OS/dia).";
      feedbackIncentivo = "Você está com o prêmio na mão, " + primeiroNome + "! Mantendo sua rotina normal com atenção aos detalhes, você fecha o mês com chave de ouro!";
    } else if (metaDiaria <= 5.0) {
      feedbackOrientativo = "Você acumula " + vPontos.toFixed(2) + " pts. Para chegar aos " + vMeta + " pts, necessita de " + metaDiaria.toFixed(2) + " pts/dia nos próximos " + diasUteisRestantes + " dias úteis. Priorize instalações e evite infrações de qualidade.";
      feedbackIncentivo = "Ritmo plenamente alcançável, " + primeiroNome + "! Mantenha a disciplina nas rotas diárias que o objetivo será cumprido!";
    } else {
      feedbackOrientativo = "Pontuação atual: " + vPontos.toFixed(2) + " pts. Para atingir a meta de " + vMeta + " pts, é necessário acelerar para " + metaDiaria.toFixed(2) + " pts/dia em " + diasUteisRestantes + " dias úteis. Vamos alinhar seu roteiro com o supervisor.";
      feedbackIncentivo = "Foco total na virada de jogo, " + primeiroNome + "! Com suporte técnico, alinhamento de rotas e empenho diário, é possível buscar esses pontos e garantir sua premiação!";
    }

    // =========================================================
    // MONTAGEM DA MENSAGEM DO WHATSAPP
    // =========================================================

    var textoZAP = "📊 *FECHAMENTO RAIO-X | " + mesVigente + "* 📊\n\n";
    textoZAP += "Olá, *" + primeiroNome + "*! Tudo bem?\n";
    textoZAP += "Segue o panorama completo dos seus indicadores deste ciclo. Vamos analisar juntos:\n\n";

    // BLOCO 1: GERAL
    textoZAP += "🏆 *RESUMO GERAL*\n";
    if (vCidade) textoZAP += "📍 *Cidade:* " + vCidade + "\n";
    if (vTipo) textoZAP += "🧾 *Tipo:* " + vTipo + "\n";
    textoZAP += "📈 *% Atingimento da Meta:* " + percentualAtingimento.toFixed(1) + "%\n";
    if (vQuartil !== "") textoZAP += "🏅 *Quartil:* " + vQuartil + "\n";
    textoZAP += "—\n\n";

    // BLOCO 2: PONTUAÇÃO DETALHADA
    textoZAP += "⚙️ *PONTUAÇÃO DETALHADA*\n";
    textoZAP += "🔧 *PT Instalação:* " + vPtInst.toFixed(2) + "\n";
    textoZAP += "🔁 *PT Reparo:* " + vPtRep.toFixed(2) + "\n";
    textoZAP += "📋 *PT Regularização:* " + vPtReg.toFixed(2) + "\n";
    textoZAP += "🔄 *PT Recorrência:* " + vPtRec.toFixed(2) + "\n";
    textoZAP += "➕ *PT Produção Extra:* " + vPtProdExtra.toFixed(2) + "\n";
    textoZAP += (vInfracoes === 0 ? "✅" : "🚨") + " *Infrações de Qualidade:* " + vInfracoes.toFixed(2) + "\n";
    textoZAP += "🔢 *Total de Pontos:* " + vPontos.toFixed(2) + " _(Meta: " + vMeta.toFixed(2) + ")_\n";
    textoZAP += "—\n\n";

    // BLOCO 3: CALCULADORA DE DIAS ÚTEIS (META 176)
    textoZAP += "🎯 *META DIÁRIA EM DIAS ÚTEIS (176 PTS)*\n";
    textoZAP += "📅 *Dias Úteis Restantes:* " + diasUteisRestantes + " dias\n";
    textoZAP += "⚠️ *Pontos Faltantes para 176:* " + faltaPontos.toFixed(2) + " pts\n";
    if (faltaPontos <= 0) {
      textoZAP += "🎉 *Meta Diária:* META BATIDA! (100% Concluído)\n";
    } else {
      textoZAP += "📌 *Meta Diária Necessária:* *" + metaDiaria.toFixed(2) + " pts/dia*\n";
    }
    textoZAP += "—\n\n";

    // BLOCO 4: QUALIDADE E VOLUME
    textoZAP += "📉 *QUALIDADE & VOLUME*\n";
    textoZAP += (vRec <= 10 ? "✅" : "🚨") + " *Recorrência:* " + vRec.toFixed(1) + "% _(Meta: ≤10%)_\n";
    textoZAP += "👥 *Clientes Totais:* " + vClientesTotais.toFixed(0) + "\n\n";

    // BLOCO 5: FEEDBACK ORIENTATIVO E INCENTIVO
    textoZAP += "💡 *FEEDBACK ORIENTATIVO*\n" + feedbackOrientativo + "\n\n";
    textoZAP += "🚀 *INCENTIVO DA LIDERANÇA*\n" + feedbackIncentivo + "\n\n";

    textoZAP += "_\"" + fraseSorteada + "\"_";

    var linkWhatsApp = "https://api.whatsapp.com/send?phone=" + numeroWhats + "&text=" + encodeURIComponent(textoZAP);
    var formula = '=HYPERLINK("' + linkWhatsApp + '"; "📲 ENVIAR MENSAGEM")';

    relatorioWhats.push([funcionario, formula]);
  }

  var sheetLinks = ss.getSheetByName("📱 WhatsApp Disparo");
  if (!sheetLinks) sheetLinks = ss.insertSheet("📱 WhatsApp Disparo");
  sheetLinks.clear();

  sheetLinks.getRange(1, 1, relatorioWhats.length, 2).setValues(relatorioWhats);
  sheetLinks.getRange("A1:B1").setBackground("#25D366").setFontColor("white").setFontWeight("bold");
  sheetLinks.autoResizeColumns(1, 2);

  ui.alert("✅ Links de WhatsApp com Meta Diária e Feedbacks gerados com sucesso!");
}

function capitalizarNome(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('⚖️ Gestão Raio-X')
    .addItem('1. Calcular Novo Ranking Oficial', 'calcularPremiacaoPeloCSV')
    .addItem('2. 📲 Gerar Links (WhatsApp)', 'gerarLinksWhatsApp')
    .addToUi();
}
`;
