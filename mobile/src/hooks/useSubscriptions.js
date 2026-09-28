/**
 * useSubscriptions - concentra estado e lógica do módulo de Detox de
 * Assinaturas. A view fica só com JSX; toda a lógica de dados vive aqui.
 *
 * Sprint 2: insights (horas de trabalho, custo invisível, juros compostos),
 * auditoria de cancelamentos, filtro por categoria e ordenação por valor.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiService } from '../services/api';

export const TODAS_CATEGORIAS = 'todas';

export const ORDENACOES = {
  PADRAO: 'padrao',
  MAIOR_VALOR: 'maior',
  MENOR_VALOR: 'menor',
};

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [economia, setEconomia] = useState({ economiaMensal: 0, economiaAnual: 0 });
  const [insights, setInsights] = useState(null);
  const [auditoria, setAuditoria] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState(TODAS_CATEGORIAS);
  const [ordenacao, setOrdenacao] = useState(ORDENACOES.PADRAO);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setError(null);
      const [lista, dadosInsights, dadosAuditoria] = await Promise.all([
        ApiService.getSubscriptions(),
        ApiService.getSubscriptionInsights(),
        ApiService.getSubscriptionAudit(),
      ]);
      setSubscriptions(lista.subscriptions);
      setEconomia(lista.economia);
      setInsights(dadosInsights);
      setAuditoria(dadosAuditoria);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchData({ silent: true });
  }, [fetchData]);

  const toggle = useCallback(
    async (id) => {
      // Atualização otimista: reflete a mudança na UI antes da resposta do servidor
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ativo: !s.ativo } : s))
      );

      try {
        await ApiService.toggleSubscription(id);
        // Sincroniza com os números reais (economia, insights e auditoria recalculados no servidor)
        await fetchData({ silent: true });
      } catch (err) {
        // Reverte a mudança otimista em caso de falha
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ativo: !s.ativo } : s))
        );
        setError(err.message);
      }
    },
    [fetchData]
  );

  // Lista já filtrada por categoria e ordenada por valor, pronta para a view
  const subscriptionsVisiveis = useMemo(() => {
    const filtradas =
      categoriaFiltro === TODAS_CATEGORIAS
        ? subscriptions
        : subscriptions.filter((s) => s.categoria === categoriaFiltro);

    if (ordenacao === ORDENACOES.MAIOR_VALOR) {
      return [...filtradas].sort((a, b) => b.valorMensal - a.valorMensal);
    }
    if (ordenacao === ORDENACOES.MENOR_VALOR) {
      return [...filtradas].sort((a, b) => a.valorMensal - b.valorMensal);
    }
    return filtradas;
  }, [subscriptions, categoriaFiltro, ordenacao]);

  return {
    // Sprint 1 (mantidos para a view atual continuar funcionando)
    subscriptions,
    economia,
    loading,
    refreshing,
    error,
    refresh,
    toggle,
    // Sprint 2
    subscriptionsVisiveis,
    insights,
    auditoria,
    categorias: insights?.categorias ?? [],
    categoriaFiltro,
    setCategoriaFiltro,
    ordenacao,
    setOrdenacao,
  };
}