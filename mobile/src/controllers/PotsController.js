import { useCallback, useEffect, useState } from 'react';
import {
  closeMonthlyPots,
  criarLancamentoPote,
  deletarLancamentoPote,
  getMonthlyCloseHistory,
  getPotes,
  rebalancePotsBalances,
} from '../services/api';
import { montarPots } from '../models/Pots';

export function usePotsController() {
  const [dados, setDados] = useState(null);
  const [pots, setPots] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [fechandoMes, setFechandoMes] = useState(false);
  const [reequilibrando, setReequilibrando] = useState(false);
  const [erroFechamento, setErroFechamento] = useState(null);

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

  const carregarHistorico = useCallback(async () => {
    try {
      const lista = await getMonthlyCloseHistory();
      setHistorico(Array.isArray(lista) ? lista : []);
    } catch (error) {
      // O histórico é complementar: falha aqui não deve derrubar a tela de potes.
    }
  }, []);

  useEffect(() => {
    carregar();
    carregarHistorico();
  }, [carregar, carregarHistorico]);

  const fecharMes = useCallback(async (mes) => {
    setFechandoMes(true);
    setErroFechamento(null);

    try {
      const resposta = await closeMonthlyPots(mes);
      if (Array.isArray(resposta?.historico)) setHistorico(resposta.historico);
      await carregar(mes);
      return resposta;
    } catch (error) {
      setErroFechamento(error.message || 'Não foi possível fechar a competência.');
      throw error;
    } finally {
      setFechandoMes(false);
    }
  }, [carregar]);

  const reequilibrar = useCallback(async (dadosReequilibrio) => {
    setReequilibrando(true);
    setErroFechamento(null);

    try {
      const resposta = await rebalancePotsBalances(dadosReequilibrio);
      if (Array.isArray(resposta?.historico)) setHistorico(resposta.historico);
      if (resposta?.resumo) aplicarDados(resposta.resumo);
      return resposta;
    } catch (error) {
      setErroFechamento(error.message || 'Não foi possível reequilibrar as sobras.');
      throw error;
    } finally {
      setReequilibrando(false);
    }
  }, [aplicarDados]);

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
    historico,
    fechandoMes,
    reequilibrando,
    erroFechamento,
    fecharMes,
    reequilibrar,
    adicionarLancamento,
    removerLancamento,
  };
}
