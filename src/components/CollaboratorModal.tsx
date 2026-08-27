import React from 'react';
import { X, User, MapPin, Award, ShieldAlert, CheckCircle2, TrendingUp, Send, Calendar, Info, Zap } from 'lucide-react';
import { CalculoResultado, Colaborador } from '../types';

interface CollaboratorModalProps {
  colaborador: Colaborador | null;
  resultado: CalculoResultado | null;
  diasUteisRestantes: number;
  onClose: () => void;
  onAbrirWhatsApp: (item: CalculoResultado) => void;
}

export const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  colaborador,
  resultado,
  diasUteisRestantes,
  onClose,
  onAbrirWhatsApp,
}) => {
  if (!colaborador || !resultado) return null;

  const c = colaborador;
  const metaTarget = c.meta > 0 ? c.meta : 176;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header do Modal */}
        <div className="bg-[#1F4E79] text-white p-5 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                {c.quartil || 'N/A'}
              </span>
              <span className="bg-emerald-400 text-slate-950 px-2 py-0.5 rounded text-xs font-extrabold">
                {resultado.percentualAtingimento.toFixed(1)}% Meta
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1">{c.funcionario}</h2>
            <p className="text-xs text-blue-200 mt-0.5 flex items-center gap-2">
              <span>📍 {c.cidade}</span>
              <span>•</span>
              <span>👥 Supervisor: {c.supervisor || 'N/A'}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 space-y-5 flex-1 overflow-auto">
          {/* Card Meta Diária em Dias Úteis */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex flex-wrap justify-between items-center gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F4E79]">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Calculadora de Dias Úteis (Meta {metaTarget} pts)</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Faltam <strong className="font-bold text-slate-900">{resultado.pontosFaltantes.toFixed(2)} pts</strong> para os {metaTarget} pontos.
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Necessidade Diária ({diasUteisRestantes}d)</p>
              <p className="text-2xl font-extrabold text-[#1F4E79]">
                {resultado.pontosFaltantes <= 0 ? (
                  <span className="text-emerald-600 text-lg">🎉 Meta Batida</span>
                ) : (
                  `${resultado.pontosDiariosNecessarios.toFixed(2)} pts/dia`
                )}
              </p>
            </div>
          </div>

          {/* Grid de Pontuação Detalhada */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              ⚙️ Detalhamento de Pontos IAT
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[10px] block">PT Instalação</span>
                <strong className="text-sm font-bold text-slate-800">{c.ptInst.toFixed(2)}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[10px] block">PT Reparo</span>
                <strong className="text-sm font-bold text-slate-800">{c.ptRep.toFixed(2)}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[10px] block">PT Regularização</span>
                <strong className="text-sm font-bold text-slate-800">{c.ptReg.toFixed(2)}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[10px] block">PT Recorrência</span>
                <strong className="text-sm font-bold text-slate-800">{c.ptRec.toFixed(2)}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[10px] block">PT Prod. Extra</span>
                <strong className="text-sm font-bold text-slate-800">{c.ptProdExtra.toFixed(2)}</strong>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200">
                <span className="text-rose-600 text-[10px] block font-bold">Infrações Qualidade</span>
                <strong className="text-sm font-bold text-rose-700">-{c.infracoesQualidade.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Qualidade & Desempenho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-1">📉 Qualidade & Recorrência</h4>
              <p className="text-slate-600">
                Taxa de Recorrência:{' '}
                <strong className={c.recPercent <= 10 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {c.recPercent.toFixed(1)}%
                </strong>{' '}
                (Meta: ≤ 10%)
              </p>
              <p className="text-slate-600 mt-1">Clientes Atendidos: <strong>{c.clientesTotais}</strong></p>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-bold text-[#1F4E79] mb-1">📊 Desempenho Geral</h4>
              <p className="text-slate-700">
                Total de Pontos: <strong>{c.pontos.toFixed(2)} pts</strong>
              </p>
              <p className="text-slate-700">
                Atingimento: <strong>{resultado.percentualAtingimento.toFixed(1)}%</strong>
              </p>
              <p className="text-xs font-bold text-[#1F4E79] mt-1">
                Status: {resultado.ritmoStatus === 'BATIDA' ? '🎉 Meta Batida' : `Faltam ${resultado.pontosFaltantes.toFixed(2)} pts`}
              </p>
            </div>
          </div>

          {/* Feedbacks */}
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="font-bold text-[#1F4E79] mb-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Feedback Orientativo:
              </p>
              <p className="text-slate-700 leading-relaxed">{resultado.feedbackOrientativo}</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-600" /> Feedback de Incentivo:
              </p>
              <p className="text-emerald-950 leading-relaxed italic">{resultado.feedbackIncentivo}</p>
            </div>
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Fechar
          </button>

          <button
            onClick={() => {
              onClose();
              onAbrirWhatsApp(resultado);
            }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-md transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Mensagem WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
