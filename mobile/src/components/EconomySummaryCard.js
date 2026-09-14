/**
 * EconomySummaryCard - card de destaque no topo da tela, mostrando
 * a economia mensal e anual acumulada com as assinaturas canceladas.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function EconomySummaryCard({ economiaMensal, economiaAnual }) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>Economia acumulada</Text>
      <Text style={styles.valorMensal}>{formatarMoeda(economiaMensal)}/mês</Text>
      <Text style={styles.valorAnual}>{formatarMoeda(economiaAnual)} por ano</Text>
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
});