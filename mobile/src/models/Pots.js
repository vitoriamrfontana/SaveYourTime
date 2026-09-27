export const CONFIG_POTES = [
  {
    chave: 'sobrevivencia',
    nome: 'Necessidades',
    percentual: 50,
  },
  {
    chave: 'estiloVida',
    nome: 'Estilo de Vida',
    percentual: 30,
  },
  {
    chave: 'dividas',
    nome: 'Dívidas / Investimentos',
    percentual: 20,
  },
];

export const CORES_STATUS = {
  normal: '#22c55e',
  atencao: '#f59e0b',
  estourado: '#ef4444',
};

export function calcularPercentual(atual, limite) {
  if (!limite) {
    return { percentualVisual: 0, percentualReal: 0 };
  }

  const percentualReal = (Number(atual) / Number(limite)) * 100;
  return {
    percentualVisual: Math.min(Math.max(percentualReal, 0), 100),
    percentualReal,
  };
}

export function obterCorStatus(pote) {
  if (pote?.statusAlerta && CORES_STATUS[pote.statusAlerta]) {
    return CORES_STATUS[pote.statusAlerta];
  }

  const percentual = Number(pote?.percentualTeto ?? pote?.percentualReal ?? 0);
  if (percentual > 100) return CORES_STATUS.estourado;
  if (percentual >= 80) return CORES_STATUS.atencao;
  return CORES_STATUS.normal;
}

export function montarPots(dadosApi) {
  if (!dadosApi) return [];

  if (Array.isArray(dadosApi.pots)) {
    return dadosApi.pots.map((pote) => ({
      ...pote,
      percentualVisual: Number(pote.percentualVisual ?? 0),
      percentualReal: Number(pote.percentualTeto ?? 0),
      cor: obterCorStatus(pote),
    }));
  }

  // Compatibilidade com o formato legado do endpoint.
  return CONFIG_POTES.map(({ chave, nome, percentual }) => {
    const atual = Number(dadosApi.atual?.[chave] ?? 0);
    const limite = Number(dadosApi.limites?.[chave] ?? 0);
    const { percentualVisual, percentualReal } = calcularPercentual(atual, limite);
    const statusAlerta = percentualReal > 100 ? 'estourado' : percentualReal >= 80 ? 'atencao' : 'normal';

    return {
      chave,
      nome,
      percentualOrcamento: percentual,
      limite,
      gastoAtual: atual,
      atual,
      saldo: limite - atual,
      percentualVisual,
      percentualReal,
      percentualTeto: percentualReal,
      burnRateDiario: 0,
      projecaoDia: null,
      statusAlerta,
      estourado: percentualReal > 100,
      cor: CORES_STATUS[statusAlerta],
      transacoes: [],
    };
  });
}
