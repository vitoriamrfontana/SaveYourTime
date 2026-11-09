import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const MEDALHAS = {
  ouro: { icone: '🥇', cor: '#fbbf24', fundo: '#422006' },
  prata: { icone: '🥈', cor: '#cbd5e1', fundo: '#1e293b' },
  bronze: { icone: '🥉', cor: '#f59e0b', fundo: '#431407' },
  nenhuma: { icone: '📉', cor: '#f87171', fundo: '#450a0a' },
};

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const USA_DRIVER_NATIVO = Platform.OS !== 'web';

function dinheiro(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
}

function rotuloMes(mes) {
  if (!mes) return '';
  const [ano, numero] = mes.split('-');
  return `${MESES[Number(numero) - 1] || numero}/${ano}`;
}

function limitarPercentual(valor, maximo = 100) {
  return Math.min(Math.max(Number(valor) || 0, 0), maximo);
}

function textoDesvio(pote) {
  const desvio = pote.desvioPontosPercentuais;
  const sinal = desvio > 0 ? '+' : '';
  return `${sinal}${desvio.toFixed(1).replace('.', ',')} p.p.`;
}

function textoSituacao(pote) {
  if (pote.situacao === 'acima') return 'Acima do teto';
  if (pote.situacao === 'abaixo') return 'Abaixo da meta';
  return 'Dentro da meta';
}

/**
 * Duas barras (Estilo de Vida e Reserva). Ao reequilibrar, a sobra do Estilo
 * de Vida encolhe, a reserva cresce e um chip com o valor "viaja" entre elas.
 */
function BarrasTransferencia({ estilo, reserva, totalTransferido }) {
  const metaEstilo = estilo.metaValor || 1;
  const metaReserva = reserva.metaValor || 1;

  const gastoPct = limitarPercentual((estilo.gasto / metaEstilo) * 100);
  const sobraAlvo = limitarPercentual((estilo.sobra / metaEstilo) * 100, 100 - gastoPct);
  const reservaAlvo = limitarPercentual((reserva.alocado / metaReserva) * 100);

  const sobraAnim = useRef(new Animated.Value(sobraAlvo)).current;
  const reservaAnim = useRef(new Animated.Value(reservaAlvo)).current;
  const vooAnim = useRef(new Animated.Value(0)).current;
  const transferidoAnterior = useRef(totalTransferido);
  const [valorVoo, setValorVoo] = React.useState(0);

  useEffect(() => {
    const config = { duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: false };
    Animated.parallel([
      Animated.timing(sobraAnim, { toValue: sobraAlvo, ...config }),
      Animated.timing(reservaAnim, { toValue: reservaAlvo, ...config }),
    ]).start();
  }, [sobraAlvo, reservaAlvo, sobraAnim, reservaAnim]);

  useEffect(() => {
    const diferenca = Number(totalTransferido) - Number(transferidoAnterior.current);
    transferidoAnterior.current = totalTransferido;
    if (diferenca <= 0) return;

    setValorVoo(diferenca);
    vooAnim.setValue(0);
    Animated.timing(vooAnim, {
      toValue: 1,
      duration: 1100,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: USA_DRIVER_NATIVO,
    }).start();
  }, [totalTransferido, vooAnim]);

  const larguraSobra = sobraAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const larguraReserva = reservaAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const chipTranslateY = vooAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 58] });
  const chipOpacity = vooAnim.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View style={styles.transferencia}>
      <View style={styles.barraLinha}>
        <Text style={styles.barraNome}>Estilo de Vida</Text>
        <Text style={styles.barraValor}>sobra {dinheiro(estilo.sobra)}</Text>
      </View>
      <View style={styles.barraFundo}>
        <View style={[styles.segmento, { width: `${gastoPct}%`, backgroundColor: '#38bdf8' }]} />
        <Animated.View style={[styles.segmento, { width: larguraSobra, backgroundColor: '#fbbf24' }]} />
      </View>

      <View style={[styles.barraLinha, { marginTop: 22 }]}>
        <Text style={styles.barraNome}>Reserva (Dívidas / Invest.)</Text>
        <Text style={styles.barraValor}>{dinheiro(reserva.alocado)} / {dinheiro(reserva.metaValor)}</Text>
      </View>
      <View style={styles.barraFundo}>
        <Animated.View style={[styles.segmento, { width: larguraReserva, backgroundColor: '#22c55e' }]} />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.chipVoo, { opacity: chipOpacity, transform: [{ translateY: chipTranslateY }] }]}
      >
        <Text style={styles.chipVooTexto}>💸 {dinheiro(valorVoo)}</Text>
      </Animated.View>

      <Text style={styles.legenda}>Azul: gasto · Amarelo: sobra transferível · Verde: reserva</Text>
    </View>
  );
}

export default function MonthlyCloseCard({
  mes,
  fechamento,
  historico = [],
  fechando,
  reequilibrando,
  erro,
  onFechar,
  onReequilibrar,
}) {
  const medalha = fechamento ? (MEDALHAS[fechamento.medalha.nivel] || MEDALHAS.nenhuma) : null;
  const estilo = fechamento?.potes.find((pote) => pote.chave === 'estiloVida');
  const reserva = fechamento?.potes.find((pote) => pote.chave === 'dividas');
  const sobraTransferivel = fechamento?.sugestaoReequilibrio?.valor || 0;
  const mesesAnteriores = historico.filter((item) => item.mes !== mes);

  return (
    <View style={styles.card}>
      <View style={styles.cabecalho}>
        <View style={styles.cabecalhoTexto}>
          <Text style={styles.titulo}>📅 Fechamento do mês</Text>
          <Text style={styles.subtitulo}>
            {rotuloMes(mes)}{fechamento?.parcial ? ' · mês ainda em andamento' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.botaoFechar, fechando && styles.desabilitado]}
          onPress={onFechar}
          disabled={fechando}
        >
          {fechando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.botaoFecharTexto}>{fechamento ? 'Atualizar' : 'Fechar mês'}</Text>}
        </TouchableOpacity>
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      {!fechamento ? (
        <Text style={styles.vazio}>
          Feche a competência para ver se você cumpriu a regra 50-30-20 neste mês.
        </Text>
      ) : (
        <>
          <View style={[styles.medalha, { backgroundColor: medalha.fundo, borderColor: medalha.cor }]}>
            <Text style={styles.medalhaIcone}>{medalha.icone}</Text>
            <View style={styles.medalhaTexto}>
              <Text style={[styles.medalhaTitulo, { color: medalha.cor }]}>{fechamento.medalha.titulo}</Text>
              <Text style={styles.medalhaMensagem}>{fechamento.medalha.mensagem}</Text>
              <Text style={styles.medalhaMeta}>
                {fechamento.conformes}/{fechamento.totalPotes} potes na regra · aderência {fechamento.aderencia.toFixed(0)}%
              </Text>
            </View>
          </View>

          {fechamento.potes.map((pote) => (
            <View key={pote.chave} style={styles.poteLinha}>
              <View style={styles.poteInfo}>
                <Text style={styles.poteNome}>{pote.nome}</Text>
                <Text style={styles.poteDetalhe}>
                  {pote.realPercentual.toFixed(1).replace('.', ',')}% do salário · meta {pote.tipoMeta === 'teto' ? '≤' : '≥'} {pote.metaPercentual}%
                </Text>
              </View>
              <View style={styles.poteStatus}>
                <Text style={[styles.poteDesvio, { color: pote.conforme ? '#22c55e' : '#f87171' }]}>
                  {textoDesvio(pote)}
                </Text>
                <Text style={styles.poteSituacao}>{textoSituacao(pote)}</Text>
              </View>
            </View>
          ))}

          {estilo && reserva ? (
            <BarrasTransferencia
              estilo={estilo}
              reserva={reserva}
              totalTransferido={fechamento.totalTransferido}
            />
          ) : null}

          <TouchableOpacity
            style={[styles.botaoReequilibrar, (reequilibrando || sobraTransferivel <= 0) && styles.desabilitado]}
            onPress={onReequilibrar}
            disabled={reequilibrando || sobraTransferivel <= 0}
          >
            {reequilibrando
              ? <ActivityIndicator color="#fff" />
              : (
                <Text style={styles.botaoReequilibrarTexto}>
                  {sobraTransferivel > 0
                    ? `Reequilibrar Sobras · ${dinheiro(sobraTransferivel)} → Reserva`
                    : 'Sem sobras para reequilibrar'}
                </Text>
              )}
          </TouchableOpacity>

          {fechamento.totalTransferido > 0 ? (
            <Text style={styles.transferido}>
              Já transferido para a reserva neste mês: {dinheiro(fechamento.totalTransferido)}
            </Text>
          ) : null}
        </>
      )}

      <Text style={styles.historicoTitulo}>Meses anteriores</Text>
      {!mesesAnteriores.length ? (
        <Text style={styles.vazio}>Nenhum fechamento anterior.</Text>
      ) : (
        mesesAnteriores.map((item) => {
          const m = MEDALHAS[item.medalha.nivel] || MEDALHAS.nenhuma;
          return (
            <View key={item.mes} style={styles.historicoLinha}>
              <Text style={styles.historicoIcone}>{m.icone}</Text>
              <View style={styles.historicoInfo}>
                <Text style={styles.historicoMes}>{rotuloMes(item.mes)}</Text>
                <Text style={styles.historicoDetalhe}>
                  {item.conformes}/{item.totalPotes} potes · aderência {item.aderencia.toFixed(0)}%
                </Text>
              </View>
              <Text style={styles.historicoTransferido}>
                {item.totalTransferido > 0 ? `+${dinheiro(item.totalTransferido)} reserva` : '—'}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155', marginTop: 4, marginBottom: 14 },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cabecalhoTexto: { flex: 1 },
  titulo: { color: '#f8fafc', fontSize: 19, fontWeight: '900' },
  subtitulo: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  botaoFechar: { backgroundColor: '#0284c7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, minWidth: 84, alignItems: 'center' },
  botaoFecharTexto: { color: '#fff', fontWeight: '800', fontSize: 12 },
  desabilitado: { opacity: 0.55 },
  erro: { color: '#f87171', fontSize: 11, marginTop: 10 },
  vazio: { color: '#64748b', fontSize: 12, paddingVertical: 12 },
  medalha: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 13, marginTop: 14, marginBottom: 6 },
  medalhaIcone: { fontSize: 38 },
  medalhaTexto: { flex: 1 },
  medalhaTitulo: { fontSize: 14, fontWeight: '900' },
  medalhaMensagem: { color: '#f8fafc', fontSize: 13, fontWeight: '700', marginTop: 3, lineHeight: 18 },
  medalhaMeta: { color: '#cbd5e1', fontSize: 10, marginTop: 5 },
  poteLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#1e293b', paddingVertical: 10 },
  poteInfo: { flex: 1 },
  poteNome: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  poteDetalhe: { color: '#64748b', fontSize: 10, marginTop: 3 },
  poteStatus: { alignItems: 'flex-end' },
  poteDesvio: { fontSize: 13, fontWeight: '900' },
  poteSituacao: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  transferencia: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1e293b' },
  barraLinha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  barraNome: { color: '#e2e8f0', fontSize: 11, fontWeight: '700', flex: 1 },
  barraValor: { color: '#94a3b8', fontSize: 10 },
  barraFundo: { height: 12, backgroundColor: '#1e293b', borderRadius: 6, overflow: 'hidden', flexDirection: 'row' },
  segmento: { height: '100%' },
  chipVoo: { position: 'absolute', right: 0, top: 18, backgroundColor: '#fbbf24', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  chipVooTexto: { color: '#422006', fontSize: 11, fontWeight: '900' },
  legenda: { color: '#64748b', fontSize: 10, marginTop: 8 },
  botaoReequilibrar: { backgroundColor: '#16a34a', borderRadius: 11, paddingVertical: 13, paddingHorizontal: 10, alignItems: 'center', marginTop: 14 },
  botaoReequilibrarTexto: { color: '#fff', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  transferido: { color: '#22c55e', fontSize: 11, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  historicoTitulo: { color: '#f8fafc', fontSize: 14, fontWeight: '800', marginTop: 18, marginBottom: 4 },
  historicoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#1e293b', paddingVertical: 10 },
  historicoIcone: { fontSize: 22 },
  historicoInfo: { flex: 1 },
  historicoMes: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  historicoDetalhe: { color: '#64748b', fontSize: 10, marginTop: 2 },
  historicoTransferido: { color: '#22c55e', fontSize: 10, fontWeight: '700' },
});
