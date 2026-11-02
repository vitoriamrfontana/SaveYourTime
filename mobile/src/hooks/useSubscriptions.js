/**
 * useSubscriptions - concentra estado e lógica do módulo de Detox de
 * Assinaturas. A view fica só com JSX; toda a lógica de dados vive aqui.
 *
 * Sprint 2: insights (horas de trabalho, custo invisível, juros compostos),
 * auditoria de cancelamentos, filtro por categoria e ordenação por valor.
 * Sprint 4: a tela carrega numa chamada só (/overview), e mudar status, editar
 * ou excluir já devolve o resumo recalculado. Cancelar e pausar podem ser
 * desfeitos, os erros têm mensagem amigável, e dados e filtros sobrevivem à
 * troca de aba. Também: busca, filtro por status, meta de gasto, autocomplete do
 * catálogo, Detox do mês e guia de cancelamento.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiService } from '../services/api';
import { adicionarMeses, hojeLocal } from '../utils/datas';
import { formatarData } from '../utils/format';
import {
  filtrarEOrdenar,
  ORDENACOES,
  TODAS_CATEGORIAS,
  TODOS_STATUS,
} from '../utils/listaAssinaturas';
import { DECISOES } from '../utils/revisaoDoMes';

export { ORDENACOES, TODAS_CATEGORIAS, TODOS_STATUS };

const ECONOMIA_ZERADA = { economiaMensal: 0, economiaAnual: 0, economiaAcumulada: 0 };

// Quanto tempo dura a pausa escolhida no Detox do mês
const MESES_DE_PAUSA_NA_REVISAO = 1;

// Sprint 4: o App.js desmonta a tela ao trocar de aba. Guardando aqui, fora do
// componente, o último resumo e os filtros aparecem na hora quando ela volta.
const cache = {
  resumo: null,
  meta: null,
  categoriaFiltro: TODAS_CATEGORIAS,
  statusFiltro: TODOS_STATUS,
  busca: '',
  ordenacao: ORDENACOES.PADRAO,
};

// Cada requisição que pode mudar a tela ganha um número, e só a mais recente
// escreve o resumo: assim uma resposta atrasada não desfaz uma mais nova.
let ultimaRequisicao = 0;

function novaRequisicao() {
  ultimaRequisicao += 1;
  return ultimaRequisicao;
}

// Sprint 4: com o backend desligado, o fetch do React Native falha com
// "Network request failed" (em inglês); aqui vira uma mensagem que diz o que fazer.
function mensagemAmigavel(err) {
  const semConexao = err instanceof TypeError || /network|failed to fetch/i.test(err?.message ?? '');
  if (semConexao) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando e tente de novo.';
  }
  return err?.message || 'Algo deu errado. Tente de novo.';
}

// O que reenviar para desfazer uma mudança de status
function estadoDe(assinatura) {
  return {
    id: assinatura.id,
    status: assinatura.status,
    pausadaAte: assinatura.pausadaAte,
    fimTeste: assinatura.fimTeste,
  };
}

// Resumo com o status de uma assinatura já trocado, para o Switch responder na hora
function comStatus(resumo, id, status) {
  return {
    ...resumo,
    subscriptions: resumo.subscriptions.map((s) =>
      s.id === id ? { ...s, status, ativo: status === 'ativa' || status === 'teste' } : s
    ),
  };
}

export function useSubscriptions() {
  const [resumo, setResumo] = useState(cache.resumo);
  const [meta, setMeta] = useState(cache.meta);
  const [categoriaFiltro, setCategoriaFiltroAtual] = useState(cache.categoriaFiltro);
  const [statusFiltro, setStatusFiltroAtual] = useState(cache.statusFiltro);
  const [busca, setBuscaAtual] = useState(cache.busca);
  const [ordenacao, setOrdenacaoAtual] = useState(cache.ordenacao);
  const [loading, setLoading] = useState(cache.resumo === null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  // Sprint 4: última mudança que ainda pode ser desfeita ({ mensagem, anterior })
  const [desfazer, setDesfazer] = useState(null);

  const aplicarResumo = useCallback((novo) => {
    cache.resumo = novo;
    setResumo(novo);
  }, []);

  const fetchData = useCallback(async () => {
    const numero = novaRequisicao();
    try {
      const [novoResumo, novaMeta] = await Promise.all([
        ApiService.getSubscriptionOverview(),
        // A taxonomia não muda: busca uma vez. Se falhar, a tela mostra os valores crus.
        cache.meta ?? ApiService.getSubscriptionMeta().catch(() => null),
      ]);
      if (novaMeta) {
        cache.meta = novaMeta;
        setMeta(novaMeta);
      }
      if (numero === ultimaRequisicao) aplicarResumo(novoResumo);
      // Recarga que deu certo apaga o erro anterior
      setError(null);
    } catch (err) {
      setError(mensagemAmigavel(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [aplicarResumo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Sprint 4: botão "Tentar de novo" de quando nada chegou a carregar
  const tentarDeNovo = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Sprint 4: a troca de status aparece antes da resposta e volta atrás se a API
  // falhar. A resposta já traz o resumo recalculado: uma requisição só.
  const alterarStatus = useCallback(
    async (id, dados) => {
      const numero = novaRequisicao();
      const anterior = cache.resumo;
      if (anterior) aplicarResumo(comStatus(anterior, id, dados.status));
      try {
        const { resumo: novo } = await ApiService.changeSubscriptionStatus(id, dados);
        if (numero === ultimaRequisicao) aplicarResumo(novo);
        setError(null);
        return true;
      } catch (err) {
        if (numero === ultimaRequisicao && anterior) aplicarResumo(anterior);
        setError(mensagemAmigavel(err));
        return false;
      }
    },
    [aplicarResumo]
  );

  // Cancelar e pausar podem ser desfeitos por alguns segundos (o aviso fica na view)
  const cancelar = useCallback(
    async (assinatura) => {
      const anterior = estadoDe(assinatura);
      if (await alterarStatus(assinatura.id, { status: 'cancelada' })) {
        setDesfazer({ mensagem: `${assinatura.nome} cancelada.`, anterior });
      }
    },
    [alterarStatus]
  );

  const pausar = useCallback(
    async (assinatura, meses) => {
      const anterior = estadoDe(assinatura);
      const pausadaAte = adicionarMeses(hojeLocal(), meses);
      if (await alterarStatus(assinatura.id, { status: 'pausada', pausadaAte })) {
        setDesfazer({ mensagem: `${assinatura.nome} pausada até ${formatarData(pausadaAte)}.`, anterior });
      }
    },
    [alterarStatus]
  );

  const reativar = useCallback(
    (assinatura) => alterarStatus(assinatura.id, { status: 'ativa' }),
    [alterarStatus]
  );

  const desfazerUltima = useCallback(async () => {
    if (!desfazer) return;
    const { id, ...estadoAnterior } = desfazer.anterior;
    setDesfazer(null);
    await alterarStatus(id, estadoAnterior);
  }, [desfazer, alterarStatus]);

  const fecharDesfazer = useCallback(() => setDesfazer(null), []);

  // Sprint 4: cadastro, edição e exclusão. Os erros sobem para o formulário mostrar.
  const salvar = useCallback(
    async (dados, id) => {
      try {
        if (id) {
          const numero = novaRequisicao();
          const { resumo: novo } = await ApiService.updateSubscription(id, dados);
          if (numero === ultimaRequisicao) aplicarResumo(novo);
        } else {
          // O POST é do formato antigo e devolve só a assinatura: recarrega o resumo
          await ApiService.createSubscription(dados);
          await fetchData();
        }
      } catch (err) {
        throw new Error(mensagemAmigavel(err));
      }
    },
    [aplicarResumo, fetchData]
  );

  const excluir = useCallback(
    async (id) => {
      try {
        const numero = novaRequisicao();
        const { resumo: novo } = await ApiService.deleteSubscription(id);
        if (numero === ultimaRequisicao) aplicarResumo(novo);
      } catch (err) {
        throw new Error(mensagemAmigavel(err));
      }
    },
    [aplicarResumo]
  );

  // Sprint 3: calculadora de custo por uso. Devolve o resultado para o modal
  // e recarrega a tela, porque a sugestão de pausa pode mudar. Erros sobem para o modal.
  // Sprint 4: "entrada" é o número de usos ou { resposta } nos tipos com pergunta.
  const checkUsage = useCallback(
    async (id, entrada) => {
      let resultado;
      try {
        resultado = await ApiService.checkSubscriptionUsage(id, entrada);
      } catch (err) {
        // Sprint 4: o modal mostra a mesma mensagem amigável da tela
        throw new Error(mensagemAmigavel(err));
      }
      await fetchData();
      return resultado;
    },
    [fetchData]
  );

  // Sprint 4: meta de gasto com assinaturas (% da renda); a resposta traz o resumo
  const atualizarLimite = useCallback(
    async (limitePercentualRenda) => {
      const numero = novaRequisicao();
      try {
        const { resumo: novo } = await ApiService.updateSubscriptionSettings({ limitePercentualRenda });
        if (numero === ultimaRequisicao) aplicarResumo(novo);
        setError(null);
      } catch (err) {
        setError(mensagemAmigavel(err));
      }
    },
    [aplicarResumo]
  );

  // Sprint 4: autocomplete do formulário. Falha na busca não atrapalha o cadastro.
  const buscarNoCatalogo = useCallback(async (texto) => {
    try {
      return await ApiService.searchSubscriptionCatalog(texto);
    } catch {
      return [];
    }
  }, []);

  // Sprint 4: Detox do mês e guia de cancelamento (os modais mostram o erro)
  const carregarRevisao = useCallback(async () => {
    try {
      return await ApiService.getSubscriptionReview();
    } catch (err) {
      throw new Error(mensagemAmigavel(err));
    }
  }, []);

  const carregarGuia = useCallback(async (id) => {
    try {
      return await ApiService.getSubscriptionCancelGuide(id);
    } catch (err) {
      throw new Error(mensagemAmigavel(err));
    }
  }, []);

  // Sprint 4: aplica de uma vez o que foi decidido no Detox do mês. Devolve quantas
  // mudanças falharam (a tela avisa e recarrega o que deu certo).
  const aplicarDecisoesDaRevisao = useCallback(
    async (decisoes) => {
      let falhas = 0;
      for (const [id, decisao] of Object.entries(decisoes)) {
        if (decisao === DECISOES.MANTER) continue;
        const dados =
          decisao === DECISOES.PAUSAR
            ? { status: 'pausada', pausadaAte: adicionarMeses(hojeLocal(), MESES_DE_PAUSA_NA_REVISAO) }
            : { status: 'cancelada' };
        if (!(await alterarStatus(Number(id), dados))) falhas += 1;
      }
      return falhas;
    },
    [alterarStatus]
  );

  // Sprint 4: os filtros também ficam no cache, para voltarem com a aba
  const setCategoriaFiltro = useCallback((valor) => {
    cache.categoriaFiltro = valor;
    setCategoriaFiltroAtual(valor);
  }, []);

  const setStatusFiltro = useCallback((valor) => {
    cache.statusFiltro = valor;
    setStatusFiltroAtual(valor);
  }, []);

  const setBusca = useCallback((valor) => {
    cache.busca = valor;
    setBuscaAtual(valor);
  }, []);

  const setOrdenacao = useCallback((valor) => {
    cache.ordenacao = valor;
    setOrdenacaoAtual(valor);
  }, []);

  const subscriptions = useMemo(() => resumo?.subscriptions ?? [], [resumo]);

  // Lista já filtrada (categoria, status e nome) e ordenada, pronta para a view
  const subscriptionsVisiveis = useMemo(
    () => filtrarEOrdenar(subscriptions, { categoria: categoriaFiltro, status: statusFiltro, busca, ordenacao }),
    [subscriptions, categoriaFiltro, statusFiltro, busca, ordenacao]
  );

  // Sprint 4: rótulos e formas de verificar vindos da API (/meta); se ela
  // falhar, a tela mostra o valor cru
  const tiposDaMeta = useMemo(() => meta?.categorias.flatMap((c) => c.tipos) ?? [], [meta]);
  const rotuloCategoria = useCallback(
    (valor) => meta?.categorias.find((c) => c.valor === valor)?.rotulo ?? valor,
    [meta]
  );
  const descricaoTipo = useCallback(
    (valor) => tiposDaMeta.find((t) => t.valor === valor)?.descricao ?? valor,
    [tiposDaMeta]
  );
  const fraseCiclo = useCallback(
    (valor) => meta?.ciclos.find((c) => c.valor === valor)?.frase ?? valor,
    [meta]
  );
  const verificacaoDoTipo = useCallback(
    (tipo) => {
      if (tipo == null) return meta?.verificacaoSemTipo ?? { forma: 'uso' };
      return tiposDaMeta.find((t) => t.valor === tipo)?.verificacao ?? { forma: 'uso' };
    },
    [meta, tiposDaMeta]
  );

  return {
    subscriptions,
    subscriptionsVisiveis,
    economia: resumo?.economia ?? ECONOMIA_ZERADA,
    insights: resumo?.insights ?? null,
    auditoria: resumo?.auditoria ?? [],
    redundancias: resumo?.redundancias ?? null,
    loading,
    refreshing,
    error,
    refresh,
    categorias: meta?.categorias ?? [],
    categoriaFiltro,
    setCategoriaFiltro,
    ordenacao,
    setOrdenacao,
    // Sprint 3
    checkUsage,
    // Sprint 4
    dadosCarregados: resumo !== null,
    tentarDeNovo,
    proximasCobrancas: resumo?.proximasCobrancas ?? null,
    limite: resumo?.limite ?? null,
    meta,
    statusFiltro,
    setStatusFiltro,
    busca,
    setBusca,
    rotuloCategoria,
    descricaoTipo,
    fraseCiclo,
    verificacaoDoTipo,
    cancelar,
    pausar,
    reativar,
    desfazer,
    desfazerUltima,
    fecharDesfazer,
    salvar,
    excluir,
    atualizarLimite,
    buscarNoCatalogo,
    carregarRevisao,
    carregarGuia,
    aplicarDecisoesDaRevisao,
  };
}
