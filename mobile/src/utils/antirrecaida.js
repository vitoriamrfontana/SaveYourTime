/**
 * antirrecaida - regras puras da expansão antirrecaída do Cooldown (Sprint 4):
 * taxonomia dos gatilhos no app, geometria do gráfico de rosca, relógio da
 * respiração guiada do freio de emergência e textos da Maturidade.
 *
 * Fica fora dos componentes para ser testado sem renderizar nada.
 */

// Usado enquanto a API não respondeu (a taxonomia oficial vem do back-end)
export const GATILHOS_PADRAO = [
  { chave: 'tedio', rotulo: 'Tédio', emocional: true, descricao: 'Para passar o tempo' },
  { chave: 'ansiedade', rotulo: 'Ansiedade', emocional: true, descricao: 'Para aliviar o estresse' },
  {
    chave: 'promocao_relampago',
    rotulo: 'Promoção relâmpago',
    emocional: true,
    descricao: 'Urgência de desconto',
  },
  {
    chave: 'necessidade_genuina',
    rotulo: 'Necessidade genuína',
    emocional: false,
    descricao: 'Resolve um problema real',
  },
];

/**
 * Cor de cada gatilho: ordem categórica fixa, validada na superfície escura do
 * app (#1e293b) com contraste >= 3:1 e separação para daltonismo entre todos
 * os pares. A cor acompanha o gatilho, nunca a posição dele no ranking.
 */
export const CORES_GATILHO = {
  tedio: '#3987e5',
  ansiedade: '#d95926',
  promocao_relampago: '#199e70',
  necessidade_genuina: '#c98500',
};

const COR_SEM_GATILHO = '#64748b';

export function corDoGatilho(chave) {
  return CORES_GATILHO[chave] ?? COR_SEM_GATILHO;
}

export function rotuloDoGatilho(chave, gatilhos = GATILHOS_PADRAO) {
  const encontrado =
    gatilhos.find((g) => g.chave === chave) ?? GATILHOS_PADRAO.find((g) => g.chave === chave);
  return encontrado?.rotulo ?? null;
}

// Arcos menores que isso são resto de arredondamento, não fatia
const ARCO_MINIMO_GRAUS = 0.01;

/**
 * Converte as fatias da rosca ({ chave, quantidade }) em arcos, em graus no
 * sentido horário a partir do topo. Fatias zeradas saem. Arcos acima de 180°
 * viram dois pedaços, porque cada pedaço é desenhado com meio disco.
 *
 * `divisas` são os ângulos onde uma fatia começa (o respiro entre fatias);
 * com uma fatia só não há divisa.
 */
export function montarArcosRosca(fatias = []) {
  const validas = fatias.filter((f) => Number(f.quantidade) > 0);
  const total = validas.reduce((soma, f) => soma + Number(f.quantidade), 0);
  if (total === 0) return { arcos: [], divisas: [] };

  const arcos = [];
  const divisas = [];
  let inicio = 0;

  validas.forEach((fatia) => {
    const varredura = (Number(fatia.quantidade) / total) * 360;
    divisas.push(inicio);

    let cursor = inicio;
    let restante = varredura;
    while (restante > ARCO_MINIMO_GRAUS) {
      const pedaco = Math.min(restante, 180);
      arcos.push({ chave: fatia.chave, inicio: cursor, varredura: pedaco });
      cursor += pedaco;
      restante -= pedaco;
    }
    inicio += varredura;
  });

  return { arcos, divisas: validas.length > 1 ? divisas : [] };
}

// Mesma técnica do back-end, caso a resposta venha sem o protocolo
export const RESPIRACAO_PADRAO = {
  tecnica: '4-7-8',
  ciclos: 4,
  etapas: [
    { fase: 'inspire', segundos: 4, instrucao: 'Inspire pelo nariz' },
    { fase: 'segure', segundos: 7, instrucao: 'Segure o ar' },
    { fase: 'expire', segundos: 8, instrucao: 'Solte o ar pela boca, devagar' },
  ],
};

export function estadoInicialRespiracao(respiracao = RESPIRACAO_PADRAO) {
  const primeira = respiracao?.etapas?.[0];
  return { ciclo: 1, etapa: 0, restante: primeira?.segundos ?? 0, concluido: !primeira };
}

/** Um tique de 1 segundo na respiração guiada: etapa -> próxima etapa -> próximo ciclo. */
export function avancarRespiracao(estado, respiracao = RESPIRACAO_PADRAO) {
  if (estado.concluido) return estado;
  if (estado.restante > 1) return { ...estado, restante: estado.restante - 1 };

  const { etapas, ciclos } = respiracao;
  const proximaEtapa = estado.etapa + 1;

  if (proximaEtapa < etapas.length) {
    return { ...estado, etapa: proximaEtapa, restante: etapas[proximaEtapa].segundos };
  }
  if (estado.ciclo < ciclos) {
    return { ciclo: estado.ciclo + 1, etapa: 0, restante: etapas[0].segundos, concluido: false };
  }
  return { ...estado, restante: 0, concluido: true };
}

/** 1799 -> "29:59" (contagem do bloqueio do freio) */
export function formatarMinutosSegundos(segundos) {
  const total = Math.max(Math.ceil(Number(segundos) || 0), 0);
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

function plural(quantidade, singular, pluralForma) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralForma}`;
}

/** O que falta para o próximo nível de Maturidade Comportamental. */
export function textoProximoNivel(proximoNivel) {
  if (!proximoNivel) return 'Nível máximo alcançado. Agora é manter.';

  const { faltamPontos = 0, faltamDecisoes = 0, titulo } = proximoNivel;
  const partes = [];
  if (faltamPontos > 0) partes.push(plural(faltamPontos, 'ponto', 'pontos'));
  if (faltamDecisoes > 0) partes.push(plural(faltamDecisoes, 'decisão registrada', 'decisões registradas'));
  if (partes.length === 0) return `Próximo nível: "${titulo}".`;

  const verbo = faltamPontos + faltamDecisoes === 1 && partes.length === 1 ? 'Falta' : 'Faltam';
  return `${verbo} ${partes.join(' e ')} para "${titulo}".`;
}
