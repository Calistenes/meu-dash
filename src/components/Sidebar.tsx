import React from 'react';
import { Scale, Send, Calendar, Copy, Check, Target, Lightbulb, RefreshCw } from 'lucide-react';
import { ConfiguracoesCiclo, CalculoResultado } from '../types';

interface SidebarProps {
  config: ConfiguracoesCiclo;
  setConfig: React.Dispatch<React.SetStateAction<ConfiguracoesCiclo>>;
  resultados: CalculoResultado[];
  onCalcularRanking: () => void;
  onGerarLinksWhats: () => void;
  onCopiarScript: () => void;
  scriptCopiado: boolean;
  onResetarDados: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  setConfig,
  resultados,
  onCalcularRanking,
  onGerarLinksWhats,
  onCopiarScript,
  scriptCopiado,
  onResetarDados,
}) => {
  // Total de pontos e colaboradores restantes
  const totalElegiveis = resultados.length;
  const colaboradoresAbaixoMeta = resultados.filter((r) => r.pontosFaltantes > 0);
  const totalPontosFaltantes = colaboradoresAbaixoMeta.reduce((acc, curr) => acc + curr.pontosFaltantes, 0);

  const mediaNecessariaPessoasFaltantes =
    colaboradoresAbaixoMeta.length > 0 && config.diasUteisRestantes > 0
      ? totalPontosFaltantes / (colaboradoresAbaixoMeta.length * config.diasUteisRestantes)
      : 0;

  const totalPontosAtuais = resultados.reduce((acc, curr) => acc + curr.colaborador.pontos, 0);
  const totalPontosMeta = resultados.reduce((acc, curr) => acc + (curr.colaborador.meta || config.metaPadrao), 0);
  const percentualGeral = totalPontosMeta > 0 ? (totalPontosAtuais / totalPontosMeta) * 100 : 0;

  return (
    <aside className="w-full lg:w-72 flex flex-col gap-4 shrink-0">
      {/* Box de Ações do Script */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
          <span>Ações do Script</span>
          <button
            onClick={onResetarDados}
            title="Restaurar dados de exemplo"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </h3>
        <div className="space-y-2">
          <button
            onClick={onCalcularRanking}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-colors border border-blue-100 text-xs sm:text-sm"
          >
            <Scale className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Calcular Ranking</span>
          </button>

          <button
            onClick={onGerarLinksWhats}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-100 transition-colors border border-emerald-100 text-xs sm:text-sm"
          >
            <Send className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Gerar Links WhatsApp</span>
          </button>

          <button
            onClick={onCopiarScript}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors border border-slate-200 text-xs sm:text-sm"
          >
            {scriptCopiado ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span>{scriptCopiado ? 'Script Copiado!' : 'Copiar Script GAS'}</span>
          </button>
        </div>
      </div>

      {/* Box Meta do Ciclo & Ajuste de Dias Úteis */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#1F4E79]" />
            <span>Meta do Ciclo</span>
          </h3>

          <div className="text-center py-4 border-b border-slate-100 mb-4 bg-slate-50/70 rounded-lg">
            <div className="flex items-center justify-center gap-1.5 text-3xl sm:text-4xl font-bold text-[#1F4E79]">
              <input
                type="number"
                value={config.metaPadrao}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    metaPadrao: Math.max(1, Number(e.target.value) || 176),
                  }))
                }
                className="w-24 text-center font-bold bg-transparent border-b-2 border-blue-300 focus:border-[#1F4E79] focus:outline-none"
              />
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Pontos Objetivo por Colaborador
            </p>
          </div>

          {/* Ajuste de Dias Úteis */}
          <div className="mb-4 bg-blue-50/60 p-3 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Dias Úteis Restantes:
              </label>
              <span className="text-sm font-bold text-[#1F4E79] bg-white px-2 py-0.5 rounded border border-blue-200">
                {config.diasUteisRestantes} dias
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={config.diasUteisRestantes}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  diasUteisRestantes: parseInt(e.target.value, 10) || 1,
                }))
              }
              className="w-full accent-[#1F4E79] cursor-pointer mt-1"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
              <span>1 dia</span>
              <span>12 dias (padrão)</span>
              <span>25 dias</span>
            </div>
          </div>

          {/* Progresso do Time */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-600 uppercase text-[10px]">ATINGIMENTO GLOBAL DO TIME</span>
                <span className="text-[#1F4E79]">{percentualGeral.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1F4E79] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, percentualGeral)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Insight de Gestão Box */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80">
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              Insight de Gestão Diária
            </p>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            Restam <strong className="font-bold">{config.diasUteisRestantes} dias úteis</strong>.
            {colaboradoresAbaixoMeta.length > 0 ? (
              <>
                {' '}
                Média necessária para 100% da meta dos {colaboradoresAbaixoMeta.length} colaboradores pendentes:{' '}
                <strong className="underline decoration-amber-400">
                  {mediaNecessariaPessoasFaltantes.toFixed(2)} pts/dia
                </strong>
                .
              </>
            ) : (
              ' Todos os colaboradores atingiram os 176 pontos!'
            )}
          </p>
        </div>
      </div>
    </aside>
  );
};
