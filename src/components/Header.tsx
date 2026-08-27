import React from 'react';
import { Award, Calendar, MessageSquare, Database, Code, Upload, FileSpreadsheet, Phone, UserX } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dataAtualizacao: string;
  onAbrirImportarCSV?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  dataAtualizacao,
  onAbrirImportarCSV,
}) => {
  return (
    <header className="bg-[#1F4E79] text-white px-6 py-4 flex flex-wrap justify-between items-center shrink-0 shadow-md gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center font-bold text-white shadow-inner">
          IAT
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            Gestão Raio-X <span className="text-blue-200 font-normal text-sm md:text-base">| Visão Líder</span>
          </h1>
          <p className="text-[11px] text-blue-200">Produtividade IAT • Meta 176 Pts • Calculadora Dias Úteis</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
        <nav className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'ranking'
                ? 'bg-white text-[#1F4E79] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Ranking Oficial
          </button>

          <button
            onClick={() => setActiveTab('diario')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'diario'
                ? 'bg-white text-[#1F4E79] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Meta Diária (Dias Úteis)
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'feedback'
                ? 'bg-white text-[#1F4E79] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Feedbacks & WhatsApp
          </button>

          <button
            onClick={() => setActiveTab('telefones')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'telefones'
                ? 'bg-white text-[#1F4E79] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            Telefones (CSV)
          </button>

          <button
            onClick={() => setActiveTab('inativos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'inativos'
                ? 'bg-white text-[#1F4E79] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            Inativos (CSV)
          </button>

          <button
            onClick={() => setActiveTab('base')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'base'
                ? 'bg-white text-[#1F4E79] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Base Raio-X
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'script'
                ? 'bg-white text-[#1F4E79] shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Script Google (GAS)
          </button>
        </nav>

        {onAbrirImportarCSV && (
          <button
            onClick={onAbrirImportarCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm"
            title="Importar planilha CSV/XLSX para alimentar todo o Dashboard"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar CSV
          </button>
        )}

        <div className="h-6 w-[1px] bg-white/20 hidden md:block"></div>

        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span>Atualizado: {dataAtualizacao}</span>
        </div>
      </div>
    </header>
  );
};
