import { useState, useEffect, useCallback } from 'react';
import { getPotes } from '../services/api';
import { montarPots } from '../models/Pots';

export function usePotsController() {
  const [pots, setPots] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(() => {
    setCarregando(true);
    setErro(null);

    getPotes()
      .then((dadosApi) => setPots(montarPots(dadosApi)))
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { pots, carregando, erro, recarregar: carregar };
}