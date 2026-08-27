import React, { useState, useRef } from 'react';
import {
  Phone,
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
  Send,
  UserCheck,
  UserX,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Papa from 'papaparse';
import { Colaborador } from '../types';

interface PhoneImportViewProps {
  colaboradores: Colaborador[];
  telefonesMapa: Record<string, string>;
  setTelefonesMapa: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onNotificar?: (msg: string) => void;
}

export const PhoneImportView: React.FC<PhoneImportViewProps> = ({
  colaboradores,
  telefonesMapa,
  setTelefonesMapa,
  onNotificar,
}) => {
  const [pastedCSV, setPastedCSV] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'vinculados' | 'sem_telefone'>('todos');

  // Modal manual de adição
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper para formatar telefone para formato WhatsApp BR (55 + DDD + Numero)
  const formatarTelefoneWhatsApp = (raw: string): string => {
    if (!raw) return '';
    let digits = raw.replace(/\D/g, '');
    if (!digits) return '';

    // Se começar com 0 (ex: 011999998888), remove o 0
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    // Se tiver 10 ou 11 dígitos (ex: 11999998888 ou 1133334444), adiciona 55 do Brasil
    if (digits.length === 10 || digits.length === 11) {
      digits = '55' + digits;
    }

    return digits;
  };

  // Helper para exibiçao visual amigavel do telefone: +55 (11) 99999-8888
  const formatarTelefoneExibicao = (num: string): string => {
    if (!num) return 'Sem Telefone';
    const clean = num.replace(/\D/g, '');
    if (clean.length === 13) {
      // 55 11 99999 8888
      return `+${clean.substring(0, 2)} (${clean.substring(2, 4)}) ${clean.substring(4, 9)}-${clean.substring(9)}`;
    } else if (clean.length === 12) {
      // 55 11 3333 4444
      return `+${clean.substring(0, 2)} (${clean.substring(2, 4)}) ${clean.substring(4, 8)}-${clean.substring(8)}`;
    } else if (clean.length === 11) {
      // 11 99999 8888
      return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
    }
    return clean;
  };

  // Parser do CSV/Texto para mapa de telefones
  const processarTextoCSV = (source: File | string) => {
    setIsLoading(true);
    setErrorMessage(null);

    Papa.parse(source as any, {
      skipEmptyLines: true,
      delimiter: '', // auto-detect ;, tab, comma
      complete: (results) => {
        setIsLoading(false);
        const rows = results.data as string[][];

        if (!rows || rows.length === 0) {
          setErrorMessage('O arquivo ou texto fornecido está vazio.');
          return;
        }

        let nameIdx = -1;
        let phoneIdx = -1;

        // Tenta detectar cabeçalho
        if (rows.length > 0) {
          const firstRow = rows[0].map((c) => (c || '').toString().trim().toUpperCase());
          firstRow.forEach((col, idx) => {
            if (
              col.includes('FUNC') ||
              col.includes('NOME') ||
              col.includes('COLABORADOR') ||
              col.includes('RE') ||
              col.includes('TECNICO')
            ) {
              nameIdx = idx;
            } else if (
              col.includes('TEL') ||
              col.includes('CEL') ||
              col.includes('WHATS') ||
              col.includes('FONE') ||
              col.includes('CONTATO') ||
              col.includes('NUMERO') ||
              col.includes('PHONE')
            ) {
              phoneIdx = idx;
            }
          });
        }

        let startIndex = 0;
        if (nameIdx !== -1 && phoneIdx !== -1) {
          startIndex = 1; // tem cabeçalho
        } else {
          // Fallback posicional: Coluna 0 = Nome, Coluna 1 = Telefone (ou vice-versa)
          nameIdx = 0;
          phoneIdx = 1;
          // Se a primeira linha tiver palavras de cabeçalho, pula
          const col0 = (rows[0][0] || '').toString().toUpperCase();
          const col1 = (rows[0][1] || '').toString().toUpperCase();
          if (
            col0.includes('NOME') ||
            col0.includes('FUNC') ||
            col1.includes('TEL') ||
            col1.includes('CEL')
          ) {
            startIndex = 1;
          }
        }

        const novosTelefones: Record<string, string> = {};
        let contadorAdicionados = 0;

        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 1) continue;

          const rawNome = (row[nameIdx] || '').toString().trim();
          const rawTel = (row[phoneIdx] || row[nameIdx + 1] || '').toString().trim();

          if (!rawNome) continue;

          const nomeChave = rawNome.split('-')[0].trim().toUpperCase();
          const telFormatado = formatarTelefoneWhatsApp(rawTel);

          if (nomeChave && telFormatado) {
            novosTelefones[nomeChave] = telFormatado;
            contadorAdicionados++;
          }
        }

        if (contadorAdicionados > 0) {
          setTelefonesMapa((prev) => ({
            ...prev,
            ...novosTelefones,
          }));
          setPastedCSV('');
          if (onNotificar) {
            onNotificar(`📱 ${contadorAdicionados} telefones importados com sucesso!`);
          }
        } else {
          setErrorMessage('Não foi possível identificar nomes e números de telefone válidos nas linhas.');
        }
      },
      error: (err) => {
        setIsLoading(false);
        setErrorMessage(`Erro ao processar CSV: ${err.message}`);
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processarTextoCSV(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processarTextoCSV(e.dataTransfer.files[0]);
    }
  };

  const handleAdicionarManual = () => {
    if (!novoNome.trim()) {
      alert('Digite o nome do colaborador.');
      return;
    }
    const nomeChave = novoNome.split('-')[0].trim().toUpperCase();
    const telFormat = formatarTelefoneWhatsApp(novoTelefone);

    if (!telFormat) {
      alert('Digite um número de telefone válido.');
      return;
    }

    setTelefonesMapa((prev) => ({
      ...prev,
      [nomeChave]: telFormat,
    }));

    setNovoNome('');
    setNovoTelefone('');
    setModalNovoAberto(false);
    if (onNotificar) onNotificar(`✅ Telefone de ${nomeChave} atualizado!`);
  };

  const handleRemoverTelefone = (nomeChave: string) => {
    setTelefonesMapa((prev) => {
      const copia = { ...prev };
      delete copia[nomeChave];
      return copia;
    });
    if (onNotificar) onNotificar(`🗑️ Telefone de ${nomeChave} removido.`);
  };

  const handleExportarTelefonesCSV = () => {
    let csv = 'FUNCIONARIO;TELEFONE_WHATSAPP;STATUS_VINCULO\n';

    // Pega todos os colaboradores do sistema + chaves adicionais do mapa
    const chavesUnicas = new Set<string>();

    colaboradores.forEach((c) => {
      const chave = c.funcionario.split('-')[0].trim().toUpperCase();
      chavesUnicas.add(chave);
    });

    Object.keys(telefonesMapa).forEach((k) => chavesUnicas.add(k));

    chavesUnicas.forEach((chave) => {
      const tel = telefonesMapa[chave] || '';
      const colab = colaboradores.find(
        (c) => c.funcionario.split('-')[0].trim().toUpperCase() === chave
      );
      const status = colab ? 'Vinculado' : 'Sem Colaborador no Raio-X';
      csv += `${colab ? colab.funcionario : chave};${tel};${status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Telefones_Colaboradores_RaioX.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBaixarModeloCSV = () => {
    const csvModelo =
      'FUNCIONARIO;TELEFONE\nRICARDO OLIVEIRA;5511999991111\nAMANDA SANTOS;5511999992222\nCARLOS EDUARDO;5519999993333\nFELIPE DANTAS;5519999994444\nJULIANA MENDES;5513999995555\nBRUNO GOMES;5513999996666\nFERNANDA COSTA;5512999997777\nTHIAGO BARBOSA;5519999998888\n';

    const blob = new Blob([csvModelo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `modelo_telefones_colaboradores.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cruzamento de colaboradores com os telefones
  const listaMapeada = colaboradores.map((c) => {
    const chave = c.funcionario.split('-')[0].trim().toUpperCase();
    const tel = telefonesMapa[chave] || telefonesMapa[c.funcionario.trim().toUpperCase()] || '';
    return {
      colaborador: c,
      chave,
      telefone: tel,
      vinculado: true,
    };
  });

  // Chaves do mapa que não estão na lista de colaboradores atual
  const chavesExtras = Object.keys(telefonesMapa).filter(
    (k) => !colaboradores.some((c) => c.funcionario.split('-')[0].trim().toUpperCase() === k)
  );

  const totalColaboradores = colaboradores.length;
  const totalComTelefone = listaMapeada.filter((item) => item.telefone).length;
  const totalSemTelefone = totalColaboradores - totalComTelefone;

  // Filtragem
  const listaFiltrada = listaMapeada.filter((item) => {
    const buscaLower = busca.toLowerCase();
    const matchesBusca =
      item.colaborador.funcionario.toLowerCase().includes(buscaLower) ||
      item.colaborador.supervisor.toLowerCase().includes(buscaLower) ||
      item.telefone.includes(buscaLower);

    if (!matchesBusca) return false;

    if (filtroStatus === 'vinculados') return !!item.telefone;
    if (filtroStatus === 'sem_telefone') return !item.telefone;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col gap-5 overflow-auto pr-1">
      {/* Top Banner de Instrução */}
      <div className="bg-gradient-to-r from-[#1F4E79] to-blue-900 text-white p-5 rounded-2xl shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Phone className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight">Importação de Telefones dos Colaboradores</h2>
          </div>
          <p className="text-xs text-blue-200 mt-1 max-w-2xl">
            Carregue sua lista em CSV ou cole os números do WhatsApp. Os telefones serão automaticamente vinculados aos colaboradores para envio dos feedbacks diários!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBaixarModeloCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Modelo CSV
          </button>
          <button
            onClick={handleExportarTelefonesCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exportar CSV Telefones
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Colaboradores</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalColaboradores}</p>
          </div>
          <div className="p-3 bg-blue-50 text-[#1F4E79] rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefones Cadastrados</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{totalComTelefone}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Phone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendente de Telefone</p>
            <p className="text-2xl font-bold text-rose-600 mt-0.5">{totalSemTelefone}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Área de Importação e Drag-and-Drop */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#1F4E79]" />
          <span>Carregar Novo Arquivo CSV ou Cole a Tabela</span>
        </h3>

        {/* Input Oculto */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv, .tsv, .txt"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zona Drag and Drop */}
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
                ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Arraste seu arquivo CSV de telefones aqui, ou <span className="text-emerald-700 underline">clique para procurar</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Colunas aceitas: <code>FUNCIONARIO; TELEFONE</code> ou <code>NOME; WHATSAPP</code>
              </p>
            </div>
          </div>

          {/* Área de Texto Cole CSV */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Copiar e Colar Linhas da Planilha
            </label>
            <textarea
              value={pastedCSV}
              onChange={(e) => setPastedCSV(e.target.value)}
              placeholder="FUNCIONARIO;TELEFONE&#10;RICARDO OLIVEIRA;5511999991111&#10;AMANDA SANTOS;11999992222"
              rows={4}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1F4E79] bg-slate-50 focus:bg-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => processarTextoCSV(pastedCSV)}
                disabled={isLoading || !pastedCSV.trim()}
                className="px-4 py-2 bg-[#1F4E79] hover:bg-blue-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-40"
              >
                <Check className="w-3.5 h-3.5" />
                {isLoading ? 'Processando...' : 'Processar Texto de Telefones'}
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

      {/* Tabela de Contatos e Ações de Gerenciamento */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Barra de Filtros e Busca */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por colaborador, supervisor ou número..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
              />
            </div>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#1F4E79]"
            >
              <option value="todos">Todos os Colaboradores</option>
              <option value="vinculados">Com Telefone Cadastrado</option>
              <option value="sem_telefone">Sem Telefone (Pendente)</option>
            </select>
          </div>

          <button
            onClick={() => setModalNovoAberto(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F4E79] hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Telefone Manual
          </button>
        </div>

        {/* Tabela de Telefones */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Colaborador / Funcionário</th>
                <th className="p-3">Cidade / Supervisor</th>
                <th className="p-3">Status de Vínculo</th>
                <th className="p-3">Número do WhatsApp</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                    Nenhum colaborador ou telefone encontrado.
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => {
                  const c = item.colaborador;
                  const temTel = !!item.telefone;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{c.funcionario}</p>
                        <p className="text-[10px] text-slate-500">{c.tipo || 'TÉCNICO IAT'}</p>
                      </td>

                      <td className="p-3 text-slate-700">
                        <p className="font-medium">{c.cidade}</p>
                        <p className="text-[10px] text-slate-500">Sup: {c.supervisor}</p>
                      </td>

                      <td className="p-3">
                        {temTel ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" />
                            Cadastrado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            <UserX className="w-3 h-3" />
                            Sem Telefone
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Phone className={`w-3.5 h-3.5 ${temTel ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <input
                            type="text"
                            placeholder="5511999998888"
                            value={item.telefone}
                            onChange={(e) => {
                              const novoVal = formatarTelefoneWhatsApp(e.target.value);
                              setTelefonesMapa((prev) => ({
                                ...prev,
                                [item.chave]: novoVal,
                              }));
                            }}
                            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded px-2.5 py-1 text-xs font-mono text-slate-800 w-44 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {temTel && (
                            <a
                              href={`https://api.whatsapp.com/send?phone=${item.telefone}&text=Olá%20${encodeURIComponent(c.funcionario)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Testar Link do WhatsApp"
                            >
                              <Send className="w-4 h-4" />
                            </a>
                          )}

                          {temTel && (
                            <button
                              onClick={() => handleRemoverTelefone(item.chave)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remover Telefone"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Modal de Adição Manual */}
      {modalNovoAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-[#1F4E79] rounded-lg">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Adicionar / Editar Telefone</h3>
              </div>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Colaborador (ou Selecione da Lista)
                </label>
                <input
                  type="text"
                  list="colaboradores-lista"
                  placeholder="Ex: RICARDO OLIVEIRA"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
                />
                <datalist id="colaboradores-lista">
                  {colaboradores.map((col) => (
                    <option key={col.id} value={col.funcionario.split('-')[0].trim().toUpperCase()} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número do WhatsApp (DDD + Número)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5511999998888 ou 11999998888"
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  O código 55 do Brasil será inserido automaticamente se omitido.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setModalNovoAberto(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdicionarManual}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                Salvar Telefone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
