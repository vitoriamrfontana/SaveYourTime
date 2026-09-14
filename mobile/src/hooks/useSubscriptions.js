/**
 * useSubscriptions - concentra estado e lógica do módulo de Detox de
 * Assinaturas. A view fica só com JSX; toda a lógica de dados vive aqui.
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiService } from '../services/api';

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [economia, setEconomia] = useState({ economiaMensal: 0, economiaAnual: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setError(null);
      const data = await ApiService.getSubscriptions();
      setSubscriptions(data.subscriptions);
      setEconomia(data.economia);
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
        // Sincroniza com os números reais (economia recalculada no servidor)
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

  return { subscriptions, economia, loading, refreshing, error, refresh, toggle };
}