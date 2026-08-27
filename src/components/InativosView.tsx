import React, { useState, useRef, useMemo } from 'react';
import {
  UserX,
  Upload,
  FileSpreadsheet,
  FileText,
  Search,
  Check,
  X,
  AlertCircle,
  Plus,
  Trash2,
  Download,
  UserCheck,
  Edit2,
  Calendar,
  ShieldAlert,
  Info,
  Box,
  Layers,
  MessageSquare,
  Copy,
  ExternalLink,
  Phone,
  Archive,
  Send,
  Users,
} from 'lucide-react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { ItemInativo, Colaborador } from '../types';

interface InativosViewProps {
  inativos: ItemInativo[];
  setInativos: React.Dispatch<React.SetStateAction<ItemInativo[]>>;
  colaboradores: Colaborador[];
  setColaboradores: React.Dispatch<React.SetStateAction<Colaborador[]>>;
  telefonesMapa: Record<string, string>;
  setTelefonesMapa: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onNotificar?: (msg: string) => void;
}

export const InativosView: React.FC<InativosViewProps> = ({
  inativos,
  setInativos,
  colaboradores,
  setColaboradores,
  telefonesMapa,
  setTelefonesMapa,
  onNotificar,
}) => {
  const [pastedCSV, setPastedCSV] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modoSubstituir, setModoSubstituir] = useState(false);

  // Modo de Exibição: 'tabela' ou 'whatsapp_individual'
  const [visaoAtiva, setVisaoAtiva] = useState<'tabela' | 'whatsapp_individual'>('tabela');

  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState<string>('todos');
  const [filtroClasse, setFiltroClasse] = useState<string>('todos');

  // Modal Novo / Edição Manual
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEdicao, setItemEdicao] = useState<ItemInativo | null>(null);

  // Modal Detalhes do Colaborador / Preview WhatsApp
  const [colabModalDetalhes, setColabModalDetalhes] = useState<{
    colaborador: string;
    matricula: string;
    uf: string;
    cargo: string;
    lider: string;
    itens: ItemInativo[];
  } | null>(null);

  // Form states matching user's CSV
  const [formMatricula, setFormMatricula] = useState('');
  const [formColaborador, setFormColaborador] = useState('');
  const [formUf, setFormUf] = useState('PB');
  const [formCargo, setFormCargo] = useState('OPERADOR DE SERVICOS DE CAMPO');
  const [formLider, setFormLider] = useState('');
  const [formNomeItem, setFormNomeItem] = useState('');
  const [formIdItem, setFormIdItem] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formClasse, setFormClasse] = useState('CHIP');
  const [formSituacao, setFormSituacao] = useState('INATIVO');
  const [formDataMovimento, setFormDataMovimento] = useState('');
  const [formSaidaValida, setFormSaidaValida] = useState('');
  const [formDiasCorridos, setFormDiasCorridos] = useState('0');
  const [formQtdEstoque, setFormQtdEstoque] = useState('1');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Abrir Modal Criar
  const abrirModalCriar = () => {
    setItemEdicao(null);
    setFormMatricula('');
    setFormColaborador('');
    setFormUf('PB');
    setFormCargo('OPERADOR DE SERVICOS DE CAMPO');
    setFormLider('');
    setFormNomeItem('');
    setFormIdItem('');
    setFormSerial('');
    setFormClasse('CHIP');
    setFormSituacao('INATIVO');
    setFormDataMovimento(new Date().toLocaleDateString('pt-BR'));
    setFormSaidaValida(new Date().toLocaleDateString('pt-BR'));
    setFormDiasCorridos('0');
    setFormQtdEstoque('1');
    setModalAberto(true);
  };

  // Abrir Modal Editar
  const abrirModalEditar = (item: ItemInativo) => {
    setItemEdicao(item);
    setFormMatricula(item.matricula || '');
    setFormColaborador(item.colaborador || item.funcionario || '');
    setFormUf(item.uf || 'PB');
    setFormCargo(item.cargo || 'OPERADOR DE SERVICOS DE CAMPO');
    setFormLider(item.lider || item.supervisor || '');
    setFormNomeItem(item.nomeItem || '');
    setFormIdItem(item.idItem || '');
    setFormSerial(item.serial || '');
    setFormClasse(item.classe || 'CHIP');
    setFormSituacao(item.situacao || item.statusInativo || 'INATIVO');
    setFormDataMovimento(item.dataMovimento || item.dataInativacao || '');
    setFormSaidaValida(item.saidaValida || '');
    setFormDiasCorridos((item.diasCorridos || 0).toString());
    setFormQtdEstoque((item.qtdEstoque || 1).toString());
    setModalAberto(true);
  };

  // Agrupamento de inativos por Colaborador
  const colabGrupos = useMemo(() => {
    const mapa = new Map<
      string,
      {
        matricula: string;
        colaborador: string;
        uf: string;
        cargo: string;
        lider: string;
        itens: ItemInativo[];
      }
    >();

    inativos.forEach((item) => {
      const nome = (item.colaborador || item.funcionario || 'COLABORADOR NÃO IDENTIFICADO')
        .trim()
        .toUpperCase();
      const mat = (item.matricula || '').trim();
      const key = mat ? `${mat}_${nome}` : nome;

      if (!mapa.has(key)) {
        mapa.set(key, {
          matricula: mat,
          colaborador: nome,
          uf: item.uf || item.cidade || 'PB',
          cargo: item.cargo || item.tipo || 'OPERADOR DE SERVICOS DE CAMPO',
          lider: item.lider || item.supervisor || '',
          itens: [],
        });
      }

      mapa.get(key)!.itens.push(item);
    });

    return Array.from(mapa.values());
  }, [inativos]);

  // Função para gerar o texto formatado para o WhatsApp por colaborador
  const gerarMensagemWhatsAppColaborador = (
    nomeColaborador: string,
    matricula: string,
    itensColab: ItemInativo[]
  ) => {
    let msg = `*NOTIFICAÇÃO DE ITENS INATIVOS EM ESTOQUE*\n`;
    msg += `👤 *Colaborador:* ${nomeColaborador}\n`;
    if (matricula) msg += `🔢 *Matrícula:* ${matricula}\n`;
    msg += `📊 *Total de Itens Inativos:* ${itensColab.length}\n\n`;
    msg += `Identificamos os seguintes equipamentos/chips com situação *INATIVO* vinculados ao seu cadastro:\n\n`;

    itensColab.forEach((item, idx) => {
      msg += `*${idx + 1}. ${item.nomeItem || 'EQUIPAMENTO / ITEM'}*\n`;
      if (item.idItem) msg += `   • *ID Item:* ${item.idItem}\n`;
      if (item.serial) msg += `   • *Serial:* \`${item.serial}\`\n`;
      if (item.classe) msg += `   • *Classe:* ${item.classe}\n`;
      if (item.diasCorridos) msg += `   • *Dias Inativo:* ${item.diasCorridos} dias\n`;
      if (item.dataMovimento) msg += `   • *Data Movimento:* ${item.dataMovimento}\n`;
      msg += `\n`;
    });

    msg += `Por favor, providencie a regularização ou devolução dos itens listados acima com sua liderança.\n\n`;
    msg += `_Mensagem gerada automaticamente via Sistema Raio-X_`;
    return msg;
  };

  // Atualizar telefone do colaborador no mapa
  const handleTelefoneChange = (nomeColaborador: string, novoTelefone: string) => {
    setTelefonesMapa((prev) => ({
      ...prev,
      [nomeColaborador.trim().toUpperCase()]: novoTelefone.replace(/\D/g, ''),
    }));
  };

  // Abrir WhatsApp diretamente
  const handleAbrirWhatsApp = (colaborador: string, matricula: string, itens: ItemInativo[]) => {
    const nomeKey = colaborador.trim().toUpperCase();
    const tel = telefonesMapa[nomeKey] || '';

    if (!tel) {
      alert(`Cadastre o número de WhatsApp para "${colaborador}" antes de enviar.`);
      return;
    }

    const mensagem = gerarMensagemWhatsAppColaborador(colaborador, matricula, itens);
    const url = `https://api.whatsapp.com/send?phone=${tel.startsWith('55') ? tel : '55' + tel}&text=${encodeURIComponent(
      mensagem
    )}`;

    window.open(url, '_blank');
  };

  // Copiar mensagem para a área de transferência
  const handleCopiarMensagem = (colaborador: string, matricula: string, itens: ItemInativo[]) => {
    const mensagem = gerarMensagemWhatsAppColaborador(colaborador, matricula, itens);
    navigator.clipboard.writeText(mensagem);
    if (onNotificar) {
      onNotificar(`📋 Mensagem individual de "${colaborador}" copiada para o WhatsApp!`);
    }
  };

  // Baixar Arquivo TXT Individual
  const handleBaixarTxtIndividual = (grupo: {
    colaborador: string;
    matricula: string;
    itens: ItemInativo[];
  }) => {
    const conteudo = gerarMensagemWhatsAppColaborador(
      grupo.colaborador,
      grupo.matricula,
      grupo.itens
    );

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nomeLimpo = grupo.colaborador.replace(/[^a-zA-Z0-9_]/g, '_');
    const matStr = grupo.matricula ? `${grupo.matricula}_` : '';
    link.setAttribute('download', `Relatorio_Inativos_${matStr}${nomeLimpo}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotificar) {
      onNotificar(`📄 Arquivo individual TXT gerado para ${grupo.colaborador}`);
    }
  };

  // Baixar Arquivo CSV Individual
  const handleBaixarCsvIndividual = (grupo: {
    colaborador: string;
    matricula: string;
    uf: string;
    cargo: string;
    itens: ItemInativo[];
  }) => {
    let csv =
      'MATRICULA;COLABORADOR;UF;CARGO;NOME_ITEM;ID_ITEM;SERIAL;CLASSE;SITUACAO;DATA_MOVIMENTO;SAIDA_VALIDA;DIAS_CORRIDOS;QTD_ESTOQUE\n';

    grupo.itens.forEach((item) => {
      csv += `${item.matricula || ''};${item.colaborador || ''};${item.uf || ''};${item.cargo || ''};"${item.nomeItem || ''}";${item.idItem || ''};${item.serial || ''};${item.classe || ''};${item.situacao || ''};"${item.dataMovimento || ''}";"${item.saidaValida || ''}";${item.diasCorridos || 0};${item.qtdEstoque || 1}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nomeLimpo = grupo.colaborador.replace(/[^a-zA-Z0-9_]/g, '_');
    const matStr = grupo.matricula ? `${grupo.matricula}_` : '';
    link.setAttribute('download', `Itens_Inativos_${matStr}${nomeLimpo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Baixar Pacote ZIP com todos os arquivos TXT individuais dos colaboradores
  const handleBaixarZipTodosArquivosIndividuais = async () => {
    if (colabGrupos.length === 0) {
      alert('Não há nenhum colaborador com itens inativos para exportar.');
      return;
    }

    const zip = new JSZip();
    const pastaInativos = zip.folder('Inativos_Por_Colaborador');

    colabGrupos.forEach((grupo) => {
      const msg = gerarMensagemWhatsAppColaborador(
        grupo.colaborador,
        grupo.matricula,
        grupo.itens
      );

      const nomeLimpo = grupo.colaborador.replace(/[^a-zA-Z0-9_]/g, '_');
      const matStr = grupo.matricula ? `${grupo.matricula}_` : '';
      const filename = `Inativos_${matStr}${nomeLimpo}.txt`;

      pastaInativos?.file(filename, msg);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Pacote_Arquivos_Inativos_Colaboradores.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotificar) {
      onNotificar(`📦 Arquivo ZIP gerado com ${colabGrupos.length} arquivos TXT de inativos individuais!`);
    }
  };

  // Exportar Planilha Consolidada para Disparo em Massa
  const handleExportarCsvDisparoWhatsAppMassa = () => {
    if (colabGrupos.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }

    let csv = 'MATRICULA;COLABORADOR;TELEFONE_WHATSAPP;QTD_ITENS;MENSAGEM_WHATSAPP\n';

    colabGrupos.forEach((grupo) => {
      const tel = telefonesMapa[grupo.colaborador.trim().toUpperCase()] || '';
      const msg = gerarMensagemWhatsAppColaborador(
        grupo.colaborador,
        grupo.matricula,
        grupo.itens
      ).replace(/"/g, '""');

      csv += `${grupo.matricula};${grupo.colaborador};${tel};${grupo.itens.length};"${msg}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Disparo_WhatsApp_Inativos_Consolidado.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotificar) {
      onNotificar(`📊 CSV Consolidado para Envio de WhatsApp gerado com sucesso!`);
    }
  };

  // Processar CSV de inativos com mapeamento inteligente de colunas
  const processarTextoCSVInativos = (source: File | string) => {
    setIsLoading(true);
    setErrorMessage(null);

    Papa.parse(source as any, {
      skipEmptyLines: true,
      delimiter: '', // auto detect
      complete: (results) => {
        setIsLoading(false);
        const rows = results.data as string[][];

        if (!rows || rows.length === 0) {
          setErrorMessage('O arquivo ou texto do CSV de inativos está vazio.');
          return;
        }

        let matIdx = -1;
        let colabIdx = -1;
        let ufIdx = -1;
        let cargoIdx = -1;
        let liderIdx = -1;
        let nomeItemIdx = -1;
        let idItemIdx = -1;
        let serialIdx = -1;
        let classeIdx = -1;
        let situacaoIdx = -1;
        let dataMovIdx = -1;
        let saidaValidaIdx = -1;
        let diasCorridosIdx = -1;
        let qtdEstoqueIdx = -1;

        if (rows.length > 0) {
          const firstRow = rows[0].map((c) => (c || '').toString().trim().toUpperCase());

          firstRow.forEach((col, idx) => {
            if (col.includes('MATRICULA') || col.includes('MATRÍCULA') || col === 'MAT') {
              matIdx = idx;
            } else if (
              col.includes('COLABORADOR') ||
              col.includes('FUNCIONARIO') ||
              col.includes('FUNCIONÁRIO') ||
              col === 'NOME'
            ) {
              colabIdx = idx;
            } else if (col === 'UF' || col.includes('ESTADO') || col.includes('CIDADE')) {
              ufIdx = idx;
            } else if (col.includes('CARGO') || col.includes('FUNCAO') || col.includes('FUNÇÃO')) {
              cargoIdx = idx;
            } else if (col.includes('LIDER') || col.includes('LÍDER') || col.includes('SUPERVISOR')) {
              liderIdx = idx;
            } else if (
              col.includes('NOME ITEM') ||
              col.includes('ITEM') ||
              col.includes('EQUIPAMENTO') ||
              col.includes('DESCRICAO')
            ) {
              nomeItemIdx = idx;
            } else if (col.includes('ID ITEM') || col.includes('IDITEM') || col === 'ID') {
              idItemIdx = idx;
            } else if (col.includes('SERIAL') || col.includes('NS') || col.includes('SERIE')) {
              serialIdx = idx;
            } else if (col.includes('CLASSE') || col.includes('CATEGORIA')) {
              classeIdx = idx;
            } else if (
              col.includes('SITUACAO') ||
              col.includes('SITUAÇÃO') ||
              col.includes('STATUS')
            ) {
              situacaoIdx = idx;
            } else if (
              col.includes('DATA MOVIMENTO') ||
              col.includes('MOVIMENTO') ||
              col.includes('DATA')
            ) {
              dataMovIdx = idx;
            } else if (
              col.includes('SAIDA VALIDA') ||
              col.includes('SAÍDA VÁLIDA') ||
              col.includes('SAIDA')
            ) {
              saidaValidaIdx = idx;
            } else if (col.includes('DIAS CORRIDOS') || col.includes('DIAS')) {
              diasCorridosIdx = idx;
            } else if (col.includes('ESTOQUE') || col.includes('QTD') || col.includes('QUANTIDADE')) {
              qtdEstoqueIdx = idx;
            }
          });
        }

        let startIndex = 0;
        const col0 = (rows[0][0] || '').toString().toUpperCase();
        if (
          col0.includes('MATRICULA') ||
          col0.includes('COLABORADOR') ||
          col0.includes('FUNC') ||
          col0.includes('ITEM') ||
          matIdx !== -1 ||
          colabIdx !== -1
        ) {
          startIndex = 1;
        }

        if (colabIdx === -1) colabIdx = matIdx === 0 ? 1 : 0;
        if (matIdx === -1) matIdx = 0;
        if (ufIdx === -1) ufIdx = 2;
        if (cargoIdx === -1) cargoIdx = 3;
        if (liderIdx === -1) liderIdx = 4;
        if (nomeItemIdx === -1) nomeItemIdx = 5;
        if (idItemIdx === -1) idItemIdx = 6;
        if (serialIdx === -1) serialIdx = 7;
        if (classeIdx === -1) classeIdx = 8;
        if (situacaoIdx === -1) situacaoIdx = 9;
        if (dataMovIdx === -1) dataMovIdx = 10;
        if (saidaValidaIdx === -1) saidaValidaIdx = 11;
        if (diasCorridosIdx === -1) diasCorridosIdx = 12;
        if (qtdEstoqueIdx === -1) qtdEstoqueIdx = 13;

        const novosInativos: ItemInativo[] = [];

        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 2) continue;

          const rawColab = (row[colabIdx] || row[matIdx] || '').toString().trim();
          if (!rawColab) continue;

          const rawMatricula = (row[matIdx] || '').toString().trim();
          const rawUf = (row[ufIdx] || 'PB').toString().trim().toUpperCase();
          const rawCargo = (row[cargoIdx] || 'OPERADOR DE SERVICOS DE CAMPO').toString().trim().toUpperCase();
          const rawLider = (row[liderIdx] || '').toString().trim().toUpperCase();
          const rawNomeItem = (row[nomeItemIdx] || '').toString().trim();
          const rawIdItem = (row[idItemIdx] || '').toString().trim();
          const rawSerial = (row[serialIdx] || '').toString().trim();
          const rawClasse = (row[classeIdx] || 'CHIP').toString().trim().toUpperCase();
          const rawSituacao = (row[situacaoIdx] || 'INATIVO').toString().trim().toUpperCase();
          const rawDataMov = (row[dataMovIdx] || '').toString().trim();
          const rawSaidaValida = (row[saidaValidaIdx] || '').toString().trim();

          let rawDias = 0;
          if (row[diasCorridosIdx]) {
            const parsed = parseInt(row[diasCorridosIdx].toString().replace(/\D/g, ''), 10);
            if (!isNaN(parsed)) rawDias = parsed;
          }

          let rawQtd = 1;
          if (row[qtdEstoqueIdx]) {
            const parsed = parseInt(row[qtdEstoqueIdx].toString().replace(/\D/g, ''), 10);
            if (!isNaN(parsed)) rawQtd = parsed;
          }

          novosInativos.push({
            id: `csv-inativo-${Date.now()}-${i}`,
            matricula: rawMatricula,
            colaborador: rawColab,
            uf: rawUf,
            cargo: rawCargo,
            lider: rawLider,
            nomeItem: rawNomeItem,
            idItem: rawIdItem,
            serial: rawSerial,
            classe: rawClasse,
            situacao: rawSituacao,
            dataMovimento: rawDataMov,
            saidaValida: rawSaidaValida,
            diasCorridos: rawDias,
            qtdEstoque: rawQtd,
            funcionario: rawColab,
            cidade: rawUf,
            supervisor: rawLider || 'LIDERANÇA PB',
            statusInativo: rawSituacao,
            dataInativacao: rawDataMov,
          });
        }

        if (novosInativos.length > 0) {
          if (modoSubstituir) {
            setInativos(novosInativos);
          } else {
            setInativos((prev) => [...prev, ...novosInativos]);
          }
          setPastedCSV('');
          if (onNotificar) {
            onNotificar(`🚫 ${novosInativos.length} itens inativos importados com sucesso do CSV!`);
          }
        } else {
          setErrorMessage('Não foi possível identificar dados válidos no CSV fornecido.');
        }
      },
      error: (err) => {
        setIsLoading(false);
        setErrorMessage(`Erro no PapaParse ao processar CSV de inativos: ${err.message}`);
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processarTextoCSVInativos(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processarTextoCSVInativos(e.dataTransfer.files[0]);
    }
  };

  const handleSalvarItemManual = () => {
    if (!formColaborador.trim() || !formNomeItem.trim()) {
      alert('Por favor, informe pelo menos o Colaborador e o Nome do Item.');
      return;
    }

    const itemSalvar: ItemInativo = {
      id: itemEdicao ? itemEdicao.id : `inativo-${Date.now()}`,
      matricula: formMatricula.trim(),
      colaborador: formColaborador.trim().toUpperCase(),
      uf: formUf.trim().toUpperCase(),
      cargo: formCargo.trim().toUpperCase(),
      lider: formLider.trim().toUpperCase(),
      nomeItem: formNomeItem.trim(),
      idItem: formIdItem.trim(),
      serial: formSerial.trim(),
      classe: formClasse.trim().toUpperCase(),
      situacao: formSituacao.trim().toUpperCase(),
      dataMovimento: formDataMovimento.trim(),
      saidaValida: formSaidaValida.trim(),
      diasCorridos: parseInt(formDiasCorridos, 10) || 0,
      qtdEstoque: parseInt(formQtdEstoque, 10) || 1,
      funcionario: formColaborador.trim().toUpperCase(),
      cidade: formUf.trim().toUpperCase(),
      supervisor: formLider.trim().toUpperCase() || 'LIDERANÇA PB',
      statusInativo: formSituacao.trim().toUpperCase(),
      dataInativacao: formDataMovimento.trim(),
    };

    if (itemEdicao) {
      setInativos((prev) => prev.map((x) => (x.id === itemEdicao.id ? itemSalvar : x)));
      if (onNotificar) onNotificar(`✏️ Item inativo "${itemSalvar.nomeItem}" atualizado.`);
    } else {
      setInativos((prev) => [itemSalvar, ...prev]);
      if (onNotificar) onNotificar(`➕ Item inativo "${itemSalvar.nomeItem}" cadastrado.`);
    }

    setModalAberto(false);
  };

  const handleExcluirInativo = (id: string, nome: string) => {
    if (confirm(`Deseja remover permanentemente o registro de "${nome}"?`)) {
      setInativos((prev) => prev.filter((x) => x.id !== id));
      if (onNotificar) onNotificar(`🗑️ Registro "${nome}" removido dos inativos.`);
    }
  };

  const handleReativarItem = (item: ItemInativo) => {
    const nomeMostrar = item.colaborador || item.funcionario || 'Colaborador';
    if (confirm(`Deseja reativar o colaborador "${nomeMostrar}" e adicioná-lo à Base Raio-X Ativa?`)) {
      const novoColab: Colaborador = {
        id: `reativado-${Date.now()}`,
        funcionario: nomeMostrar,
        cidade: item.uf || item.cidade || 'PB',
        supervisor: item.lider || item.supervisor || 'SUPERVISÃO GERAL',
        gerente: item.gerente || 'PATRICIA LIMA',
        tipo: item.cargo || item.tipo || 'TÉCNICO IAT',
        statusMes: '-',
        quartil: '3º QUARTIL',
        ptInst: 0,
        ptRep: 0,
        ptReg: 0,
        ptRec: 0,
        ptProdExtra: 0,
        infracoesQualidade: 0,
        pontos: item.pontosAcumulados || 0,
        recPercent: 0,
        clientesTotais: 0,
        meta: 176,
        falta: 176,
      };

      setColaboradores((prev) => [novoColab, ...prev]);
      setInativos((prev) => prev.filter((x) => x.id !== item.id));

      if (onNotificar) {
        onNotificar(`✅ "${nomeMostrar}" reativado e retornado à Base Raio-X de Ativos!`);
      }
    }
  };

  const handleExportarInativosCSV = () => {
    let csv =
      'MATRICULA;COLABORADOR;UF;CARGO;LIDER;NOME ITEM;ID ITEM;SERIAL;CLASSE;SITUACAO;DATA MOVIMENTO;SAIDA VALIDA;DIAS CORRIDOS Dias;ITENS ESTOQUE Qtd\n';

    inativos.forEach((item) => {
      csv += `${item.matricula || ''};${item.colaborador || item.funcionario || ''};${item.uf || ''};${item.cargo || ''};${item.lider || ''};"${item.nomeItem || ''}";${item.idItem || ''};${item.serial || ''};${item.classe || ''};${item.situacao || item.statusInativo || 'INATIVO'};"${item.dataMovimento || ''}";"${item.saidaValida || ''}";${item.diasCorridos || 0};${item.qtdEstoque || 1}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Itens_e_Colaboradores_Inativos.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBaixarModeloInativos = () => {
    const modelo =
      'MATRICULA,COLABORADOR,UF,CARGO,LIDER,NOME ITEM,ID ITEM,SERIAL,CLASSE,SITUACAO,DATA MOVIMENTO,SAIDA VALIDA,DIAS CORRIDOS Dias,ITENS ESTOQUE Qtd\n' +
      '16173,CEDRIC WESLEY LUCAS SILVA,PB,OPERADOR DE SERVICOS DE CAMPO,,4000002642 CHIP BRISANET MOVEL - (SERIALIZADO),8868067,89557788000017460768,CHIP,INATIVO,"8 de abr. de 2026, 10:12:17","13 de jan. de 2026, 19:29:05",191,1\n' +
      '23070,DIEGO MARCIANO DA SILVA,PB,OPERADOR DE SERVICOS DE CAMPO,,1000016232 5G AX3600 WIFI 6 TELEOHONY ROUTER,7198583,224B6E8000038,FWA,INATIVO,"3 de jun. de 2026, 08:04:06","3 de jun. de 2026, 11:04:06",50,1\n' +
      '23071,ELIAKUIM PEREIRA DA SILVA,PB,OPERADOR DE SERVICOS DE CAMPO,,ROTEADOR AC1350 4 ANTENAS,2150158,320C0F4019612,ROTEADOR,INATIVO,"18 de jun. de 2026, 08:49:07","18 de jun. de 2026, 11:49:07",35,1\n';

    const blob = new Blob([modelo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `modelo_itens_inativos.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Estatísticas
  const totalItens = inativos.length;
  const totalInativos = inativos.filter(
    (i) => (i.situacao || i.statusInativo || '').toUpperCase() === 'INATIVO'
  ).length;
  const totalAtivos = inativos.filter(
    (i) => (i.situacao || i.statusInativo || '').toUpperCase() === 'ATIVO'
  ).length;

  const classesUnicas = Array.from(
    new Set(inativos.map((i) => i.classe).filter(Boolean))
  );

  // Filtragem da Tabela Geral
  const inativosFiltrados = inativos.filter((item) => {
    const buscaLower = busca.toLowerCase();
    const colabNome = (item.colaborador || item.funcionario || '').toLowerCase();
    const itemNome = (item.nomeItem || '').toLowerCase();
    const serialStr = (item.serial || '').toLowerCase();
    const idItemStr = (item.idItem || '').toLowerCase();
    const matStr = (item.matricula || '').toLowerCase();

    const matchBusca =
      colabNome.includes(buscaLower) ||
      itemNome.includes(buscaLower) ||
      serialStr.includes(buscaLower) ||
      idItemStr.includes(buscaLower) ||
      matStr.includes(buscaLower);

    if (!matchBusca) return false;

    if (filtroSituacao !== 'todos') {
      const sitUpper = (item.situacao || item.statusInativo || '').toUpperCase();
      if (sitUpper !== filtroSituacao.toUpperCase()) return false;
    }

    if (filtroClasse !== 'todos') {
      if ((item.classe || '').toUpperCase() !== filtroClasse.toUpperCase()) return false;
    }

    return true;
  });

  // Filtragem do Agrupamento por Colaborador
  const colabGruposFiltrados = colabGrupos.filter((grupo) => {
    const buscaLower = busca.toLowerCase();
    return (
      grupo.colaborador.toLowerCase().includes(buscaLower) ||
      grupo.matricula.toLowerCase().includes(buscaLower) ||
      grupo.itens.some(
        (it) =>
          (it.nomeItem || '').toLowerCase().includes(buscaLower) ||
          (it.serial || '').toLowerCase().includes(buscaLower)
      )
    );
  });

  return (
    <div className="flex-1 flex flex-col gap-5 overflow-auto pr-1">
      {/* Banner Principal */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-[#1F4E79] text-white p-5 rounded-2xl shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserX className="w-6 h-6 text-rose-400" />
            <h2 className="text-xl font-bold tracking-tight">Gestão de Itens e Equipamentos Inativos</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Importe a planilha CSV e gere automaticamente <b>arquivos TXT/CSV individuais por colaborador</b> e links para envio direto no <b>WhatsApp</b>!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBaixarZipTodosArquivosIndividuais}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm border border-emerald-500"
            title="Baixar um pacote .ZIP contendo um arquivo .TXT individual para cada colaborador"
          >
            <Archive className="w-3.5 h-3.5" />
            Baixar Todos em ZIP (TXT Individual)
          </button>

          <button
            onClick={handleExportarCsvDisparoWhatsAppMassa}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm border border-blue-500"
            title="Exportar CSV com telefones e mensagens para disparo de WhatsApp em massa"
          >
            <Send className="w-3.5 h-3.5" />
            CSV Disparo WhatsApp
          </button>

          <button
            onClick={handleBaixarModeloInativos}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20"
          >
            <Download className="w-3.5 h-3.5" />
            Modelo CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Registros</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalItens}</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Box className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Colaboradores c/ Inativos</p>
            <p className="text-2xl font-bold text-rose-600 mt-0.5">{colabGrupos.length}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Itens Inativos</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{totalInativos}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classes de Equipamentos</p>
            <p className="text-2xl font-bold text-blue-600 mt-0.5">{classesUnicas.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Selector de Abas de Visão Internas */}
      <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVisaoAtiva('tabela')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              visaoAtiva === 'tabela'
                ? 'bg-white text-[#1F4E79] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tabela Geral de Itens</span>
          </button>

          <button
            onClick={() => setVisaoAtiva('whatsapp_individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              visaoAtiva === 'whatsapp_individual'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Arquivos & Envio Individual WhatsApp ({colabGrupos.length})</span>
          </button>
        </div>

        <button
          onClick={abrirModalCriar}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Registro Manual
        </button>
      </div>

      {/* Área de Importação de CSV */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#1F4E79]" />
            <span>Alimentar Tabela de Itens Inativos via CSV</span>
          </h3>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Modo de Importação:</span>
            <button
              onClick={() => setModoSubstituir(!modoSubstituir)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                modoSubstituir
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              {modoSubstituir ? 'Substituir Tabela Atual' : 'Somar/Acrescentar à Tabela'}
            </button>
          </div>
        </div>

        {/* File input oculto */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv, .tsv, .txt"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zone Drag & Drop */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-rose-500 bg-rose-50 scale-[1.01]'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Arraste seu arquivo CSV de inativos aqui, ou <span className="text-rose-700 underline">clique para procurar</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Suporta a estrutura do seu CSV: <code>MATRICULA, COLABORADOR, UF, CARGO, NOME ITEM, SERIAL, SITUACAO...</code>
              </p>
            </div>
          </div>

          {/* Área de Colar CSV Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Copiar e Colar Linhas da Planilha CSV
            </label>
            <textarea
              value={pastedCSV}
              onChange={(e) => setPastedCSV(e.target.value)}
              placeholder="MATRICULA,COLABORADOR,UF,CARGO,LIDER,NOME ITEM,ID ITEM,SERIAL,CLASSE,SITUACAO,DATA MOVIMENTO,SAIDA VALIDA,DIAS CORRIDOS Dias,ITENS ESTOQUE Qtd&#10;16173,CEDRIC WESLEY,PB,OPERADOR,,4000002642 CHIP,8868067,895577880,CHIP,INATIVO,08/04/2026,13/01/2026,191,1"
              rows={4}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1F4E79] bg-slate-50 focus:bg-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => processarTextoCSVInativos(pastedCSV)}
                disabled={isLoading || !pastedCSV.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-40"
              >
                <Check className="w-3.5 h-3.5" />
                {isLoading ? 'Processando...' : 'Processar CSV'}
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* CONTEÚDO 1: VISÃO WHATSAPP / ARQUIVOS INDIVIDUAIS POR COLABORADOR */}
      {visaoAtiva === 'whatsapp_individual' && (
        <div className="flex flex-col gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">
                  Envio Individual e Geração de Arquivos por Colaborador
                </h4>
                <p className="text-xs text-emerald-800">
                  Abaixo estão os relatórios agrupados para cada colaborador que possui itens inativos. Você pode baixar o arquivo .TXT/.CSV de cada um ou enviar a notificação formatada diretamente no WhatsApp!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBaixarZipTodosArquivosIndividuais}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Archive className="w-3.5 h-3.5" />
                Baixar Pacote .ZIP (Todos os .TXT)
              </button>
            </div>
          </div>

          {/* Campo de Busca de Colaborador */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filtrar colaborador por nome, matrícula, item ou serial..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Cards dos Colaboradores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colabGruposFiltrados.length === 0 ? (
              <div className="col-span-2 bg-white rounded-xl p-8 text-center text-slate-500 italic border border-slate-200">
                Nenhum colaborador com itens inativos encontrado para os filtros atuais.
              </div>
            ) : (
              colabGruposFiltrados.map((grupo) => {
                const telKey = grupo.colaborador.trim().toUpperCase();
                const telAtual = telefonesMapa[telKey] || '';

                return (
                  <div
                    key={grupo.colaborador}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    {/* Header do Card */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              MAT: {grupo.matricula || 'N/I'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                              UF: {grupo.uf}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm mt-1.5">
                            {grupo.colaborador}
                          </h3>
                          <p className="text-[11px] text-slate-500">{grupo.cargo}</p>
                        </div>

                        <span className="bg-rose-100 text-rose-800 text-xs font-extrabold px-3 py-1 rounded-full border border-rose-200">
                          {grupo.itens.length} {grupo.itens.length === 1 ? 'item' : 'itens'} inativos
                        </span>
                      </div>

                      {/* Preview dos Itens */}
                      <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Equipamentos / Chips Retidos:
                        </p>
                        {grupo.itens.map((it, idx) => (
                          <div key={it.id || idx} className="text-xs text-slate-700 border-b border-slate-200/60 pb-1 last:border-0 last:pb-0">
                            <div className="font-semibold text-slate-800">{idx + 1}. {it.nomeItem}</div>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono">
                              {it.idItem && <span>ID: {it.idItem}</span>}
                              {it.serial && <span>Serial: {it.serial}</span>}
                              {it.diasCorridos !== undefined && (
                                <span className="text-rose-600 font-bold">({it.diasCorridos} dias)</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Campo de Telefone & Ações de Envio e Download */}
                    <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                        <input
                          type="text"
                          placeholder="DDD + WhatsApp (ex: 5583999998888)"
                          value={telAtual}
                          onChange={(e) => handleTelefoneChange(grupo.colaborador, e.target.value)}
                          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-emerald-600 flex-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                          onClick={() => handleAbrirWhatsApp(grupo.colaborador, grupo.matricula, grupo.itens)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                          title="Abrir diretamente no WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar</span>
                        </button>

                        <button
                          onClick={() => handleCopiarMensagem(grupo.colaborador, grupo.matricula, grupo.itens)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-200"
                          title="Copiar texto para colar no WhatsApp"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </button>

                        <button
                          onClick={() => handleBaixarTxtIndividual(grupo)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                          title="Baixar arquivo TXT formatado para este colaborador"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>TXT Ind.</span>
                        </button>

                        <button
                          onClick={() => handleBaixarCsvIndividual(grupo)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold transition-all border border-blue-200"
                          title="Baixar CSV apenas deste colaborador"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>CSV Ind.</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO 2: TABELA GERAL DE ITENS INATIVOS */}
      {visaoAtiva === 'tabela' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Barra de Filtros */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por colaborador, item, serial, id ou matrícula..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
              </div>

              <select
                value={filtroSituacao}
                onChange={(e) => setFiltroSituacao(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#1F4E79]"
              >
                <option value="todos">Todas as Situações</option>
                <option value="INATIVO">Inativo</option>
                <option value="ATIVO">Ativo</option>
              </select>

              <select
                value={filtroClasse}
                onChange={(e) => setFiltroClasse(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#1F4E79]"
              >
                <option value="todos">Todas as Classes</option>
                {classesUnicas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportarInativosCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Exportar Tabela Geral (CSV)
            </button>
          </div>

          {/* Tabela Responsiva */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Matrícula & Colaborador</th>
                  <th className="p-3">UF / Cargo</th>
                  <th className="p-3">Nome do Item & ID</th>
                  <th className="p-3">Serial</th>
                  <th className="p-3">Classe</th>
                  <th className="p-3">Situação</th>
                  <th className="p-3">Data Movimento / Saída Válida</th>
                  <th className="p-3 text-center">Dias Corridos</th>
                  <th className="p-3 text-center">Qtd</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inativosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 italic">
                      Nenhum item ou registro inativo encontrado.
                    </td>
                  </tr>
                ) : (
                  inativosFiltrados.map((item) => {
                    const sitUpper = (item.situacao || item.statusInativo || 'INATIVO').toUpperCase();
                    let badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200';

                    if (sitUpper === 'ATIVO') {
                      badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    }

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">
                            {item.colaborador || item.funcionario || '—'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Mat: {item.matricula || 'N/I'}
                          </p>
                        </td>

                        <td className="p-3 text-slate-700">
                          <span className="font-bold text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 mr-1">
                            {item.uf || 'PB'}
                          </span>
                          <span className="text-[10px] text-slate-500">{item.cargo || '—'}</span>
                        </td>

                        <td className="p-3 max-w-xs">
                          <p className="font-semibold text-slate-800 truncate" title={item.nomeItem}>
                            {item.nomeItem || '—'}
                          </p>
                          {item.idItem && (
                            <p className="text-[10px] font-mono text-slate-500">ID: {item.idItem}</p>
                          )}
                        </td>

                        <td className="p-3 font-mono text-[11px] text-slate-700">
                          {item.serial || '—'}
                        </td>

                        <td className="p-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                            {item.classe || 'CHIP'}
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}
                          >
                            {item.situacao || item.statusInativo || 'INATIVO'}
                          </span>
                        </td>

                        <td className="p-3 text-slate-600 text-[11px]">
                          <p className="font-medium text-slate-800">{item.dataMovimento || '—'}</p>
                          {item.saidaValida && (
                            <p className="text-[10px] text-slate-400">Saída: {item.saidaValida}</p>
                          )}
                        </td>

                        <td className="p-3 text-center font-mono font-bold text-slate-700">
                          {item.diasCorridos || 0}d
                        </td>

                        <td className="p-3 text-center font-bold text-slate-800">
                          {item.qtdEstoque || 1}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleReativarItem(item)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Reativar Colaborador na Base Ativa"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => abrirModalEditar(item)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Editar Registro"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleExcluirInativo(item.id, item.nomeItem || 'Item')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remover Registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição Manual */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                  <Box className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {itemEdicao ? 'Editar Item Inativo' : 'Adicionar Item Inativo Manualmente'}
                </h3>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Matrícula</label>
                <input
                  type="text"
                  placeholder="Ex: 16173"
                  value={formMatricula}
                  onChange={(e) => setFormMatricula(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Colaborador</label>
                <input
                  type="text"
                  placeholder="Ex: CEDRIC WESLEY LUCAS SILVA"
                  value={formColaborador}
                  onChange={(e) => setFormColaborador(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">UF</label>
                <input
                  type="text"
                  placeholder="Ex: PB"
                  value={formUf}
                  onChange={(e) => setFormUf(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Cargo</label>
                <input
                  type="text"
                  placeholder="Ex: OPERADOR DE SERVICOS DE CAMPO"
                  value={formCargo}
                  onChange={(e) => setFormCargo(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">Nome do Item</label>
                <input
                  type="text"
                  placeholder="Ex: 4000002642 CHIP BRISANET MOVEL - (SERIALIZADO)"
                  value={formNomeItem}
                  onChange={(e) => setFormNomeItem(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ID Item</label>
                <input
                  type="text"
                  placeholder="Ex: 8868067"
                  value={formIdItem}
                  onChange={(e) => setFormIdItem(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Serial</label>
                <input
                  type="text"
                  placeholder="Ex: 89557788000017460768"
                  value={formSerial}
                  onChange={(e) => setFormSerial(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Classe</label>
                <select
                  value={formClasse}
                  onChange={(e) => setFormClasse(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                >
                  <option value="CHIP">CHIP</option>
                  <option value="ONU">ONU</option>
                  <option value="ROTEADOR">ROTEADOR</option>
                  <option value="TELEFONE">TELEFONE</option>
                  <option value="FWA">FWA</option>
                  <option value="OUTROS">OUTROS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Situação</label>
                <select
                  value={formSituacao}
                  onChange={(e) => setFormSituacao(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                >
                  <option value="INATIVO">INATIVO</option>
                  <option value="ATIVO">ATIVO</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dias Corridos</label>
                <input
                  type="number"
                  value={formDiasCorridos}
                  onChange={(e) => setFormDiasCorridos(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Data Movimento</label>
                <input
                  type="text"
                  placeholder='Ex: "8 de abr. de 2026, 10:12:17"'
                  value={formDataMovimento}
                  onChange={(e) => setFormDataMovimento(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Saída Válida</label>
                <input
                  type="text"
                  placeholder='Ex: "13 de jan. de 2026"'
                  value={formSaidaValida}
                  onChange={(e) => setFormSaidaValida(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarItemManual}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                Salvar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
