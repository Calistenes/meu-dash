import Papa from 'papaparse';
import { Colaborador } from '../types';

export const parseCSVToColaboradores = (
  source: File | string,
  onSuccess: (items: Colaborador[]) => void,
  onError: (errorMsg: string) => void,
  metaPadrao = 176
) => {
  Papa.parse(source as any, {
    skipEmptyLines: true,
    dynamicTyping: false,
    delimiter: '', // auto-detect ;, tab, comma
    complete: (results) => {
      const rows = results.data as string[][];
      if (!rows || rows.length === 0) {
        onError('O arquivo ou texto fornecido está vazio.');
        return;
      }

      // Helper para converter string de número formato PT-BR ou EN para float
      const parseNum = (val: string | undefined, defaultVal = 0): number => {
        if (val === undefined || val === null || val === '') return defaultVal;
        const str = val.toString().trim();
        if (!str) return defaultVal;

        // Remover R$, %, espaços
        const cleaned = str
          .replace(/R\$/gi, '')
          .replace(/%/g, '')
          .replace(/\s/g, '')
          .replace(/pts\/dia/gi, '')
          .replace(/Meta Batida/gi, '0');

        let norm = cleaned;
        if (cleaned.includes(',') && cleaned.includes('.')) {
          norm = cleaned.replace(/\./g, '').replace(',', '.');
        } else if (cleaned.includes(',')) {
          norm = cleaned.replace(',', '.');
        }

        const num = parseFloat(norm);
        return isNaN(num) ? defaultVal : num;
      };

      let startIndex = 0;
      const firstRowStr = rows[0].map((c) => (c || '').toString()).join(' ').toUpperCase();

      const isHeader =
        firstRowStr.includes('FUNCIONARIO') ||
        firstRowStr.includes('RANKING') ||
        firstRowStr.includes('COLABORADOR') ||
        firstRowStr.includes('SUPERVISOR') ||
        firstRowStr.includes('PONTOS') ||
        firstRowStr.includes('QUARTIL');

      let headers: string[] = [];
      if (isHeader) {
        headers = rows[0].map((h) =>
          (h || '')
            .toString()
            .trim()
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        );
        startIndex = 1;
      }

      const newItems: Colaborador[] = [];

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        let funcionario = '';
        let cidade = 'SÃO PAULO - SP';
        let supervisor = 'SUPERVISOR';
        let gerente = 'GERENTE';
        let tipo = 'TÉCNICO IAT';
        let statusMes = '-';
        let quartil = '1º QUARTIL';
        let ptInst = 0;
        let ptRep = 0;
        let ptReg = 0;
        let ptRec = 0;
        let ptProdExtra = 0;
        let infracoes = 0;
        let pontos = 0;
        let recPercent = 5.0;
        let clientesTotais = 100;
        let meta = metaPadrao;

        if (headers.length > 0) {
          headers.forEach((hdr, idx) => {
            const rawVal = (row[idx] || '').toString().trim();
            if (!rawVal) return;

            if (hdr.includes('FUNC') || hdr.includes('COLABORADOR') || hdr.includes('NOME')) {
              funcionario = rawVal;
            } else if (hdr.includes('CIDADE') || hdr.includes('PRACA') || hdr.includes('FILIAL')) {
              cidade = rawVal;
            } else if (hdr.includes('SUPERV')) {
              supervisor = rawVal;
            } else if (hdr.includes('GERENT')) {
              gerente = rawVal;
            } else if (hdr.includes('TIPO') || hdr.includes('CARGO')) {
              tipo = rawVal;
            } else if (hdr.includes('STATUS')) {
              statusMes = rawVal;
            } else if (hdr.includes('QUARTIL')) {
              quartil = rawVal;
            } else if (hdr.includes('INST')) {
              ptInst = parseNum(rawVal);
            } else if (hdr.includes('REP')) {
              ptRep = parseNum(rawVal);
            } else if (hdr.includes('REG')) {
              ptReg = parseNum(rawVal);
            } else if (hdr.includes('REC') && !hdr.includes('RECORR') && !hdr.includes('REC%')) {
              ptRec = parseNum(rawVal);
            } else if (hdr.includes('EXTRA')) {
              ptProdExtra = parseNum(rawVal);
            } else if (hdr.includes('INFRAC')) {
              infracoes = parseNum(rawVal);
            } else if (hdr.includes('PONTO') || hdr.includes('PTS')) {
              pontos = parseNum(rawVal);
            } else if (hdr.includes('RECORR') || hdr.includes('REC%') || hdr.includes('PERCENTUAL')) {
              recPercent = parseNum(rawVal, 5);
            } else if (hdr.includes('CLIENTE')) {
              clientesTotais = parseInt(rawVal, 10) || 100;
            } else if (hdr.includes('META') && !hdr.includes('META_DIARIA')) {
              meta = parseNum(rawVal, metaPadrao);
            }
          });
        }

        // Positional fallback
        if (!funcionario && row.length >= 2) {
          if (row[0] && (row[0].includes('Place') || row[0].includes('º'))) {
            funcionario = (row[1] || '').toString().trim();
            supervisor = (row[2] || 'SUPERVISOR').toString().trim();
            quartil = (row[3] || '1º QUARTIL').toString().trim();
            recPercent = parseNum(row[4], 5);
            pontos = parseNum(row[6], 0);
            meta = parseNum(row[7], metaPadrao);
          } else {
            funcionario = (row[0] || '').toString().trim();
            cidade = (row[1] || 'SÃO PAULO - SP').toString().trim();
            supervisor = (row[2] || 'SUPERVISOR').toString().trim();
            gerente = (row[3] || 'GERENTE').toString().trim();
            tipo = (row[4] || 'TÉCNICO IAT').toString().trim();
            statusMes = (row[5] || '-').toString().trim();
            quartil = (row[6] || '1º QUARTIL').toString().trim();
            ptInst = parseNum(row[7]);
            ptRep = parseNum(row[8]);
            ptReg = parseNum(row[9]);
            ptRec = parseNum(row[10]);
            ptProdExtra = parseNum(row[11]);
            infracoes = parseNum(row[12]);
            pontos = parseNum(row[13]) || ptInst + ptRep + ptReg + ptRec + ptProdExtra - infracoes;
            recPercent = parseNum(row[14], 5);
            clientesTotais = parseInt(row[15] || '100', 10) || 100;
            meta = parseNum(row[16], metaPadrao);
          }
        }

        if (funcionario) {
          if (!pontos && (ptInst || ptRep || ptReg || ptRec || ptProdExtra)) {
            pontos = ptInst + ptRep + ptReg + ptRec + ptProdExtra - infracoes;
          }

          const metaFinal = meta || metaPadrao;

          newItems.push({
            id: 'colab_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 6),
            funcionario,
            cidade,
            supervisor,
            gerente,
            tipo,
            statusMes: statusMes || '-',
            quartil: quartil || '1º QUARTIL',
            ptInst,
            ptRep,
            ptReg,
            ptRec,
            ptProdExtra,
            infracoesQualidade: infracoes,
            pontos: Number(pontos.toFixed(2)),
            recPercent: Number(recPercent.toFixed(1)),
            clientesTotais: clientesTotais || 100,
            meta: metaFinal,
          });
        }
      }

      if (newItems.length > 0) {
        onSuccess(newItems);
      } else {
        onError('Não foi possível reconhecer registros válidos no arquivo CSV.');
      }
    },
    error: (err) => {
      onError(`Erro ao processar arquivo com PapaParse: ${err.message}`);
    },
  });
};
