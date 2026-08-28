export const GOOGLE_APPS_SCRIPT_CODE = `// =========================================================================
// GESTÃO RAIO-X — Script Google Apps Script (v3)
// Mesmo motor de cálculo do Dashboard (Web/Vercel): % Atingimento, Meta
// Diária em Dias Úteis, Feedback Orientativo/Incentivo e Links WhatsApp.
// -------------------------------------------------------------------------
// REGRAS:
//  1. Meta Diária (Dias Úteis): pergunta os dias úteis restantes e calcula
//     quantos pontos por dia cada colaborador precisa para bater a meta.
//  2. Ranking por % de Atingimento = (PONTOS ÷ META) x 100.
//  3. Feedbacks personalizados e link de WhatsApp por colaborador.
//  4. Quem não está com status "-" (férias, afastado, etc.) fica fora do
//     ranking, mas aparece listado à parte para transparência.
//  5. Reconhecimento de colunas tolerante a variações de nome/acentuação,
//     para funcionar com qualquer CSV colado na aba "Base Raio-X".
// =========================================================================

var ABA_BASE = 'Base Raio-X';
var ABA_CONTATOS = 'Contatos';
var ABA_RANKING = '🏆 Ranking de Desempenho';
var ABA_WHATS = '📱 WhatsApp Disparo';
var META_PADRAO = 176;

var FRASES_MOTIVACIONAIS = [
  'A excelência no detalhe é o que diferencia um bom profissional de um extraordinário.',
  'O capricho de hoje evita o retrabalho de amanhã. Vamos pra cima!',
  'O sucesso da operação está nas suas mãos. Cada atendimento conta!',
  'Não é apenas sobre velocidade, é sobre fazer bem feito e com qualidade.',
  'O seu esforço diário é o que garante a nossa qualidade em campo. Confio no seu trabalho!',
  'Com foco na qualidade e disciplina diária, nenhuma meta fica distante!',
  'Superar desafios em campo faz parte da nossa essência de campeões.'
];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('⚖️ Gestão Raio-X')
    .addItem('1. 🏆 Calcular Ranking Oficial', 'calcularRanking')
    .addItem('2. 📲 Gerar Links WhatsApp + Feedback', 'gerarLinksWhatsApp')
    .addToUi();
}

// =========================================================================
// UTILITÁRIOS
// =========================================================================

function textoOuVazio(v) {
  if (v === null || v === undefined) return '';
  return v.toString().trim();
}

function apenasDigitos(v) {
  var s = textoOuVazio(v);
  var out = '';
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch >= '0' && ch <= '9') out += ch;
  }
  return out;
}

function removerAcentos(str) {
  var normalizado = str.normalize('NFD');
  var out = '';
  for (var i = 0; i < normalizado.length; i++) {
    var code = normalizado.charCodeAt(i);
    if (code < 768 || code > 879) out += normalizado.charAt(i);
  }
  return out;
}

function normalizarCabecalho(v) {
  return removerAcentos(textoOuVazio(v).toUpperCase());
}

function parseNumeroBR(val, valorPadrao) {
  if (val === null || val === undefined || val === '') return valorPadrao;
  if (typeof val === 'number') return isNaN(val) ? valorPadrao : val;

  var minusc = val.toString().trim().toLowerCase();
  if (!minusc) return valorPadrao;
  if (minusc.indexOf('meta batida') !== -1) return 0;

  var limpo = minusc.split('r$').join('').split('%').join('').split(' ').join('').split('pts/dia').join('');

  var norm = limpo;
  if (limpo.indexOf(',') !== -1 && limpo.indexOf('.') !== -1) {
    norm = limpo.split('.').join('').split(',').join('.');
  } else if (limpo.indexOf(',') !== -1) {
    norm = limpo.split(',').join('.');
  }

  var num = parseFloat(norm);
  return isNaN(num) ? valorPadrao : num;
}

function capitalizarNome(str) {
  if (!str) return '';
  var partes = str.toLowerCase().split(' ');
  var out = [];
  for (var i = 0; i < partes.length; i++) {
    var p = partes[i];
    out.push(p.length > 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p);
  }
  return out.join(' ');
}

function chaveContato(nomeFuncionario) {
  return textoOuVazio(nomeFuncionario).split('-')[0].trim().toUpperCase();
}

function perguntarDiasUteis(ui, textoPergunta) {
  var resposta = ui.prompt('📅 Dias Úteis Restantes', textoPergunta, ui.ButtonSet.OK_CANCEL);
  if (resposta.getSelectedButton() !== ui.Button.OK) return null;
  var digitos = apenasDigitos(resposta.getResponseText());
  var val = parseInt(digitos, 10);
  if (isNaN(val) || val <= 0) val = 12;
  return val;
}

// =========================================================================
// LEITURA E MAPEAMENTO DA ABA "Base Raio-X"
// =========================================================================

function mapearColunasBase(headerRow) {
  var idx = {};

  function definir(campo, i) {
    if (idx[campo] === undefined) idx[campo] = i;
  }

  for (var i = 0; i < headerRow.length; i++) {
    var hdr = normalizarCabecalho(headerRow[i]);
    if (!hdr) continue;

    if (hdr.indexOf('FUNC') !== -1 || hdr.indexOf('COLABORADOR') !== -1 || hdr.indexOf('NOME') !== -1) {
      definir('funcionario', i);
    } else if (hdr.indexOf('CIDADE') !== -1 || hdr.indexOf('PRACA') !== -1 || hdr.indexOf('FILIAL') !== -1) {
      definir('cidade', i);
    } else if (hdr.indexOf('SUPERV') !== -1) {
      definir('supervisor', i);
    } else if (hdr.indexOf('GERENT') !== -1) {
      definir('gerente', i);
    } else if (hdr.indexOf('QUARTIL') !== -1) {
      definir('quartil', i);
    } else if (hdr.indexOf('STATUS') !== -1) {
      definir('statusMes', i);
    } else if (hdr.indexOf('TIPO') !== -1 || hdr.indexOf('CARGO') !== -1) {
      definir('tipo', i);
    } else if (hdr.indexOf('CLIENTE') !== -1) {
      definir('clientesTotais', i);
    } else if (hdr.indexOf('INFRAC') !== -1) {
      definir('infracoes', i);
    } else if (hdr.indexOf('INST') !== -1) {
      definir('ptInst', i);
    } else if (hdr.indexOf('REP') !== -1) {
      definir('ptRep', i);
    } else if (hdr.indexOf('EXTRA') !== -1) {
      definir('ptProdExtra', i);
    } else if (hdr.indexOf('REG') !== -1) {
      definir('ptReg', i);
    } else if (hdr.indexOf('REC') !== -1 && hdr.indexOf('RECORR') === -1 && hdr.indexOf('%') === -1) {
      definir('ptRec', i);
    } else if (hdr.indexOf('RECORR') !== -1 || (hdr.indexOf('REC') !== -1 && hdr.indexOf('%') !== -1)) {
      definir('recPercent', i);
    } else if (hdr.indexOf('META') !== -1 && hdr.indexOf('DIARIA') === -1) {
      definir('meta', i);
    } else if (hdr.indexOf('PONTO') !== -1 || (hdr.indexOf('PTS') !== -1 && hdr.indexOf('DIARIA') === -1 && hdr.indexOf('DIARIOS') === -1)) {
      definir('pontos', i);
    }
  }

  return idx;
}

function lerBaseRaioX(ss, diasUteisRestantes) {
  var abaDados = ss.getSheetByName(ABA_BASE);
  if (!abaDados) {
    return { erro: 'Crie uma aba chamada "' + ABA_BASE + '" e cole os dados da planilha lá dentro.' };
  }

  var dados = abaDados.getDataRange().getValues();
  if (dados.length < 2) {
    return { erro: 'A aba "' + ABA_BASE + '" está vazia (só encontrei o cabeçalho, ou nem isso).' };
  }

  var idx = mapearColunasBase(dados[0]);
  if (idx.funcionario === undefined) {
    return { erro: 'Não encontrei uma coluna de nome (ex: FUNCIONÁRIO, COLABORADOR ou NOME) na aba "' + ABA_BASE + '". Verifique se a primeira linha é o cabeçalho.' };
  }

  var linhas = [];

  for (var r = 1; r < dados.length; r++) {
    var l = dados[r];
    var funcionario = textoOuVazio(l[idx.funcionario]);
    if (!funcionario) continue;

    var statusMes = idx.statusMes !== undefined ? textoOuVazio(l[idx.statusMes]) : '-';
    var elegivel = statusMes === '' || statusMes === '-';

    var ptInst = idx.ptInst !== undefined ? parseNumeroBR(l[idx.ptInst], 0) : 0;
    var ptRep = idx.ptRep !== undefined ? parseNumeroBR(l[idx.ptRep], 0) : 0;
    var ptReg = idx.ptReg !== undefined ? parseNumeroBR(l[idx.ptReg], 0) : 0;
    var ptRec = idx.ptRec !== undefined ? parseNumeroBR(l[idx.ptRec], 0) : 0;
    var ptProdExtra = idx.ptProdExtra !== undefined ? parseNumeroBR(l[idx.ptProdExtra], 0) : 0;
    var infracoes = idx.infracoes !== undefined ? parseNumeroBR(l[idx.infracoes], 0) : 0;

    var vPontos = idx.pontos !== undefined ? parseNumeroBR(l[idx.pontos], null) : null;
    if (vPontos === null) {
      vPontos = ptInst + ptRep + ptReg + ptRec + ptProdExtra - infracoes;
    }

    var vMeta = idx.meta !== undefined ? parseNumeroBR(l[idx.meta], 0) : 0;
    if (!(vMeta > 0)) vMeta = META_PADRAO;

    var vRec = idx.recPercent !== undefined ? parseNumeroBR(l[idx.recPercent], 0) : 0;
    var vClientes = idx.clientesTotais !== undefined ? parseNumeroBR(l[idx.clientesTotais], 0) : 0;

    var percentualAtingimento = vMeta > 0 ? (vPontos / vMeta) * 100 : 0;
    var pontosFaltantes = Math.max(0, vMeta - vPontos);
    var metaDiaria = diasUteisRestantes > 0 ? (pontosFaltantes / diasUteisRestantes) : 0;

    var ritmo = 'MODERADO';
    if (pontosFaltantes <= 0) {
      ritmo = 'BATIDA';
    } else if (metaDiaria <= 2) {
      ritmo = 'FACIL';
    } else if (metaDiaria <= 4) {
      ritmo = 'MODERADO';
    } else if (metaDiaria <= 7) {
      ritmo = 'DESAFIADOR';
    } else {
      ritmo = 'CRITICO';
    }

    linhas.push({
      funcionario: funcionario,
      cidade: idx.cidade !== undefined ? textoOuVazio(l[idx.cidade]) : '',
      supervisor: idx.supervisor !== undefined ? textoOuVazio(l[idx.supervisor]) : '',
      tipo: idx.tipo !== undefined ? textoOuVazio(l[idx.tipo]) : '',
      quartil: idx.quartil !== undefined ? textoOuVazio(l[idx.quartil]) : '',
      statusMes: statusMes,
      elegivel: elegivel,
      ptInst: ptInst,
      ptRep: ptRep,
      ptReg: ptReg,
      ptRec: ptRec,
      ptProdExtra: ptProdExtra,
      infracoes: infracoes,
      pontos: vPontos,
      meta: vMeta,
      recPercent: vRec,
      clientesTotais: vClientes,
      percentualAtingimento: percentualAtingimento,
      pontosFaltantes: pontosFaltantes,
      metaDiaria: metaDiaria,
      ritmo: ritmo
    });
  }

  return { linhas: linhas };
}

function lerMapaContatos(ss) {
  var mapa = {};
  var abaContatos = ss.getSheetByName(ABA_CONTATOS);
  if (!abaContatos) return mapa;

  var dados = abaContatos.getDataRange().getValues();
  for (var r = 1; r < dados.length; r++) {
    var nomeBruto = dados[r][0];
    if (!nomeBruto) continue;

    var telefone = dados[r][1];
    if (!telefone || textoOuVazio(telefone) === '') telefone = dados[r][2];

    var chave = chaveContato(nomeBruto);
    if (chave) mapa[chave] = telefone ? apenasDigitos(telefone) : '';
  }

  return mapa;
}

// =========================================================================
// 1. RANKING OFICIAL
// =========================================================================

function calcularRanking() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var diasUteisRestantes = perguntarDiasUteis(ui, 'Informe quantos dias úteis restam no mês para atingir a meta (ex: 12):');
  if (diasUteisRestantes === null) return;

  var leitura = lerBaseRaioX(ss, diasUteisRestantes);
  if (leitura.erro) {
    ui.alert('🛑 ' + leitura.erro);
    return;
  }

  var elegiveis = [];
  for (var i = 0; i < leitura.linhas.length; i++) {
    if (leitura.linhas[i].elegivel) elegiveis.push(leitura.linhas[i]);
  }

  if (elegiveis.length === 0) {
    ui.alert('⚠️ Nenhum colaborador elegível encontrado (todos com status de mês diferente de "-").');
    return;
  }

  elegiveis.sort(function (a, b) {
    if (b.percentualAtingimento !== a.percentualAtingimento) return b.percentualAtingimento - a.percentualAtingimento;
    return a.recPercent - b.recPercent;
  });

  var relatorio = [['🏆 RANKING', '👤 FUNCIONÁRIO', '👥 SUPERVISOR', '📊 QUARTIL', '📉 RECORRÊNCIA', '📈 % ATINGIMENTO', '🔢 PONTOS', '🎯 META', '📅 PTS DIÁRIOS (' + diasUteisRestantes + 'd)']];

  for (var x = 0; x < elegiveis.length; x++) {
    var item = elegiveis[x];
    var txtMetaDiaria = item.pontosFaltantes <= 0 ? 'Meta Batida!' : item.metaDiaria.toFixed(2) + ' pts/dia';
    relatorio.push([
      (x + 1) + 'º Lugar',
      item.funcionario,
      item.supervisor,
      item.quartil,
      item.recPercent.toFixed(1) + '%',
      item.percentualAtingimento.toFixed(1) + '%',
      item.pontos.toFixed(2),
      item.meta.toFixed(2),
      txtMetaDiaria
    ]);
  }

  var sheetFinal = ss.getSheetByName(ABA_RANKING);
  if (!sheetFinal) sheetFinal = ss.insertSheet(ABA_RANKING);
  sheetFinal.clear();
  sheetFinal.getRange(1, 1, relatorio.length, 9).setValues(relatorio);
  sheetFinal.getRange(1, 1, 1, 9).setBackground('#1F4E79').setFontColor('white').setFontWeight('bold');

  var totalLinhasDados = relatorio.length - 1;
  if (totalLinhasDados > 0) {
    sheetFinal.getRange(2, 1, Math.min(3, totalLinhasDados), 9).setBackground('#FFF2CC');
    sheetFinal.getRange(2, 4, totalLinhasDados, 6).setHorizontalAlignment('center');
  }
  sheetFinal.setFrozenRows(1);
  sheetFinal.autoResizeColumns(1, 9);

  var ignorados = leitura.linhas.length - elegiveis.length;
  var msg = '✅ Ranking gerado com sucesso! ' + elegiveis.length + ' colaborador(es) elegível(is) considerados. Dias úteis: ' + diasUteisRestantes + '.';
  if (ignorados > 0) {
    msg += ' (' + ignorados + ' fora do ciclo por status de mês diferente de "-".)';
  }
  ui.alert(msg);
}

// =========================================================================
// 2. WHATSAPP — META DIÁRIA + FEEDBACK ORIENTATIVO/INCENTIVO
// =========================================================================

function gerarFeedback(item, diasUteisRestantes, primeiroNome) {
  var orientativo = '';
  var incentivo = '';

  if (item.ritmo === 'BATIDA') {
    orientativo = 'Parabéns! Sua meta de ' + item.meta + ' pontos já foi atingida (' + item.percentualAtingimento.toFixed(1) + '%). Mantenha o foco em evitar infrações de qualidade e manter a recorrência abaixo de 10% para assegurar seu excelente resultado no ciclo.';
    incentivo = 'Excelente desempenho, ' + primeiroNome + '! Você é referência de produtividade e qualidade no time. Continue firme para buscar/manter a liderança no ranking TOP 3!';
  } else if (item.ritmo === 'FACIL') {
    orientativo = 'Faltam apenas ' + item.pontosFaltantes.toFixed(2) + ' pontos para os ' + item.meta + ' pts (' + item.percentualAtingimento.toFixed(1) + '%). Com ' + diasUteisRestantes + ' dias úteis restantes, sua necessidade é de apenas ' + item.metaDiaria.toFixed(2) + ' pts/dia.';
    incentivo = 'Você está muito perto do objetivo, ' + primeiroNome + '! A meta está ao seu alcance. Mantenha o ritmo consistente nestes dias e garanta sua conquista!';
  } else if (item.ritmo === 'MODERADO') {
    orientativo = 'Você está com ' + item.pontos.toFixed(2) + ' pontos (' + item.percentualAtingimento.toFixed(1) + '%). Para atingir os ' + item.meta + ' pts em ' + diasUteisRestantes + ' dias úteis, sua meta diária é de ' + item.metaDiaria.toFixed(2) + ' pts/dia. Recomenda-se focar no mix de instalações e regularizações sem gerar infrações de qualidade.';
    incentivo = 'Boa evolução, ' + primeiroNome + '! Com disciplina diária nos ' + diasUteisRestantes + ' dias úteis que restam, você tem totais condições de bater a meta e atingir o topo do ranking!';
  } else if (item.ritmo === 'DESAFIADOR') {
    orientativo = 'Você tem ' + item.pontos.toFixed(2) + ' pontos (' + item.percentualAtingimento.toFixed(1) + '%) e restam ' + item.pontosFaltantes.toFixed(2) + ' pts. Para alcançar os ' + item.meta + ' pts, o ritmo diário necessário nos ' + diasUteisRestantes + ' dias úteis é de ' + item.metaDiaria.toFixed(2) + ' pts/dia. Alinhe com seu supervisor o plano de rotas e suporte de materiais.';
    incentivo = 'Ainda há tempo, ' + primeiroNome + '! O desafio é acelerar o ritmo diário. Foco total em resoluções no primeiro atendimento para evitar retrabalhos de recorrência e alavancar seus pontos!';
  } else {
    orientativo = 'Pontuação atual: ' + item.pontos.toFixed(2) + ' pts (' + item.percentualAtingimento.toFixed(1) + '%). Faltam ' + item.pontosFaltantes.toFixed(2) + ' pts (' + item.metaDiaria.toFixed(2) + ' pts/dia em ' + diasUteisRestantes + ' dias úteis). É fundamental agendar um alinhamento urgente de rotas e apoio técnico com seu supervisor.';
    incentivo = 'Não desista, ' + primeiroNome + '! A liderança está à disposição para te apoiar. Cada OS finalizada com qualidade conta muito para reverter o cenário e garantir o resultado!';
  }

  return { orientativo: orientativo, incentivo: incentivo };
}

function montarMensagemWhatsApp(item, diasUteisRestantes, mesVigente) {
  var NL = String.fromCharCode(10);
  var primeiroNome = capitalizarNome(chaveContato(item.funcionario).split(' ')[0]);
  var feedback = gerarFeedback(item, diasUteisRestantes, primeiroNome);
  var frase = FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)];

  var linhas = [];
  linhas.push('📊 *FECHAMENTO RAIO-X | ' + mesVigente + '* 📊');
  linhas.push('');
  linhas.push('Olá, *' + primeiroNome + '*! Tudo bem?');
  linhas.push('Segue o panorama detalhado da sua produtividade e o plano de ação para atingir a meta:');
  linhas.push('');
  linhas.push('🏆 *RESUMO GERAL*');
  if (item.cidade) linhas.push('📍 *Cidade:* ' + item.cidade);
  if (item.tipo) linhas.push('🧾 *Tipo:* ' + item.tipo);
  linhas.push('📈 *% Atingimento da Meta:* ' + item.percentualAtingimento.toFixed(1) + '%');
  if (item.quartil) linhas.push('🏅 *Quartil:* ' + item.quartil);
  linhas.push('—');
  linhas.push('');
  linhas.push('⚙️ *PONTUAÇÃO DETALHADA*');
  linhas.push('🔧 *PT Instalação:* ' + item.ptInst.toFixed(2));
  linhas.push('🔁 *PT Reparo:* ' + item.ptRep.toFixed(2));
  linhas.push('📋 *PT Regularização:* ' + item.ptReg.toFixed(2));
  linhas.push('🔄 *PT Recorrência:* ' + item.ptRec.toFixed(2));
  linhas.push('➕ *PT Produção Extra:* ' + item.ptProdExtra.toFixed(2));
  linhas.push((item.infracoes === 0 ? '✅' : '🚨') + ' *Infrações de Qualidade:* ' + item.infracoes.toFixed(2));
  linhas.push('🔢 *Total de Pontos:* ' + item.pontos.toFixed(2) + ' _(Meta: ' + item.meta.toFixed(2) + ')_');
  linhas.push('—');
  linhas.push('');
  linhas.push('🎯 *CALCULADORA DE DIAS ÚTEIS (META ' + item.meta + ' PTS)*');
  linhas.push('📅 *Dias Úteis Restantes:* ' + diasUteisRestantes + ' dias');
  linhas.push('⚠️ *Pontos Faltantes:* ' + item.pontosFaltantes.toFixed(2) + ' pts');
  if (item.ritmo === 'BATIDA') {
    linhas.push('🎉 *Status Diário:* META BATIDA! (100% Alcançado)');
  } else {
    linhas.push('📌 *Meta Diária Necessária:* *' + item.metaDiaria.toFixed(2) + ' pts/dia* em ' + diasUteisRestantes + ' dias úteis');
  }
  linhas.push('—');
  linhas.push('');
  linhas.push('📉 *QUALIDADE & VOLUME*');
  linhas.push((item.recPercent <= 10 ? '✅' : '🚨') + ' *Recorrência:* ' + item.recPercent.toFixed(1) + '% _(Meta: ≤10%)_');
  linhas.push('👥 *Clientes Totais:* ' + item.clientesTotais.toFixed(0));
  linhas.push('');
  linhas.push('💡 *FEEDBACK ORIENTATIVO*');
  linhas.push(feedback.orientativo);
  linhas.push('');
  linhas.push('🚀 *INCENTIVO DO LÍDER*');
  linhas.push(feedback.incentivo);
  linhas.push('');
  linhas.push('_"' + frase + '"_');

  return linhas.join(NL);
}

function mesVigenteAtual(ss) {
  var meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var hoje = new Date();
  return (meses[hoje.getMonth()] + ' de ' + hoje.getFullYear()).toUpperCase();
}

function gerarLinksWhatsApp() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var diasUteisRestantes = perguntarDiasUteis(ui, 'Quantos dias úteis restam para fechar a meta deste ciclo?');
  if (diasUteisRestantes === null) return;

  var leitura = lerBaseRaioX(ss, diasUteisRestantes);
  if (leitura.erro) {
    ui.alert('🛑 ' + leitura.erro);
    return;
  }

  var mapaContatos = lerMapaContatos(ss);
  var temAbaContatos = ss.getSheetByName(ABA_CONTATOS) !== null;
  var mesVigente = mesVigenteAtual(ss);

  var sheetLinks = ss.getSheetByName(ABA_WHATS);
  if (!sheetLinks) sheetLinks = ss.insertSheet(ABA_WHATS);
  sheetLinks.clear();

  var header = ['👤 FUNCIONÁRIO', '📈 % ATINGIMENTO', '📱 LINK DE DISPARO (WHATSAPP)'];
  sheetLinks.getRange(1, 1, 1, header.length).setValues([header]);
  sheetLinks.getRange(1, 1, 1, header.length).setBackground('#25D366').setFontColor('white').setFontWeight('bold');

  var enviados = 0;
  var semTelefone = 0;
  var foraDoCiclo = 0;

  for (var i = 0; i < leitura.linhas.length; i++) {
    var item = leitura.linhas[i];
    var linha = i + 2;

    sheetLinks.getRange(linha, 1).setValue(item.funcionario);
    sheetLinks.getRange(linha, 2).setValue(item.percentualAtingimento.toFixed(1) + '%');

    if (!item.elegivel) {
      foraDoCiclo++;
      sheetLinks.getRange(linha, 3).setValue('ℹ️ Status do mês: ' + item.statusMes + ' — fora do ciclo de premiação');
      continue;
    }

    var chave = chaveContato(item.funcionario);
    var numeroWhats = mapaContatos[chave];

    if (!numeroWhats) {
      semTelefone++;
      var textoFalta = temAbaContatos
        ? '❌ Número não encontrado na aba "Contatos" (verifique o nome "' + chave + '")'
        : '❌ Crie uma aba "Contatos" com o nome e o telefone de cada colaborador';
      sheetLinks.getRange(linha, 3).setValue(textoFalta);
      continue;
    }

    var textoZAP = montarMensagemWhatsApp(item, diasUteisRestantes, mesVigente);
    var linkWhatsApp = 'https://api.whatsapp.com/send?phone=' + numeroWhats + '&text=' + encodeURIComponent(textoZAP);

    var richValue = SpreadsheetApp.newRichTextValue()
      .setText('📲 Enviar Mensagem WhatsApp')
      .setLinkUrl(linkWhatsApp)
      .build();
    sheetLinks.getRange(linha, 3).setRichTextValue(richValue);
    enviados++;
  }

  sheetLinks.setFrozenRows(1);
  sheetLinks.autoResizeColumns(1, 3);

  var msg = '✅ Links de WhatsApp gerados! ' + enviados + ' pronto(s) para envio.';
  if (semTelefone > 0) msg += ' ' + semTelefone + ' sem telefone cadastrado.';
  if (foraDoCiclo > 0) msg += ' ' + foraDoCiclo + ' fora do ciclo (status de mês).';
  ui.alert(msg);
}
`;
