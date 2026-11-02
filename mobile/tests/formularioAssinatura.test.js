import { aplicarServico, camposIniciais, validarFormulario } from '../src/utils/formularioAssinatura';

const HOJE = '2026-11-01';

function campos(alteracoes = {}) {
  return { ...camposIniciais(null, null), nome: 'Netflix', valor: '39,90', ...alteracoes };
}

describe('camposIniciais', () => {
  it('em branco, começa mensal, em "outros" e só para você', () => {
    expect(camposIniciais(null, null)).toMatchObject({ nome: '', ciclo: 'mensal', categoria: 'outros', tipo: null, pessoas: 0 });
  });

  it('vindo do checklist, preenche nome, categoria e tipo', () => {
    const sugestao = { nome: 'Seguro do celular', categoria: 'financeiro', tipo: 'seguro' };
    expect(camposIniciais(null, sugestao)).toMatchObject(sugestao);
  });

  it('na edição, traz o valor com vírgula e as datas no formato brasileiro', () => {
    const assinatura = {
      nome: 'Antivírus',
      valorCobrado: 119.9,
      ciclo: 'anual',
      diaCobranca: 20,
      proximaCobranca: '2026-11-20',
      categoria: 'software',
      tipo: 'produtividade',
      compartilhadaCom: 1,
    };
    expect(camposIniciais(assinatura, null)).toMatchObject({
      valor: '119,90',
      dia: '20',
      proxima: '20/11/2026',
      pessoas: 1,
    });
  });
});

describe('aplicarServico', () => {
  const NETFLIX = {
    id: 'netflix',
    nome: 'Netflix',
    categoria: 'streaming',
    tipo: 'video',
    planoSugerido: { nome: 'Padrão', valor: 51.9, ciclo: 'mensal' },
  };

  it('preenche com o serviço e o plano sugerido', () => {
    expect(aplicarServico(camposIniciais(null, null), NETFLIX)).toMatchObject({
      nome: 'Netflix',
      categoria: 'streaming',
      tipo: 'video',
      catalogoId: 'netflix',
      valor: '51,90',
      ciclo: 'mensal',
    });
  });

  it('usa o plano escolhido', () => {
    const anual = { nome: 'Anual', valor: 166.8, ciclo: 'anual' };
    expect(aplicarServico(camposIniciais(null, null), NETFLIX, anual)).toMatchObject({ valor: '166,80', ciclo: 'anual' });
  });

  it('sem plano de referência, mantém o valor digitado', () => {
    const semPreco = { ...NETFLIX, planoSugerido: null };
    expect(aplicarServico({ ...camposIniciais(null, null), valor: '10,00' }, semPreco).valor).toBe('10,00');
  });

  it('o serviço vai no cadastro, mas não na edição', () => {
    const campos = aplicarServico({ ...camposIniciais(null, null) }, NETFLIX);
    expect(validarFormulario(campos, { hoje: '2026-11-01' }).dados.catalogoId).toBe('netflix');
    expect(validarFormulario(campos, { editando: true, hoje: '2026-11-01' }).dados.catalogoId).toBeUndefined();
  });
});

describe('validarFormulario', () => {
  it('monta o corpo da API a partir do que foi digitado', () => {
    const { erros, dados } = validarFormulario(campos({ dia: '15', categoria: 'streaming', tipo: 'video', pessoas: 2 }), {
      hoje: HOJE,
    });

    expect(erros).toEqual({});
    expect(dados).toEqual({
      nome: 'Netflix',
      valorCobrado: 39.9,
      ciclo: 'mensal',
      categoria: 'streaming',
      tipo: 'video',
      compartilhadaCom: 2,
      diaCobranca: 15,
    });
  });

  it('fora do mensal, envia a data da próxima cobrança', () => {
    const { dados } = validarFormulario(campos({ ciclo: 'anual', proxima: '20/11/2026' }), { hoje: HOJE });
    expect(dados.proximaCobranca).toBe('2026-11-20');
  });

  it('teste grátis no cadastro vira status "teste" com a data de fim', () => {
    const { dados } = validarFormulario(campos({ emTeste: true, fimTeste: '08/11/2026' }), { hoje: HOJE });
    expect(dados).toMatchObject({ status: 'teste', fimTeste: '2026-11-08' });
  });

  it('na edição, ignora o teste grátis', () => {
    const { erros, dados } = validarFormulario(campos({ emTeste: true, fimTeste: '' }), { editando: true, hoje: HOJE });

    expect(erros).toEqual({});
    expect(dados.status).toBeUndefined();
  });

  it.each([
    ['nome vazio', { nome: '  ' }, 'nome'],
    ['nome longo demais', { nome: 'a'.repeat(61) }, 'nome'],
    ['valor em branco', { valor: '' }, 'valor'],
    ['valor zero', { valor: '0' }, 'valor'],
    ['dia 32', { dia: '32' }, 'dia'],
    ['data da próxima cobrança inválida', { ciclo: 'anual', proxima: '31/02/2026' }, 'proxima'],
    ['teste grátis que já acabou', { emTeste: true, fimTeste: '01/11/2026' }, 'fimTeste'],
    ['teste grátis sem data', { emTeste: true, fimTeste: '' }, 'fimTeste'],
  ])('aponta erro com %s', (_, alteracoes, campo) => {
    const { erros } = validarFormulario(campos(alteracoes), { hoje: HOJE });
    expect(Object.keys(erros)).toEqual([campo]);
  });
});
