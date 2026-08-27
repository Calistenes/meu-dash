export interface Colaborador {
  id: string;
  funcionario: string;
  cidade: string;
  supervisor: string;
  gerente: string;
  tipo: string;
  statusMes: string; // "-" means active full month, "FÉRIAS", "AFASTADO" etc.
  quartil: string;
  ptInst: number;
  ptRep: number;
  ptReg: number;
  ptRec: number;
  ptProdExtra: number;
  infracoesQualidade: number;
  pontos: number;
  recPercent: number;
  clientesTotais: number;
  meta: number; // default 176
  falta: number;
}

export interface ItemInativo {
  id: string;
  matricula: string;
  colaborador: string;
  uf: string;
  cargo: string;
  lider: string;
  nomeItem: string;
  idItem: string;
  serial: string;
  classe: string;
  situacao: string; // 'INATIVO', 'ATIVO', 'DEMITIDO', 'FÉRIAS', etc.
  dataMovimento: string;
  saidaValida: string;
  diasCorridos: number;
  qtdEstoque: number;
  // Campos legados/opcionais de compatibilidade
  funcionario?: string;
  cidade?: string;
  supervisor?: string;
  gerente?: string;
  tipo?: string;
  statusInativo?: string;
  motivo?: string;
  dataInativacao?: string;
  pontosAcumulados?: number;
}

export interface CalculoResultado {
  colaborador: Colaborador;
  percentualAtingimento: number;
  pontosFaltantes: number;
  pontosDiariosNecessarios: number;
  ritmoStatus: 'BATIDA' | 'FACIL' | 'MODERADO' | 'DESAFIADOR' | 'CRITICO';
  feedbackOrientativo: string;
  feedbackIncentivo: string;
  whatsappMessage: string;
  whatsappLink: string;
}

export interface ConfiguracoesCiclo {
  diasUteisRestantes: number;
  metaPadrao: number;
  mesAno: string;
}
