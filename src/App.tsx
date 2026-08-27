import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TopCards } from './components/TopCards';
import { RankingTable } from './components/RankingTable';
import { DailyTargetView } from './components/DailyTargetView';
import { FeedbackWhatsAppView } from './components/FeedbackWhatsAppView';
import { BaseDataView } from './components/BaseDataView';
import { PhoneImportView } from './components/PhoneImportView';
import { InativosView } from './components/InativosView';
import { GasScriptView } from './components/GasScriptView';
import { CollaboratorModal } from './components/CollaboratorModal';
import { CsvImportModal } from './components/CsvImportModal';

import { DADOS_INICIAIS_COLABORADORES, CONTATOS_EXEMPLO, DADOS_INICIAIS_INATIVOS } from './data/initialData';
import { Colaborador, ItemInativo, ConfiguracoesCiclo, CalculoResultado } from './types';
import { calcularAtingimentoEBonus } from './utils/calculations';
import { GOOGLE_APPS_SCRIPT_CODE } from './utils/gasScript';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('ranking');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(DADOS_INICIAIS_COLABORADORES);
  const [inativos, setInativos] = useState<ItemInativo[]>(DADOS_INICIAIS_INATIVOS);
  const [telefonesMapa, setTelefonesMapa] = useState<Record<string, string>>(CONTATOS_EXEMPLO);

  const [config, setConfig] = useState<ConfiguracoesCiclo>({
    diasUteisRestantes: 12,
    metaPadrao: 176,
    mesAno: 'Maio de 2024',
  });

  const [colaboradorModal, setColaboradorModal] = useState<Colaborador | null>(null);
  const [showCsvImportModal, setShowCsvImportModal] = useState<boolean>(false);
  const [scriptCopiado, setScriptCopiado] = useState<boolean>(false);
  const [notificacao, setNotificacao] = useState<string | null>(null);

  // Calcular resultados do ciclo em tempo real
  const resultados: CalculoResultado[] = useMemo(() => {
    return calcularAtingimentoEBonus(colaboradores, config, telefonesMapa);
  }, [colaboradores, config, telefonesMapa]);

  const mostrarNotificacao = (msg: string) => {
    setNotificacao(msg);
    setTimeout(() => setNotificacao(null), 3000);
  };

  // Ações do Script
  const handleCalcularRanking = () => {
    setActiveTab('ranking');
    mostrarNotificacao(`✅ Ranking Recalculado! ${resultados.length} colaboradores considerados.`);
  };

  const handleGerarLinksWhats = () => {
    setActiveTab('feedback');
    mostrarNotificacao(`📲 Feedbacks e Links do WhatsApp gerados para ${resultados.length} colaboradores!`);
  };

  const handleCopiarScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setScriptCopiado(true);
    mostrarNotificacao('📋 Script Google Apps Script copiado para a área de transferência!');
    setTimeout(() => setScriptCopiado(false), 3000);
  };

  const handleResetarDados = () => {
    if (confirm('Restaurar os dados de exemplo da Base Raio-X?')) {
      setColaboradores(DADOS_INICIAIS_COLABORADORES);
      setInativos(DADOS_INICIAIS_INATIVOS);
      setTelefonesMapa(CONTATOS_EXEMPLO);
      mostrarNotificacao('🔄 Dados restaurados para a amostra padrão.');
    }
  };

  const handleAdicionarColaborador = () => {
    const novoId = Date.now().toString();
    const novo: Colaborador = {
      id: novoId,
      funcionario: `NOVO TÉCNICO ${colaboradores.length + 1} - 0000`,
      cidade: 'SÃO PAULO - SP',
      supervisor: 'MARCOS SILVA',
      gerente: 'PATRICIA LIMA',
      tipo: 'TÉCNICO IAT',
      statusMes: '-',
      quartil: '2º QUARTIL',
      ptInst: 50.0,
      ptRep: 30.0,
      ptReg: 10.0,
      ptRec: 10.0,
      ptProdExtra: 0.0,
      infracoesQualidade: 0.0,
      pontos: 100.0,
      recPercent: 6.0,
      clientesTotais: 80,
      meta: 176,
      falta: 76.0,
    };

    setColaboradores((prev) => [novo, ...prev]);
    setActiveTab('base');
    mostrarNotificacao('➕ Novo colaborador adicionado à Base Raio-X!');
  };

  const handleAbrirWhatsApp = (item: CalculoResultado) => {
    if (item.whatsappLink) {
      window.open(item.whatsappLink, '_blank');
    }
  };

  const handleExportarCSV = () => {
    let csv =
      'RANKING;FUNCIONARIO;SUPERVISOR;QUARTIL;RECORRENCIA;PERCENTUAL_ATINGIMENTO;PONTOS;META;META_DIARIA_DIAS_UTEIS;BONUS_BASE;BONUS_TOP3;TOTAL_PREMIO\n';

    resultados.forEach((r, idx) => {
      const c = r.colaborador;
      const metaDiariaTxt =
        r.pontosFaltantes <= 0 ? 'Meta Batida' : `${r.pontosDiariosNecessarios.toFixed(2)} pts/dia`;

      csv += `${idx + 1}º Place;${c.funcionario};${c.supervisor};${c.quartil};${c.recPercent.toFixed(
        1
      )}%;${r.percentualAtingimento.toFixed(1)}%;${c.pontos.toFixed(2)};${c.meta || 176};${metaDiariaTxt};R$ ${r.premioBase.toFixed(
        2
      )};R$ ${r.bonusTop3.toFixed(2)};R$ ${r.totalPremio.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ranking_RaioX_${config.mesAno.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    mostrarNotificacao('📥 CSV exportado com sucesso!');
  };

  const resultadoModal = useMemo(() => {
    if (!colaboradorModal) return null;
    return resultados.find((r) => r.colaborador.id === colaboradorModal.id) || null;
  }, [colaboradorModal, resultados]);

  return (
    <div className="bg-slate-50 text-slate-900 font-sans h-screen flex flex-col overflow-hidden">
      {/* Toast de Notificação */}
      {notificacao && (
        <div className="fixed top-20 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl z-50 text-xs font-bold flex items-center gap-2 animate-bounce">
          <span>{notificacao}</span>
        </div>
      )}

      {/* Header Principal da Aplicação */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataAtualizacao={new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        onAbrirImportarCSV={() => setShowCsvImportModal(true)}
      />

      {/* Conteúdo Principal Flexbox */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 sm:p-6 gap-4 sm:gap-6">
        {/* Sidebar com Controles Rápidos e Meta do Ciclo */}
        <Sidebar
          config={config}
          setConfig={setConfig}
          resultados={resultados}
          onCalcularRanking={handleCalcularRanking}
          onGerarLinksWhats={handleGerarLinksWhats}
          onCopiarScript={handleCopiarScript}
          scriptCopiado={scriptCopiado}
          onResetarDados={handleResetarDados}
        />

        {/* Área Central de Dados */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Cards Superiores com Indicadores Resumo */}
          <TopCards resultados={resultados} diasUteisRestantes={config.diasUteisRestantes} />

          {/* Renderização Condicional de Abas */}
          {activeTab === 'ranking' && (
            <RankingTable
              resultados={resultados}
              diasUteisRestantes={config.diasUteisRestantes}
              onSelecionarColaborador={(colab) => setColaboradorModal(colab)}
              onAbrirWhatsApp={handleAbrirWhatsApp}
              onExportarCSV={handleExportarCSV}
              onAbrirImportarCSV={() => setShowCsvImportModal(true)}
            />
          )}

          {activeTab === 'diario' && (
            <DailyTargetView
              resultados={resultados}
              config={config}
              setConfig={setConfig}
              onAbrirWhatsApp={handleAbrirWhatsApp}
            />
          )}

          {activeTab === 'feedback' && (
            <FeedbackWhatsAppView
              resultados={resultados}
              telefonesMapa={telefonesMapa}
              setTelefonesMapa={setTelefonesMapa}
              onAbrirWhatsApp={handleAbrirWhatsApp}
              onNavegarParaTelefones={() => setActiveTab('telefones')}
            />
          )}

          {activeTab === 'telefones' && (
            <PhoneImportView
              colaboradores={colaboradores}
              telefonesMapa={telefonesMapa}
              setTelefonesMapa={setTelefonesMapa}
              onNotificar={mostrarNotificacao}
            />
          )}

          {activeTab === 'inativos' && (
            <InativosView
              inativos={inativos}
              setInativos={setInativos}
              colaboradores={colaboradores}
              setColaboradores={setColaboradores}
              telefonesMapa={telefonesMapa}
              setTelefonesMapa={setTelefonesMapa}
              onNotificar={mostrarNotificacao}
            />
          )}

          {activeTab === 'base' && (
            <BaseDataView
              colaboradores={colaboradores}
              setColaboradores={setColaboradores}
              onAdicionarColaborador={handleAdicionarColaborador}
              onResetarDados={handleResetarDados}
            />
          )}

          {activeTab === 'script' && <GasScriptView />}
        </div>
      </main>

      {/* Modal de Detalhes do Colaborador */}
      <CollaboratorModal
        colaborador={colaboradorModal}
        resultado={resultadoModal}
        diasUteisRestantes={config.diasUteisRestantes}
        onClose={() => setColaboradorModal(null)}
        onAbrirWhatsApp={handleAbrirWhatsApp}
      />

      {/* Modal Global de Importação CSV */}
      <CsvImportModal
        isOpen={showCsvImportModal}
        onClose={() => setShowCsvImportModal(false)}
        onImportSuccess={(novosColaboradores) => {
          setColaboradores(novosColaboradores);
          mostrarNotificacao(`📊 Dashboard alimentado com sucesso com ${novosColaboradores.length} colaboradores!`);
        }}
      />

      {/* Rodapé com Status e Regras do Sistema */}
      <footer className="bg-slate-200 px-6 py-2 flex flex-wrap justify-between items-center text-[10px] font-bold text-slate-500 uppercase shrink-0 border-t border-slate-300 gap-2">
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <span>REGRA: % ATINGIMENTO META (PONTOS / META)</span>
          <span>META BASE IAT: 176 PONTOS</span>
          <span>DIAS ÚTEIS: {config.diasUteisRestantes} DIAS</span>
          <span>RECORRÊNCIA META: ≤ 10%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
          SISTEMA OPERACIONAL IAT V2.5
        </div>
      </footer>
    </div>
  );
}
