/**
 * useCooldown - concentra estado e lógica do módulo de Trava Cooldown 48h.
 * A view fica só com JSX; o carregamento dos dados vive aqui.
 *
 * Sprint 2: fala com o motor preditivo do back-end (score de impulso, fases
 * temporais e auditoria de desfecho), mantém um "tique" de 1s para o
 * cronômetro regressivo e expõe as ações de escrita (novo desejo,
 * questionário reflexivo e encerramento da quarentena).
 *
 * Sprint 3: quarentenas proporcionais (48h / 7 dias / 30 dias) e o streak
 * de disciplina (dias seguidos sem compra por impulso).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiService } from '../services/api';

const MS_POR_HORA = 60 * 60 * 1000;

export const DESFECHOS = { DESISTIU: 'desistiu', COMPROU: 'comprou' };

export const STATUS = { EM_ESPERA: 'em_espera', LIBERADO: 'liberado' };

const RESUMO_INICIAL = {
  totalEmEspera: 0,
  totalLiberados: 0,
  valorRetido: 0,
  horasSuorRetidas: 0,
  riscoCritico: 0,
  economiaTotal: 0,
  horasPoupadas: 0,
  periodoCooldownHoras: 48,
  marcosHoras: [12, 24, 48],
  porPeriodo: {},
};

const STREAK_INICIAL = {
  diasSeguidos: 0,
  recorde: 0,
  totalComprasImpulsivas: 0,
  ultimaCompraImpulsiva: null,
  proximaMeta: null,
  mensagem: '',
};

/**
 * Mesma regra do back-end (cooldownModel.sugerirPeriodo), aplicada no cliente
 * para o seletor reagir enquanto o usuário digita o preço. `periodos` vem da
 * API ordenado do mais longo para o mais curto.
 */
export function sugerirPeriodo(preco, salario, periodos = []) {
  const valor = Number(preco);
  const renda = Number(salario);
  const padrao = periodos.find((p) => p.percentualRendaAcimaDe === 0) ?? null;

  if (!(valor > 0) || !(renda > 0)) return padrao;

  const percentual = (valor / renda) * 100;
  return periodos.find((p) => percentual > p.percentualRendaAcimaDe) ?? padrao;
}

const AUDITORIA_INICIAL = {
  registros: [],
  totalDecisoes: 0,
  totalDesistencias: 0,
  totalCompras: 0,
  economiaTotal: 0,
  horasPoupadas: 0,
  valorGasto: 0,
  taxaDesistencia: 0,
};

/**
 * Recalcula o tempo restante no cliente, a cada segundo, a partir do liberaEm
 * que o back-end mandou. Evita depender de novas requisições para o
 * cronômetro andar na tela.
 */
function comTempoReal(item, agora) {
  const liberaEm = new Date(item.liberaEm).getTime();
  const criadoEm = new Date(item.criadoEm).getTime();
  const msRestantes = Math.max(liberaEm - agora, 0);
  // Cada desejo tem o próprio período (48h, 7 dias ou 30 dias)
  const periodoMs = (item.tempo?.periodoCooldownHoras ?? 48) * MS_POR_HORA;

  return {
    ...item,
    tempoReal: {
      segundosRestantes: Math.ceil(msRestantes / 1000),
      progresso: periodoMs > 0 ? Math.min(Math.max((agora - criadoEm) / periodoMs, 0), 1) : 1,
      liberado: msRestantes === 0,
    },
  };
}

export function useCooldown() {
  const [items, setItems] = useState([]);
  const [resumo, setResumo] = useState(RESUMO_INICIAL);
  const [auditoria, setAuditoria] = useState(AUDITORIA_INICIAL);
  const [categorias, setCategorias] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [streak, setStreak] = useState(STREAK_INICIAL);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState(null);
  const [agora, setAgora] = useState(() => Date.now());

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setError(null);
      const [dados, dadosAuditoria, dadosPerfil, dadosStreak] = await Promise.all([
        ApiService.getCooldownItems(),
        ApiService.getCooldownAudit(),
        ApiService.getUserProfile(),
        ApiService.getDisciplineStreak(),
      ]);

      // Blinda contra payload fora do formato esperado (ex.: uma versão
      // antiga da API ainda no ar, respondendo [] em vez de { items, resumo }).
      setItems(Array.isArray(dados?.items) ? dados.items : []);
      setResumo({ ...RESUMO_INICIAL, ...(dados?.resumo ?? {}) });
      setCategorias(Array.isArray(dados?.categorias) ? dados.categorias : []);
      setPeriodos(Array.isArray(dados?.periodos) ? dados.periodos : []);
      setStreak({ ...STREAK_INICIAL, ...(dadosStreak ?? {}) });
      setAuditoria({ ...AUDITORIA_INICIAL, ...(dadosAuditoria ?? {}) });
      setPerfil(dadosPerfil ?? null);
      setAgora(Date.now());
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

  // Cronômetro: só roda enquanto existe algum desejo ainda em contagem
  const temContagemAtiva = items.some((i) => i.status === STATUS.EM_ESPERA);

  useEffect(() => {
    if (!temContagemAtiva) return undefined;

    const intervalo = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, [temContagemAtiva]);

  const itens = useMemo(
    () => items.map((item) => comTempoReal(item, agora)),
    [items, agora]
  );

  // Quando um cronômetro zera na tela, busca o estado real (status e resumo
  // passam a contar aquele desejo como liberado).
  const liberadosNaTela = itens.filter((i) => i.tempoReal.liberado).length;
  const ultimoSincronizado = useRef(null);

  useEffect(() => {
    if (loading) return;
    if (ultimoSincronizado.current === null) {
      ultimoSincronizado.current = liberadosNaTela;
      return;
    }
    if (liberadosNaTela !== ultimoSincronizado.current) {
      ultimoSincronizado.current = liberadosNaTela;
      fetchData({ silent: true });
    }
  }, [liberadosNaTela, loading, fetchData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchData({ silent: true });
  }, [fetchData]);

  // Envolve as ações de escrita: liga/desliga o "salvando", propaga o erro
  // para a tela e ressincroniza os números do servidor no sucesso.
  const executarAcao = useCallback(
    async (acao) => {
      setSalvando(true);
      setError(null);
      try {
        const resposta = await acao();
        await fetchData({ silent: true });
        return { success: true, ...(resposta ?? {}) };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setSalvando(false);
      }
    },
    [fetchData]
  );

  // Sempre pela rota estendida: o back-end valida o período mínimo pelo valor
  const adicionarDesejo = useCallback(
    ({ item, preco, categoria, quiz, periodo }) =>
      executarAcao(() =>
        ApiService.createExtendedCooldown({ item, preco: Number(preco), categoria, quiz, periodo })
      ),
    [executarAcao]
  );

  const responderQuiz = useCallback(
    (id, respostas) => executarAcao(() => ApiService.answerCooldownQuiz(id, respostas)),
    [executarAcao]
  );

  /** Auditoria de desfecho: 'desistiu' devolve o dinheiro à economia, 'comprou' não. */
  const registrarDesfecho = useCallback(
    (id, tipo) =>
      executarAcao(() =>
        tipo === DESFECHOS.DESISTIU
          ? ApiService.giveUpCooldownItem(id)
          : ApiService.buyCooldownItem(id)
      ),
    [executarAcao]
  );

  return {
    items: itens,
    resumo,
    auditoria,
    categorias,
    periodos,
    streak,
    perfil,
    loading,
    refreshing,
    salvando,
    error,
    refresh,
    adicionarDesejo,
    responderQuiz,
    registrarDesfecho,
  };
}
