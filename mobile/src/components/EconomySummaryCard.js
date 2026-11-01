/**
 * EconomySummaryCard - card de destaque no topo da tela com a economia das
 * assinaturas canceladas.
 *
 * Sprint 4: separa a economia mensal recorrente (o que deixa de sair todo mês)
 * da economia acumulada até hoje (cobranças que de fato deixaram de acontecer).
 * Antes o título dizia "acumulada", mas o valor mostrado era o do mês.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { formatarMoeda } from '../utils/format';

export default function EconomySummaryCard({ economiaMensal, economiaAnual, economiaAcumulada }) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>Economia mensal recorrente</Text>
      <Text style={styles.valorMensal}>{formatarMoeda(economiaMensal)}/mês</Text>
      <Text style={styles.valorAnual}>{formatarMoeda(economiaAnual)} por ano</Text>

      <View style={styles.divisor} />

      <Text style={styles.label}>Economia acumulada até hoje</Text>
      <Text style={styles.valorAcumulado}>{formatarMoeda(economiaAcumulada)}</Text>
      <Text style={styles.detalhe}>Cobranças que deixaram de acontecer desde cada cancelamento.</Text>
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
  valorMensal: {
    color: colors.success,
    fontSize: 24,
    fontWeight: 'bold',
  },
  valorAnual: {
    color: colors.textPrimary,
    fontSize: 13,
    marginTop: 2,
  },
  // Sprint 4
  divisor: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  valorAcumulado: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  detalhe: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
