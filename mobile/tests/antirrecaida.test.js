import {
  corDoGatilho,
  rotuloDoGatilho,
  montarArcosRosca,
  estadoInicialRespiracao,
  avancarRespiracao,
  formatarMinutosSegundos,
  textoProximoNivel,
  RESPIRACAO_PADRAO,
} from '../src/utils/antirrecaida';

describe('gatilhos', () => {
  it('cada gatilho tem a sua cor e o desconhecido cai no neutro', () => {
    expect(corDoGatilho('tedio')).toBe('#3987e5');
    expect(corDoGatilho('ansiedade')).not.toBe(corDoGatilho('tedio'));
    expect(corDoGatilho('xyz')).toBe('#64748b');
  });

  it('lê o rótulo da taxonomia da API ou da padrão', () => {
    expect(rotuloDoGatilho('promocao_relampago')).toBe('Promoção relâmpago');
    expect(rotuloDoGatilho('tedio', [{ chave: 'tedio', rotulo: 'Tédio (API)' }])).toBe('Tédio (API)');
    expect(rotuloDoGatilho(null)).toBeNull();
  });
});

describe('montarArcosRosca', () => {
  it('distribui 360° proporcionalmente e marca as divisas', () => {
    const { arcos, divisas } = montarArcosRosca([
      { chave: 'tedio', quantidade: 2 },
      { chave: 'ansiedade', quantidade: 1 },
      { chave: 'promocao_relampago', quantidade: 1 },
    ]);

    expect(arcos).toEqual([
      { chave: 'tedio', inicio: 0, varredura: 180 },
      { chave: 'ansiedade', inicio: 180, varredura: 90 },
      { chave: 'promocao_relampago', inicio: 270, varredura: 90 },
    ]);
    expect(divisas).toEqual([0, 180, 270]);
  });

  it('quebra arcos maiores que 180° em dois pedaços', () => {
    const { arcos } = montarArcosRosca([
      { chave: 'tedio', quantidade: 3 },
      { chave: 'ansiedade', quantidade: 1 },
    ]);
    const tedio = arcos.filter((a) => a.chave === 'tedio');

    expect(tedio).toEqual([
      { chave: 'tedio', inicio: 0, varredura: 180 },
      { chave: 'tedio', inicio: 180, varredura: 90 },
    ]);
    expect(arcos.every((a) => a.varredura <= 180)).toBe(true);
  });

  it('ignora fatias zeradas e não desenha divisa com uma fatia só', () => {
    const { arcos, divisas } = montarArcosRosca([
      { chave: 'tedio', quantidade: 0 },
      { chave: 'ansiedade', quantidade: 5 },
    ]);

    expect(arcos.map((a) => a.varredura)).toEqual([180, 180]);
    expect(divisas).toEqual([]);
  });

  it('sem nada superado devolve rosca vazia', () => {
    expect(montarArcosRosca([])).toEqual({ arcos: [], divisas: [] });
  });

  it('não gera arco de resto de arredondamento', () => {
    const { arcos } = montarArcosRosca([
      { chave: 'tedio', quantidade: 1 },
      { chave: 'ansiedade', quantidade: 1 },
      { chave: 'promocao_relampago', quantidade: 1 },
    ]);
    expect(arcos).toHaveLength(3);
  });
});

describe('respiração guiada', () => {
  const pular = (estado, tiques) =>
    Array.from({ length: tiques }).reduce((e) => avancarRespiracao(e, RESPIRACAO_PADRAO), estado);

  it('começa no inspire do primeiro ciclo', () => {
    expect(estadoInicialRespiracao()).toEqual({ ciclo: 1, etapa: 0, restante: 4, concluido: false });
  });

  it('passa para a etapa seguinte quando o tempo da etapa acaba', () => {
    const estado = pular(estadoInicialRespiracao(), 4);
    expect(estado).toMatchObject({ ciclo: 1, etapa: 1, restante: 7 });
  });

  it('volta ao inspire no ciclo seguinte e conclui no fim dos 4 ciclos', () => {
    expect(pular(estadoInicialRespiracao(), 19)).toMatchObject({ ciclo: 2, etapa: 0, restante: 4 });

    const fim = pular(estadoInicialRespiracao(), 4 * 19);
    expect(fim.concluido).toBe(true);
    expect(avancarRespiracao(fim)).toBe(fim);
  });
});

describe('formatarMinutosSegundos', () => {
  it('mostra mm:ss', () => {
    expect(formatarMinutosSegundos(1800)).toBe('30:00');
    expect(formatarMinutosSegundos(61)).toBe('01:01');
    expect(formatarMinutosSegundos(-5)).toBe('00:00');
  });
});

describe('textoProximoNivel', () => {
  it('junta pontos e decisões que faltam', () => {
    expect(
      textoProximoNivel({ titulo: 'Mestre do autocontrole', faltamPontos: 4, faltamDecisoes: 2 })
    ).toBe('Faltam 4 pontos e 2 decisões registradas para "Mestre do autocontrole".');
  });

  it('usa singular quando falta só um', () => {
    expect(textoProximoNivel({ titulo: 'Impulso no comando', faltamPontos: 0, faltamDecisoes: 1 })).toBe(
      'Falta 1 decisão registrada para "Impulso no comando".'
    );
  });

  it('avisa quando já está no topo', () => {
    expect(textoProximoNivel(null)).toMatch(/máximo/);
  });
});
