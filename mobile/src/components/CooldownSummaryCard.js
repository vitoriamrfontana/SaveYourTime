/**
 * CooldownSummaryCard - card de destaque no topo da tela, mostrando quanto
 * dinheiro (e quantas horas de trabalho) a trava de 48h está segurando neste
 * momento, quantos itens estão em risco crítico e o total já poupado.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CooldownSummaryCard({
  totalEmEspera = 0,
  valorRetido = 0,
  horasSuorRetidas = 0,
  riscoCritico = 0,
  economiaTotal = 0,
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>Retido pela trava de 48h</Text>
      <Text style={styles.valor}>{formatarMoeda(valorRetido)}</Text>
      <Text style={styles.detalhe}>
        {totalEmEspera} {totalEmEspera === 1 ? 'desejo em espera' : 'desejos em espera'} ·{' '}
        {horasSuorRetidas}h de trabalho
      </Text>

      <View style={styles.rodape}>
        <View style={styles.indicador}>
          <Text style={[styles.indicadorValor, { color: colors.danger }]}>{riscoCritico}</Text>
          <Text style={styles.indicadorLabel}>em risco crítico</Text>
        </View>
        <View style={styles.divisor} />
        <View style={styles.indicador}>
          <Text style={[styles.indicadorValor, { color: colors.success }]}>
            {formatarMoeda(economiaTotal)}
          </Text>
          <Text style={styles.indicadorLabel}>já poupado por desistências</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  valor: {
    color: colors.warning,
    fontSize: 24,
    fontWeight: 'bold',
  },
  detalhe: {
    color: colors.textPrimary,
    fontSize: 13,
    marginTop: 2,
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  indicador: {
    flex: 1,
  },
  divisor: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  indicadorValor: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  indicadorLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
