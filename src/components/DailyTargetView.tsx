import React from 'react';
import { Calendar, Target, CheckCircle2, AlertTriangle, TrendingUp, Send, Info, Zap } from 'lucide-react';
import { CalculoResultado, ConfiguracoesCiclo } from '../types';

interface DailyTargetViewProps {
  resultados: CalculoResultado[];
  config: ConfiguracoesCiclo;
  setConfig: React.Dispatch<React.SetStateAction<ConfiguracoesCiclo>>;
  onAbrirWhatsApp: (item: CalculoResultado) => void;
}

export const DailyTargetView: React.FC<DailyTargetViewProps> = ({
  resultados,
  config,
  setConfig,
  onAbrirWhatsApp,
}) => {
  const { diasUteisRestantes, metaPadrao } = config;

  // Estatísticas de ritmo
  const batidos = resultados.filter((r) => r.ritmoStatus === 'BATIDA');
  const leve = resultados.filter((r) => r.ritmoStatus === 'FACIL');
  const moderado = resultados.filter((r) => r.ritmoStatus === 'MODERADO');
  const desafiador = resultados.filter((r) => r.ritmoStatus === 'DESAFIADOR');
  const critico = resultados.filter((r) => r.ritmoStatus === 'CRITICO');

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-auto">
      {/* Box Superior de Parâmetros da Calculadora de Dias Úteis */}
      <div className="bg-[#1F4E79] text-white p-5 rounded-xl shadow-md border border-blue-900">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-300" />
              Calculadora de Meta Diária em Dias Úteis (Meta: {metaPadrao} Pts)
            </h2>
            <p className="text-xs text-blue-200 mt-1">
              Simulação do ritmo diário de pontos necessário para cada colaborador atingir os {metaPadrao} pontos no ciclo.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl border border-white/15">
            <label className="text-xs font-bold text-blue-100 flex items-center gap-1.5">
              <span>Dias Úteis Restantes:</span>
            </label>
            <input
              type="number"
              min="1"
              max="25"
              value={diasUteisRestantes}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  diasUteisRestantes: Math.max(1, parseInt(e.target.value, 10) || 1),
                }))
              }
              className="w-16 bg-white text-[#1F4E79] font-bold text-center text-sm py-1 rounded focus:outline-none"
            />
            <span className="text-xs text-blue-200 font-semibold">dias</span>
          </div>
        </div>

        {/* Badges de Distribuição por Categoria de Ritmo */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-white/15 text-xs">
          <div className="bg-emerald-500/20 border border-emerald-400/30 p-2 rounded-lg text-emerald-100 flex items-center justify-between">
            <span>🎉 Meta Batida</span>
            <strong className="text-sm font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
              {batidos.length}
            </strong>
          </div>
          <div className="bg-blue-500/20 border border-blue-400/30 p-2 rounded-lg text-blue-100 flex items-center justify-between">
            <span>🌱 Tranquilo (≤2 pts/dia)</span>
            <strong className="text-sm font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
              {leve.length}
            </strong>
          </div>
          <div className="bg-indigo-500/20 border border-indigo-400/30 p-2 rounded-lg text-indigo-100 flex items-center justify-between">
            <span>⚡ Moderado (≤4 pts/dia)</span>
            <strong className="text-sm font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full">
              {moderado.length}
            </strong>
          </div>
          <div className="bg-amber-500/20 border border-amber-400/30 p-2 rounded-lg text-amber-100 flex items-center justify-between">
            <span>🔥 Acelerar (≤7 pts/dia)</span>
            <strong className="text-sm font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {desafiador.length}
            </strong>
          </div>
          <div className="bg-rose-500/20 border border-rose-400/30 p-2 rounded-lg text-rose-100 flex items-center justify-between col-span-2 sm:col-span-1">
            <span>🚨 Atenção (&gt;7 pts/dia)</span>
            <strong className="text-sm font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
              {critico.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Lista de Colaboradores com Ritmo Diário e Feedback Orientativo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resultados.map((item) => {
          const c = item.colaborador;
          const metaTarget = c.meta > 0 ? c.meta : metaPadrao;
          const percentual = Math.min(100, (c.pontos / metaTarget) * 100);

          return (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header do Card */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{c.funcionario}</h3>
                    <p className="text-xs text-slate-500 uppercase font-medium">
                      {c.cidade} • Supervisor: {c.supervisor || 'N/A'}
                    </p>
                  </div>

                  {/* Badge Status de Ritmo */}
                  <div>
                    {item.ritmoStatus === 'BATIDA' && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Meta Batida!
                      </span>
                    )}
                    {item.ritmoStatus === 'FACIL' && (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        <Zap className="w-3.5 h-3.5 text-blue-600" /> {item.pontosDiariosNecessarios.toFixed(2)} pts/dia
                      </span>
                    )}
                    {item.ritmoStatus === 'MODERADO' && (
                      <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> {item.pontosDiariosNecessarios.toFixed(2)} pts/dia
                      </span>
                    )}
                    {item.ritmoStatus === 'DESAFIADOR' && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> {item.pontosDiariosNecessarios.toFixed(2)} pts/dia
                      </span>
                    )}
                    {item.ritmoStatus === 'CRITICO' && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> {item.pontosDiariosNecessarios.toFixed(2)} pts/dia
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">
                      Pontos Atuais: <span className="font-mono text-slate-900">{c.pontos.toFixed(2)}</span> / {metaTarget} pts
                    </span>
                    <span className="text-[#1F4E79] font-bold">{item.percentualAtingimento.toFixed(1)}%</span>
                  </div>

                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentual >= 100
                          ? 'bg-emerald-500'
                          : percentual >= 80
                          ? 'bg-blue-600'
                          : percentual >= 60
                          ? 'bg-indigo-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${percentual}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                    <span>
                      Faltam: <strong className="text-slate-800">{item.pontosFaltantes.toFixed(2)} pts</strong>
                    </span>
                    <span>
                      Dias Úteis: <strong className="text-slate-800">{diasUteisRestantes} dias</strong>
                    </span>
                  </div>
                </div>

                {/* Feedback Orientativo Preview */}
                <div className="space-y-2 mb-4 text-xs">
                  <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-100">
                    <p className="font-bold text-[#1F4E79] mb-0.5 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Feedback Orientativo:
                    </p>
                    <p className="text-slate-700 leading-relaxed">{item.feedbackOrientativo}</p>
                  </div>

                  <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-100">
                    <p className="font-bold text-emerald-800 mb-0.5 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" /> Feedback de Incentivo:
                    </p>
                    <p className="text-emerald-950 leading-relaxed italic">{item.feedbackIncentivo}</p>
                  </div>
                </div>
              </div>

              {/* Botão de Disparo WhatsApp */}
              <button
                onClick={() => onAbrirWhatsApp(item)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-lg font-bold text-xs hover:bg-emerald-600 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Feedback via WhatsApp</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
