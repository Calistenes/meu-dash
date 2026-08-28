import React, { useEffect, useRef, useState } from 'react';
import { Database, Plus, Trash2, Edit3, RefreshCw, Upload, Check, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';
import { parseCSVToColaboradores } from '../utils/csvParser';
import { Colaborador } from '../types';

interface BaseDataViewProps {
  colaboradores: Colaborador[];
  setColaboradores: React.Dispatch<React.SetStateAction<Colaborador[]>>;
  onAdicionarColaborador: () => void;
  onResetarDados: () => void;
  metaPadrao: number;
}

export const BaseDataView: React.FC<BaseDataViewProps> = ({
  colaboradores,
  setColaboradores,
  onAdicionarColaborador,
  onResetarDados,
  metaPadrao,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Colaborador>>({});
  const [pastedCSV, setPastedCSV] = useState('');
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [notificacao, setNotificacao] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleStartEdit = (item: Colaborador) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setNotificacao(msg);
    toastTimeoutRef.current = setTimeout(() => setNotificacao(null), 4000);
  };

  const handleSaveEdit = (id: string) => {
    setColaboradores((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...editForm };
          // Recalcular pontos
          const pontosCalculados =
            (updated.ptInst || 0) +
            (updated.ptRep || 0) +
            (updated.ptReg || 0) +
            (updated.ptRec || 0) +
            (updated.ptProdExtra || 0) -
            (updated.infracoesQualidade || 0);

          return {
            ...updated,
            meta: updated.meta || metaPadrao,
            pontos: Number(pontosCalculados.toFixed(2)),
          };
        }
        return c;
      })
    );
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este colaborador da base?')) {
      setColaboradores((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Função central de parsing (compartilhada com o modal global de importação)
  const processarConteudoCSV = (source: File | string) => {
    if (colaboradores.length > 0) {
      const confirmado = confirm(
        `Isso vai substituir todos os ${colaboradores.length} colaboradores atuais da Base Raio-X pelos dados da planilha importada. Deseja continuar?`
      );
      if (!confirmado) return;
    }

    parseCSVToColaboradores(
      source,
      (newItems) => {
        setColaboradores(newItems);
        setShowCSVModal(false);
        setPastedCSV('');
        showToast(`📊 Sucesso! ${newItems.length} colaboradores carregados da planilha.`);
      },
      (err) => alert(err),
      metaPadrao
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processarConteudoCSV(file);
    }
    // reset input
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processarConteudoCSV(e.dataTransfer.files[0]);
    }
  };

  const handleProcessarTextoCSV = () => {
    if (!pastedCSV.trim()) {
      alert('Cole o texto da planilha ou selecione um arquivo.');
      return;
    }
    processarConteudoCSV(pastedCSV);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden relative">
      {/* Toast interno */}
      {notificacao && (
        <div className="absolute top-3 right-3 bg-[#1F4E79] text-white px-4 py-2 rounded-lg shadow-xl text-xs font-bold flex items-center gap-2 z-20 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notificacao}</span>
        </div>
      )}

      {/* Header do Painel de Dados */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#1F4E79]" />
          <div>
            <h2 className="font-bold text-slate-800 text-base">Aba "Base Raio-X" — Planilha Principal</h2>
            <p className="text-xs text-slate-500">
              Total de registros: <span className="font-bold text-slate-700">{colaboradores.length} colaboradores</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Input oculto para carregar arquivo direto */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv, .tsv, .txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs bg-emerald-700 text-white hover:bg-emerald-800 px-3 py-1.5 rounded-lg font-bold transition-colors shadow-xs"
            title="Carregar arquivo CSV exportado diretamente"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Carregar Planilha (CSV)
          </button>

          <button
            onClick={() => setShowCSVModal(true)}
            className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar / Colar Dados
          </button>

          <button
            onClick={onAdicionarColaborador}
            className="flex items-center gap-1.5 text-xs bg-[#1F4E79] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-900 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Colaborador
          </button>

          <button
            onClick={onResetarDados}
            title="Restaurar dados de exemplo"
            className="p-1.5 text-slate-500 hover:text-slate-700 bg-slate-100 rounded-lg border border-slate-200 hover:bg-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de Importação CSV / Upload com Drag and Drop */}
      {showCSVModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#1F4E79]" />
                <h3 className="font-bold text-slate-900 text-base">Alimentar Dados com sua Planilha</h3>
              </div>
              <span className="text-[10px] font-bold bg-blue-100 text-[#1F4E79] px-2 py-0.5 rounded-full uppercase">
                PapaParse Engine
              </span>
            </div>

            {/* Input Oculto do Modal */}
            <input
              type="file"
              ref={modalFileInputRef}
              accept=".csv, .tsv, .txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => modalFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-[#1F4E79] bg-blue-50/80 scale-[1.01]'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1F4E79]">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Arraste e solte o arquivo CSV aqui, ou <span className="text-[#1F4E79] underline">clique para selecionar</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Suporta CSV exportado do Excel, Google Sheets, separado por vírgula ou ponto e vírgula.
                </p>
              </div>
            </div>

            <div className="relative flex items-center my-1">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="shrink mx-3 text-[10px] text-slate-400 font-bold uppercase">ou cole o texto abaixo</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Caixas de Texto para colar CSV */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Copiar e Colar Linhas da Planilha
              </label>
              <textarea
                value={pastedCSV}
                onChange={(e) => setPastedCSV(e.target.value)}
                placeholder="RANKING;FUNCIONARIO;SUPERVISOR;QUARTIL;RECORRENCIA;PERCENTUAL_ATINGIMENTO;PONTOS;META&#10;1º Place;RICARDO OLIVEIRA - 4921;MARCOS SILVA;1º QUARTIL;4.2%;104.7%;184.20;176"
                rows={6}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79] bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-tight">
                <strong>Dica:</strong> O leitor identifica automaticamente colunas como <i>FUNCIONARIO, SUPERVISOR, PONTOS, META, QUARTIL</i> e recalcula a pontuação e metas do app.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCSVModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={handleProcessarTextoCSV}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1F4E79] hover:bg-blue-900 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                Processar com PapaParse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela Interativa de Dados */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200 font-bold uppercase text-[10px] z-10">
            <tr>
              <th className="p-2.5">Funcionário</th>
              <th className="p-2.5">Cidade</th>
              <th className="p-2.5">Supervisor</th>
              <th className="p-2.5">Status Mês</th>
              <th className="p-2.5 text-center">PT Inst.</th>
              <th className="p-2.5 text-center">PT Rep.</th>
              <th className="p-2.5 text-center">PT Reg.</th>
              <th className="p-2.5 text-center">PT Rec.</th>
              <th className="p-2.5 text-center">PT Extra</th>
              <th className="p-2.5 text-center text-rose-600">Infrações</th>
              <th className="p-2.5 text-center font-extrabold bg-blue-50 text-[#1F4E79]">Pontos Totais</th>
              <th className="p-2.5 text-center">Recorrência %</th>
              <th className="p-2.5 text-center">Meta</th>
              <th className="p-2.5 text-center">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-sans">
            {colaboradores.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  {/* Funcionário */}
                  <td className="p-2.5 font-bold">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.funcionario || ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, funcionario: e.target.value }))}
                        className="border rounded px-1.5 py-0.5 text-xs w-48 font-bold"
                      />
                    ) : (
                      item.funcionario
                    )}
                  </td>

                  {/* Cidade */}
                  <td className="p-2.5">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.cidade || ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, cidade: e.target.value }))}
                        className="border rounded px-1.5 py-0.5 text-xs w-32"
                      />
                    ) : (
                      item.cidade
                    )}
                  </td>

                  {/* Supervisor */}
                  <td className="p-2.5">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.supervisor || ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, supervisor: e.target.value }))}
                        className="border rounded px-1.5 py-0.5 text-xs w-32"
                      />
                    ) : (
                      item.supervisor
                    )}
                  </td>

                  {/* Status Mês */}
                  <td className="p-2.5">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.statusMes || ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, statusMes: e.target.value }))}
                        className="border rounded px-1.5 py-0.5 text-xs w-20 text-center font-bold"
                      />
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.statusMes === '-' || !item.statusMes
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.statusMes || '-'}
                      </span>
                    )}
                  </td>

                  {/* PT Inst */}
                  <td className="p-2.5 text-center font-mono">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.5"
                        value={editForm.ptInst ?? 0}
                        onChange={(e) => setEditForm((f) => ({ ...f, ptInst: parseFloat(e.target.value) || 0 }))}
                        className="border rounded px-1 py-0.5 text-xs w-16 text-center font-mono"
                      />
                    ) : (
                      item.ptInst.toFixed(1)
                    )}
                  </td>

                  {/* PT Rep */}
                  <td className="p-2.5 text-center font-mono">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.5"
                        value={editForm.ptRep ?? 0}
                        onChange={(e) => setEditForm((f) => ({ ...f, ptRep: parseFloat(e.target.value) || 0 }))}
                        className="border rounded px-1 py-0.5 text-xs w-16 text-center font-mono"
                      />
                    ) : (
                      item.ptRep.toFixed(1)
                    )}
                  </td>

                  {/* PT Reg */}
                  <td className="p-2.5 text-center font-mono">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.5"
                        value={editForm.ptReg ?? 0}
                        onChange={(e) => setEditForm((f) => ({ ...f, ptReg: parseFloat(e.target.value) || 0 }))}
                        className="border rounded px-1 py-0.5 text-xs w-16 text-center font-mono"
                      />
                    ) : (
                      item.ptReg.toFixed(1)
                    )}
                  </td>

                  {/* PT Rec */}
                  <td className="p-2.5 text-center font-mono">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.5"
                        value={editForm.ptRec ?? 0}
                        onChange={(e) => setEditForm((f) => ({ ...f, ptRec: parseFloat(e.target.value) || 0 }))}
                        className="border rounded px-1 py-0.5 text-xs w-16 text-center font-mono"
                      />
                    ) : (
                      item.ptRec.toFixed(1)
                    )}
                  </td>

                  {/* PT Extra */}
                  <td className="p-2.5 text-center font-mono">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.5"
                        value={editForm.ptProdExtra ?? 0}
                        onChange={(e) => setEditForm((f) => ({ ...f, ptProdExtra: parseFloat(e.target.value) || 0 }))}
                        className="border rounded px-1 py-0.5 text-xs w-16 text-center font-mono"
                      />
                    ) : (
                      item.ptProdExtra.toFixed(1)
                    )}
                  </td>

                  {/* Infrações */}
                  <td className="p-2.5 text-center font-mono text-rose-600 font-bold">
                    {isEditing ? (
                      <input
                        type="number"
                        step="1"
                        value={editForm.infracoesQualidade ?? 0}
                        onChange={(e) => setEditForm((f) => ({ ...f, infracoesQualidade: parseFloat(e.target.value) || 0 }))}
                        className="border rounded px-1 py-0.5 text-xs w-16 text-center font-mono text-rose-600 font-bold"
                      />
                    ) : (
                      item.infracoesQualidade.toFixed(1)
                    )}
                  </td>

                  {/* Pontos Totais */}
                  <td className="p-2.5 text-center font-mono font-bold text-[#1F4E79] bg-blue-50/50">
                    {item.pontos.toFixed(2)}
                  </td>

                  {/* Recorrência % */}
                  <td className="p-2.5 text-center font-bold">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.recPercent ?? 0}
                        onChange={(e) => setEditForm((f) => ({ ...f, recPercent: parseFloat(e.target.value) || 0 }))}
                        className="border rounded px-1 py-0.5 text-xs w-16 text-center font-mono"
                      />
                    ) : (
                      `${item.recPercent.toFixed(1)}%`
                    )}
                  </td>

                  {/* Meta */}
                  <td className="p-2.5 text-center font-mono font-bold">
                    {isEditing ? (
                      <input
                        type="number"
                        step="1"
                        value={editForm.meta ?? metaPadrao}
                        onChange={(e) => setEditForm((f) => ({ ...f, meta: parseFloat(e.target.value) || metaPadrao }))}
                        className="border rounded px-1 py-0.5 text-xs w-16 text-center font-mono font-bold"
                      />
                    ) : (
                      item.meta || metaPadrao
                    )}
                  </td>

                  {/* Ações */}
                  <td className="p-2.5 text-center">
                    {isEditing ? (
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        title="Salvar Alterações"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

