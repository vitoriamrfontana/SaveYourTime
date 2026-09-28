import { useCallback, useEffect, useState } from 'react';
import { criarLancamentoPote, deletarLancamentoPote, getPotes } from '../services/api';
import { montarPots } from '../models/Pots';

export function usePotsController() {
  const [dados, setDados] = useState(null);
  const [pots, setPots] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const aplicarDados = useCallback((dadosApi) => {
    setDados(dadosApi);
    setPots(montarPots(dadosApi));
  }, []);

  const carregar = useCallback(async (mes) => {
    setCarregando(true);
    setErro(null);

    try {
      const dadosApi = await getPotes(mes);
      aplicarDados(dadosApi);
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar os potes.');
    } finally {
      setCarregando(false);
    }
  }, [aplicarDados]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const adicionarLancamento = useCallback(async (lancamento) => {
    setSalvando(true);
    setErro(null);

    try {
      const resposta = await criarLancamentoPote(lancamento);
      await carregar();
      return resposta;
    } catch (error) {
      setErro(error.message || 'Não foi possível adicionar o lançamento.');
      throw error;
    } finally {
      setSalvando(false);
    }
  }, [aplicarDados, carregar]);

  const removerLancamento = useCallback(async (id) => {
    setSalvando(true);
    setErro(null);

    try {
      const resposta = await deletarLancamentoPote(id);
      if (resposta?.resumo) {
        aplicarDados(resposta.resumo);
      } else {
        await carregar();
      }
      return resposta;
    } catch (error) {
      setErro(error.message || 'Não foi possível excluir o lançamento.');
      throw error;
    } finally {
      setSalvando(false);
    }
  }, [aplicarDados, carregar]);

  return {
    dados,
    pots,
    carregando,
    salvando,
    erro,
    recarregar: carregar,
    adicionarLancamento,
    removerLancamento,
  };
}
