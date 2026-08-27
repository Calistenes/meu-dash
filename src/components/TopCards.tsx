import React from 'react';
import { Users, CheckCircle2, Target, TrendingDown, Clock } from 'lucide-react';
import { CalculoResultado } from '../types';

interface TopCardsProps {
  resultados: CalculoResultado[];
  diasUteisRestantes: number;
}

export const TopCards: React.FC<TopCardsProps> = ({ resultados, diasUteisRestantes }) => {
  const totalElegiveis = resultados.length;
  const acimaMeta = resultados.filter((r) => r.percentualAtingimento >= 100).length;
  const totalPontosProduzidos = resultados.reduce((acc, curr) => acc + curr.colaborador.pontos, 0);

  const somaRecorrencia = resultados.reduce((acc, curr) => acc + curr.colaborador.recPercent, 0);
  const mediaRecorrencia = totalElegiveis > 0 ? somaRecorrencia / totalElegiveis : 0;

  // Calculo medio de pontos necessarios por dia dos que ainda nao bateram a meta
  const pendentes = resultados.filter((r) => r.pontosFaltantes > 0);
  const mediaPontosDiariosPendentes =
    pendentes.length > 0 && diasUteisRestantes > 0
      ? pendentes.reduce((acc, curr) => acc + curr.pontosDiariosNecessarios, 0) / pendentes.length
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shrink-0">
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Colaboradores Elegíveis</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalElegiveis}</p>
        </div>
        <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
          <Users className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meta Batida (≥100%)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-0.5">{acimaMeta}</p>
        </div>
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pontos Totais Produzidos</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">
            {totalPontosProduzidos.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pts
          </p>
        </div>
        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
          <Target className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média Recorrência (%)</p>
          <p
            className={`text-2xl font-bold mt-0.5 ${
              mediaRecorrencia <= 10 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {mediaRecorrencia.toFixed(1)}%
          </p>
        </div>
        <div className={`p-2.5 rounded-lg ${mediaRecorrencia <= 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          <TrendingDown className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média Meta Diária</p>
          <p className="text-2xl font-bold text-[#1F4E79] mt-0.5">
            {mediaPontosDiariosPendentes > 0 ? `${mediaPontosDiariosPendentes.toFixed(2)} pts` : 'Meta Batida!'}
          </p>
        </div>
        <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
