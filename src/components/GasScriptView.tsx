import React, { useState } from 'react';
import { Code, Copy, Check, ExternalLink, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/gasScript';

export const GasScriptView: React.FC = () => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col overflow-hidden gap-4">
      {/* Top Banner de Instruções */}
      <div className="bg-[#1F4E79] text-white p-4 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-300" />
            Script Google Apps Script (GAS) Atualizado
          </h2>
          <p className="text-xs text-blue-200 mt-0.5">
            Com as novas regras: Cálculo de Meta Diária em Dias Úteis (176 pts) + Feedbacks Orientativo e Incentivo
          </p>
        </div>

        <button
          onClick={handleCopiar}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 py-2 rounded-lg font-bold text-xs shadow-md transition-colors shrink-0"
        >
          {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copiado ? 'Código Copiado!' : 'Copiar Script Completo'}</span>
        </button>
      </div>

      {/* Passo a Passo de Instalação no Google Sheets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5">
          <div className="w-6 h-6 bg-[#1F4E79] text-white font-bold rounded-full flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <p className="font-bold text-slate-800">Abra a Planilha</p>
            <p className="text-slate-500 text-[11px] mt-0.5">No Google Sheets, abra sua planilha "Base Raio-X".</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5">
          <div className="w-6 h-6 bg-[#1F4E79] text-white font-bold rounded-full flex items-center justify-center shrink-0">
            2
          </div>
          <div>
            <p className="font-bold text-slate-800">Acesse o Apps Script</p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Vá em <strong>Extensões &gt; Apps Script</strong> no menu superior.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5">
          <div className="w-6 h-6 bg-[#1F4E79] text-white font-bold rounded-full flex items-center justify-center shrink-0">
            3
          </div>
          <div>
            <p className="font-bold text-slate-800">Cole o Código</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Substitua todo o conteúdo do editor pelo código abaixo e salve (Ctrl+S).</p>
          </div>
        </div>

        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-2.5">
          <div className="w-6 h-6 bg-emerald-600 text-white font-bold rounded-full flex items-center justify-center shrink-0">
            4
          </div>
          <div>
            <p className="font-bold text-emerald-900">Execute pelo Menu</p>
            <p className="text-emerald-800 text-[11px] mt-0.5">Recarregue a planilha e use o menu <strong>"⚖️ Gestão Raio-X"</strong>.</p>
          </div>
        </div>
      </div>

      {/* Editor do Código Visual */}
      <div className="flex-1 flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <div className="bg-slate-800/90 px-4 py-2 flex justify-between items-center text-slate-300 text-xs border-b border-slate-700">
          <span className="font-mono flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            Codigo.gs (Google Apps Script)
          </span>
          <span className="text-[10px] text-slate-400">JavaScript / Google Apps Script API</span>
        </div>

        <textarea
          readOnly
          value={GOOGLE_APPS_SCRIPT_CODE}
          className="w-full flex-1 bg-slate-950 p-4 text-emerald-400 font-mono text-xs leading-relaxed resize-none focus:outline-none"
          rows={16}
        />
      </div>
    </div>
  );
};
