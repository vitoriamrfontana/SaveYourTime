/**
 * CooldownOutcomeModal - modal de encerramento da quarentena.
 *
 * Duas etapas: primeiro a decisão ("desisti" x "comprei") e depois o feedback
 * visual, que soma a economia gerada quando o usuário desiste da compra.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';

const NIVEL_CORES = {
  Baixo: colors.success,
  Médio: colors.warning,
  Crítico: colors.danger,
};

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CooldownOutcomeModal({
  visible,
  item,
  resultado = null,
  salvando = false,
  erro = null,
  onDesisti,
  onComprei,
  onFechar,
}) {
  if (!item) return null;

  const desfecho = resultado?.item?.desfecho ?? null;
  const desistiu = desfecho?.tipo === 'desistiu';
  const liberado = item.tempoReal?.liberado ?? item.tempo.concluido;
  const corRisco = NIVEL_CORES[item.risco.nivel] ?? colors.textSecondary;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onFechar}>
      <View style={styles.fundo}>
        <View style={styles.painel}>
          {desfecho ? (
            // ---------- Etapa 2: feedback do desfecho ----------
            <View style={styles.centralizado}>
              <Text style={[styles.icone, { color: desistiu ? colors.success : colors.warning }]}>
                {desistiu ? '✓' : '•'}
              </Text>
              <Text style={styles.tituloFeedback}>
                {desistiu ? 'Impulso vencido!' : 'Compra registrada'}
              </Text>

              {desistiu ? (
                <>
                  <Text style={styles.label}>Você poupou</Text>
                  <Text style={styles.valorPoupado}>{formatarMoeda(desfecho.valorPoupado)}</Text>
                  <Text style={styles.detalhe}>
                    {desfecho.horasPoupadas}h de trabalho que continuam sendo suas.
                  </Text>
                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Economia total da trava de 48h</Text>
                    <Text style={styles.totalValor}>
                      {formatarMoeda(resultado?.resumo?.economiaTotal)}
                    </Text>
                    <Text style={styles.totalDetalhe}>
                      {resultado?.auditoria?.totalDesistencias ?? 0} compras canceladas ·{' '}
                      {resultado?.resumo?.horasPoupadas ?? 0}h recuperadas
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.detalhe}>
                    "{item.item}" saiu da quarentena como compra realizada, custando{' '}
                    {formatarMoeda(item.preco)} ({item.horasSuor}h de trabalho).
                  </Text>
                  <Text style={styles.detalheSecundario}>
                    {desfecho.concluiuCooldown
                      ? 'Pelo menos foi uma decisão tomada depois das 48h de reflexão.'
                      : `Decidida ainda na fase "${desfecho.faseNoDesfecho}", antes de completar as 48h.`}
                  </Text>
                </>
              )}

              <TouchableOpacity style={styles.botaoFechar} onPress={onFechar}>
                <Text style={styles.botaoFecharTexto}>Fechar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // ---------- Etapa 1: decisão ----------
            <>
              <Text style={styles.titulo}>Como terminou?</Text>
              <Text style={styles.item} numberOfLines={2}>
                {item.item}
              </Text>

              <View style={styles.resumoBox}>
                <Text style={styles.resumoLinha}>{formatarMoeda(item.preco)}</Text>
                <Text style={styles.resumoDetalhe}>
                  {item.horasSuor}h de trabalho ·{' '}
                  <Text style={{ color: corRisco }}>
                    risco {item.risco.nivel} ({item.risco.score}/100)
                  </Text>
                </Text>
              </View>

              {!liberado && (
                <Text style={styles.aviso}>
                  A reflexão de 48h ainda não terminou. Desistir agora já conta como economia.
                </Text>
              )}

              {erro && <Text style={styles.erro}>{erro}</Text>}

              {salvando ? (
                <ActivityIndicator style={styles.carregando} color={colors.accent} />
              ) : (
                <>
                  <TouchableOpacity style={styles.botaoDesisti} onPress={onDesisti}>
                    <Text style={styles.botaoDesistiTexto}>Desisti da compra</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.botaoComprei} onPress={onComprei}>
                    <Text style={styles.botaoCompreiTexto}>Comprei mesmo assim</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.botaoVoltar} onPress={onFechar}>
                    <Text style={styles.botaoVoltarTexto}>Continuar refletindo</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  painel: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  centralizado: {
    alignItems: 'center',
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  item: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  resumoBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resumoLinha: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  resumoDetalhe: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  aviso: {
    color: colors.warning,
    fontSize: 12,
    marginTop: 12,
    lineHeight: 17,
  },
  erro: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
  },
  carregando: {
    marginTop: 20,
    marginBottom: 8,
  },
  botaoDesisti: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  botaoDesistiTexto: {
    color: colors.background,
    fontSize: 15,
    fontWeight: 'bold',
  },
  botaoComprei: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  botaoCompreiTexto: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  botaoVoltar: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoVoltarTexto: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  icone: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  tituloFeedback: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valorPoupado: {
    color: colors.success,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 2,
  },
  detalhe: {
    color: colors.textPrimary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  detalheSecundario: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  totalBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    alignItems: 'center',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  totalValor: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  totalDetalhe: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  botaoFechar: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 20,
  },
  botaoFecharTexto: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
