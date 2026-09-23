/**
 * useCooldown - concentra estado e lógica do módulo de Trava Cooldown 48h.
 * A view fica só com JSX; o carregamento dos dados vive aqui.
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiService } from '../services/api';

const RESUMO_INICIAL = {
  totalEmEspera: 0,
  totalLiberados: 0,
  valorRetido: 0,
  horasSuorRetidas: 0,
  periodoCooldownHoras: 48,
};

export function useCooldown() {
  const [items, setItems] = useState([]);
  const [resumo, setResumo] = useState(RESUMO_INICIAL);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setError(null);
      const data = await ApiService.getCooldownItems();

      // Blinda contra payload fora do formato esperado (ex.: uma versão
      // antiga da API ainda no ar, respondendo [] em vez de { items, resumo }).
      setItems(Array.isArray(data?.items) ? data.items : []);
      setResumo({ ...RESUMO_INICIAL, ...(data?.resumo ?? {}) });
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

  return { items, resumo, loading, refreshing, error, refresh };
}
