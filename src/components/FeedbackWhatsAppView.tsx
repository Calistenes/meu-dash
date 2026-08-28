import React, { useState } from 'react';
import { Send, Copy, Check, MessageSquare, Phone, User, Sparkles, RefreshCw } from 'lucide-react';
import { CalculoResultado, Colaborador } from '../types';
import { FRASES_MOTIVACIONAIS } from '../utils/calculations';

interface FeedbackWhatsAppViewProps {
  resultados: CalculoResultado[];
  telefonesMapa: Record<string, string>;
  setTelefonesMapa: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onAbrirWhatsApp: (item: CalculoResultado) => void;
  onNavegarParaTelefones?: () => void;
}

export const FeedbackWhatsAppView: React.FC<FeedbackWhatsAppViewProps> = ({
  resultados,
  telefonesMapa,
  setTelefonesMapa,
  onAbrirWhatsApp,
  onNavegarParaTelefones,
}) => {
  const [colaboradorSelecionadoId, setColaboradorSelecionadoId] = useState<string>(
    resultados.length > 0 ? resultados[0].colaborador.id : ''
  );
  const [copiadoId, setCopiadoId] = useState<boolean>(false);

  const itemAtual = resultados.find((r) => r.colaborador.id === colaboradorSelecionadoId) || resultados[0];

  if (!itemAtual) {
    return <div className="p-8 text-center text-slate-500">Nenhum colaborador elegível disponível.</div>;
  }

  const c = itemAtual.colaborador;
  const metaTarget = c.meta > 0 ? c.meta : 176;
  const nomeChave = c.funcionario.split('-')[0].trim().toUpperCase();
  const telefoneAtual = telefonesMapa[nomeChave] || '';

  const handleTelefoneChange = (novoTel: string) => {
    setTelefonesMapa((prev) => ({
      ...prev,
      [nomeChave]: novoTel.replace(/\D/g, ''),
    }));
  };

  const handleCopiarMensagem = () => {
    navigator.clipboard.writeText(itemAtual.whatsappMessage);
    setCopiadoId(true);
    setTimeout(() => setCopiadoId(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
      {/* Coluna Esquerda: Lista de Seleção de Colaboradores */}
      <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#1F4E79]" />
            <span>Selecione o Colaborador</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gerador de feedback orientativo e incentivo
          </p>
        </div>

        <div className="overflow-auto flex-1 divide-y divide-slate-100">
          {resultados.map((item) => {
            const isSelected = item.colaborador.id === itemAtual.colaborador.id;
            return (
              <button
                key={item.colaborador.id}
                onClick={() => setColaboradorSelecionadoId(item.colaborador.id)}
                className={`w-full text-left p-3 transition-colors flex items-center justify-between ${
                  isSelected ? 'bg-blue-50/80 border-l-4 border-l-[#1F4E79]' : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <p className={`text-xs font-bold ${isSelected ? 'text-[#1F4E79]' : 'text-slate-800'}`}>
                    {item.colaborador.funcionario}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {item.colaborador.supervisor} • {item.percentualAtingimento.toFixed(1)}% Meta
                  </p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.ritmoStatus === 'BATIDA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {item.ritmoStatus === 'BATIDA' ? 'Meta Batida' : `${item.pontosDiariosNecessarios.toFixed(1)} pts/dia`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Coluna Direita: Editor e Preview da Mensagem */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col overflow-auto gap-4">
        {/* Top Header do Painel */}
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-[#1F4E79]" />
              {c.funcionario}
            </h2>
            <p className="text-xs text-slate-500">
              Cidade: {c.cidade} | Supervisor: {c.supervisor || 'N/A'} | Meta: {metaTarget} pts
            </p>
          </div>

          {/* Campo de Telefone do WhatsApp */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <Phone className="w-4 h-4 text-emerald-600" />
              <input
                type="text"
                placeholder="DDD + Número (ex: 5511999998888)"
                value={telefoneAtual}
                onChange={(e) => handleTelefoneChange(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-mono focus:outline-none focus:border-emerald-500 w-48"
              />
            </div>

            {onNavegarParaTelefones && (
              <button
                onClick={onNavegarParaTelefones}
                className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                title="Ir para a aba de Importação de Telefones por CSV"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Importar CSV Telefones</span>
              </button>
            )}
          </div>
        </div>

        {/* Resumo Rápido dos Indicadores em Destaque */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Pontos Atuais</p>
            <p className="text-base font-bold text-slate-800">{c.pontos.toFixed(2)}</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">% Atingimento</p>
            <p className="text-base font-bold text-blue-700">{itemAtual.percentualAtingimento.toFixed(1)}%</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Falta p/ Meta ({metaTarget})</p>
            <p className="text-base font-bold text-amber-700">{itemAtual.pontosFaltantes.toFixed(2)} pts</p>
          </div>
          <div className="bg-[#1F4E79]/5 p-2.5 rounded-lg border border-blue-200 text-center">
            <p className="text-[10px] font-bold text-[#1F4E79] uppercase">Meta Diária</p>
            <p className="text-base font-bold text-[#1F4E79]">
              {itemAtual.pontosFaltantes <= 0 ? 'Meta Batida' : `${itemAtual.pontosDiariosNecessarios.toFixed(2)} pts/dia`}
            </p>
          </div>
        </div>

        {/* Card Estilizado da Mensagem do WhatsApp */}
        <div className="flex-1 flex flex-col bg-emerald-950/90 rounded-xl p-4 text-emerald-50 border border-emerald-800 shadow-inner font-sans text-xs sm:text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-emerald-800/80 mb-3 text-emerald-300">
            <span className="font-bold flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Previa da Mensagem (WhatsApp)
            </span>
            <span className="text-[11px] text-emerald-400">Pronto para Envio</span>
          </div>

          <textarea
            readOnly
            value={itemAtual.whatsappMessage}
            className="w-full flex-1 bg-emerald-900/60 p-3 rounded-lg border border-emerald-800 text-emerald-100 font-mono text-xs leading-relaxed resize-none focus:outline-none"
            rows={14}
          />

          <div className="flex flex-wrap justify-between items-center gap-3 pt-3 mt-2 border-t border-emerald-800">
            <button
              onClick={handleCopiarMensagem}
              className="flex items-center gap-2 bg-emerald-800/80 text-emerald-100 hover:bg-emerald-800 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
            >
              {copiadoId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiadoId ? 'Mensagem Copiada!' : 'Copiar Texto da Mensagem'}</span>
            </button>

            <button
              onClick={() => onAbrirWhatsApp(itemAtual)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 py-2 rounded-lg font-bold text-xs shadow-md transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Abrir no WhatsApp Web / App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
