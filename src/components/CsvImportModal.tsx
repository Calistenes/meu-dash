import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, AlertCircle, Check, X } from 'lucide-react';
import { parseCSVToColaboradores } from '../utils/csvParser';
import { Colaborador } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (items: Colaborador[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [pastedCSV, setPastedCSV] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    parseCSVToColaboradores(
      file,
      (items) => {
        setIsLoading(false);
        onImportSuccess(items);
        onClose();
      },
      (err) => {
        setIsLoading(false);
        setErrorMessage(err);
      }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessText = () => {
    if (!pastedCSV.trim()) {
      setErrorMessage('Por favor, cole o texto da planilha ou selecione um arquivo.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    parseCSVToColaboradores(
      pastedCSV,
      (items) => {
        setIsLoading(false);
        onImportSuccess(items);
        onClose();
      },
      (err) => {
        setIsLoading(false);
        setErrorMessage(err);
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex justify-between items-center border-b pb-3 border-slate-100 pr-8">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Importar CSV para o Dashboard</h3>
              <p className="text-xs text-slate-500">Alimente o ranking e indicadores com sua planilha oficial</p>
            </div>
          </div>
        </div>

        {/* Input Oculto */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv, .tsv, .txt"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Drag and Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
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
              Arraste e solte seu arquivo CSV/XLSX aqui, ou <span className="text-[#1F4E79] underline">clique para selecionar</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Processado automaticamente via PapaParse (aceita arquivo exportado do Excel ou Google Sheets)
            </p>
          </div>
        </div>

        <div className="relative flex items-center my-0.5">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="shrink mx-3 text-[10px] text-slate-400 font-bold uppercase">ou cole o texto da planilha</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Caixas de Texto para colar CSV */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Copiar e Colar Linhas
          </label>
          <textarea
            value={pastedCSV}
            onChange={(e) => setPastedCSV(e.target.value)}
            placeholder="RANKING;FUNCIONARIO;SUPERVISOR;QUARTIL;RECORRENCIA;PERCENTUAL_ATINGIMENTO;PONTOS;META&#10;1º Place;RICARDO OLIVEIRA - 4921;MARCOS SILVA;1º QUARTIL;4.2%;104.7%;184.20;176"
            rows={5}
            className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79] bg-slate-50 focus:bg-white transition-colors"
          />
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#1F4E79] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#1F4E79] leading-tight">
            Ao importar, todos os gráficos, cards do topo, ranking e metas de WhatsApp serão atualizados com os dados da sua planilha!
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Cancelar
          </button>

          <button
            onClick={handleProcessText}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-white bg-[#1F4E79] hover:bg-blue-900 rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {isLoading ? 'Processando...' : 'Processar e Alimentar Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
};
