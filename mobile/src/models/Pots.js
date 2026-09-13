export const CONFIG_POTES = [
  { chave: 'sobrevivencia', nome: 'Sobrevivência', cor: '#38bdf8' },
  { chave: 'estiloVida', nome: 'Estilo de Vida', cor: '#a78bfa' },
  { chave: 'dividas', nome: 'Dívidas', cor: '#f87171' },
];

export function calcularPercentual(atual, limite) {
  if (!limite) return { percentualVisual: 0, percentualReal: 0 };
  const percentualReal = (atual / limite) * 100;
  return {
    percentualVisual: Math.min(percentualReal, 100),
    percentualReal,
  };
}

export function montarPots(dadosApi) {
  if (!dadosApi) return [];

  return CONFIG_POTES.map(({ chave, nome, cor }) => {
    const atual = dadosApi.atual[chave] ?? 0;
    const limite = dadosApi.limites[chave] ?? 0;
    const { percentualVisual, percentualReal } = calcularPercentual(atual, limite);

    return {
      chave,
      nome,
      cor,
      atual,
      limite,
      percentualVisual,
      percentualReal,
      estourado: percentualReal > 100,
    };
  });
}