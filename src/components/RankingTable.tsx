import React, { useState } from 'react';
import { Search, Download, Upload, Send, Eye, Trophy, Award, AlertTriangle, CheckCircle } from 'lucide-react';
import { CalculoResultado, Colaborador } from '../types';

interface RankingTableProps {
  resultados: CalculoResultado[];
  diasUteisRestantes: number;
  onSelecionarColaborador: (colaborador: Colaborador) => void;
  onAbrirWhatsApp: (item: CalculoResultado) => void;
  onExportarCSV: () => void;
  onAbrirImportarCSV?: () => void;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  resultados,
  diasUteisRestantes,
  onSelecionarColaborador,
  onAbrirWhatsApp,
  onExportarCSV,
  onAbrirImportarCSV,
}) => {
  const [busca, setBusca] = useState('');
  const [supervisorFiltro, setSupervisorFiltro] = useState('TODOS');
  const [quartilFiltro, setQuartilFiltro] = useState('TODOS');

  // Obter supervisores únicos
  const supervisores = Array.from(new Set(resultados.map((r) => r.colaborador.supervisor).filter(Boolean)));

  // Filtragem
  const resultadosFiltrados = resultados.filter((item) => {
    const c = item.colaborador;
    const matchBusca =
      c.funcionario.toLowerCase().includes(busca.toLowerCase()) ||
      c.cidade.toLowerCase().includes(busca.toLowerCase()) ||
      c.supervisor.toLowerCase().includes(busca.toLowerCase());

    const matchSupervisor = supervisorFiltro === 'TODOS' || c.supervisor === supervisorFiltro;
    const matchQuartil = quartilFiltro === 'TODOS' || c.quartil === quartilFiltro;

    return matchBusca && matchSupervisor && matchQuartil;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
      {/* Header com Filtros e Exportação */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap gap-3 justify-between items-center">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#1F4E79]" />
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">
            Ranking Oficial de Desempenho — Ciclo Vigente
          </h2>
          <span className="text-xs bg-blue-100 text-[#1F4E79] px-2 py-0.5 rounded-full font-bold">
            {resultadosFiltrados.length} Colaboradores
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Busca */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1F4E79]"
            />
          </div>

          {/* Filtro Supervisor */}
          <select
            value={supervisorFiltro}
            onChange={(e) => setSupervisorFiltro(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="TODOS">Todos Supervisors</option>
            {supervisores.map((sup) => (
              <option key={sup} value={sup}>
                {sup}
              </option>
            ))}
          </select>

          {/* Filtro Quartil */}
          <select
            value={quartilFiltro}
            onChange={(e) => setQuartilFiltro(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="TODOS">Todos Quartis</option>
            <option value="1º QUARTIL">1º Quartil</option>
            <option value="2º QUARTIL">2º Quartil</option>
            <option value="3º QUARTIL">3º Quartil</option>
            <option value="4º QUARTIL">4º Quartil</option>
          </select>

          {/* Botão Importar CSV */}
          {onAbrirImportarCSV && (
            <button
              onClick={onAbrirImportarCSV}
              className="flex items-center gap-1.5 text-xs bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-800 transition-colors shadow-xs"
              title="Carregar planilha CSV para alimentar o Dashboard"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar CSV
            </button>
          )}

          {/* Botão Exportar CSV */}
          <button
            onClick={onExportarCSV}
            className="flex items-center gap-1.5 text-xs bg-[#1F4E79] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-900 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabela de Posições */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-100/80 text-slate-600 sticky top-0 border-b border-slate-200 z-10 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="p-3 text-center w-12">Pos.</th>
              <th className="p-3">Funcionário / Cidade</th>
              <th className="p-3">Supervisor</th>
              <th className="p-3 text-center">Pontos</th>
              <th className="p-3 text-center">% Atingimento</th>
              <th className="p-3 text-center">Recorrência</th>
              <th className="p-3 text-center bg-blue-50/70 text-[#1F4E79]">
                Meta Diária ({diasUteisRestantes}d úteis)
              </th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {resultadosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                  Nenhum colaborador encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              resultadosFiltrados.map((item, index) => {
                const c = item.colaborador;
                const posicaoOriginal = resultados.findIndex((r) => r.colaborador.id === c.id) + 1;
                const isTop3 = posicaoOriginal <= 3;

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isTop3 ? 'bg-[#FFF2CC]/40 border-l-4 border-l-amber-400' : ''
                    }`}
                  >
                    {/* Pos. */}
                    <td className="p-3 text-center font-bold">
                      {posicaoOriginal === 1 && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-extrabold text-xs">
                          🥇 1º
                        </span>
                      )}
                      {posicaoOriginal === 2 && (
                        <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-extrabold text-xs">
                          🥈 2º
                        </span>
                      )}
                      {posicaoOriginal === 3 && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-extrabold text-xs">
                          🥉 3º
                        </span>
                      )}
                      {posicaoOriginal > 3 && (
                        <span className="text-slate-500 font-mono text-xs">{posicaoOriginal}º</span>
                      )}
                    </td>

                    {/* Funcionário */}
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{c.funcionario}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-medium">
                          {c.cidade} • {c.quartil || 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Supervisor */}
                    <td className="p-3 text-slate-700 font-medium text-xs">{c.supervisor || '-'}</td>

                    {/* Pontos */}
                    <td className="p-3 text-center font-mono font-bold text-slate-800">{c.pontos.toFixed(2)}</td>

                    {/* % Atingimento */}
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.percentualAtingimento >= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.percentualAtingimento >= 80
                            ? 'bg-blue-100 text-blue-800'
                            : item.percentualAtingimento >= 60
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.percentualAtingimento.toFixed(1)}%
                      </span>
                    </td>

                    {/* Recorrência */}
                    <td className="p-3 text-center font-bold">
                      <span
                        className={c.recPercent <= 10 ? 'text-emerald-600' : 'text-rose-600 flex items-center justify-center gap-1'}
                      >
                        {c.recPercent.toFixed(1)}%
                        {c.recPercent > 10 && <AlertTriangle className="w-3 h-3 text-rose-500 inline" />}
                      </span>
                    </td>

                    {/* Meta Diária (Dias Úteis) */}
                    <td className="p-3 text-center font-bold bg-blue-50/30">
                      {item.pontosFaltantes <= 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Meta batida
                        </span>
                      ) : (
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded ${
                            item.pontosDiariosNecessarios <= 2.5
                              ? 'text-blue-700 font-bold bg-blue-50'
                              : item.pontosDiariosNecessarios <= 5.0
                              ? 'text-amber-700 font-bold bg-amber-50'
                              : 'text-rose-700 font-bold bg-rose-50'
                          }`}
                        >
                          {item.pontosDiariosNecessarios.toFixed(2)} pts/dia
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onAbrirWhatsApp(item)}
                          title="Enviar WhatsApp"
                          className="p-1.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelecionarColaborador(c)}
                          title="Ver Detalhes do Colaborador"
                          className="p-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors border border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer da Tabela com Resumo da Regra */}
      <div className="p-3 bg-slate-100 border-t border-slate-200 flex flex-wrap justify-between items-center text-[11px] text-slate-600 font-medium gap-2">
        <div className="flex flex-wrap gap-4">
          <span>
            • Regra: <strong>% Atingimento = Pontos ÷ Meta</strong>
          </span>
          <span>
            • Recorrência Meta: <strong>≤ 10.0%</strong>
          </span>
        </div>
        <div>
          <span>Dias Úteis Considerados: <strong>{diasUteisRestantes} dias</strong></span>
        </div>
      </div>
    </div>
  );
};
