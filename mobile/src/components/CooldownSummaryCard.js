/**
 * CooldownSummaryCard - card de destaque no topo da tela, mostrando
 * quanto dinheiro (e quantas horas de trabalho) a trava de 48h está
 * segurando neste momento.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CooldownSummaryCard({ totalEmEspera, valorRetido, horasSuorRetidas }) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>Retido pela trava de 48h</Text>
      <Text style={styles.valor}>{formatarMoeda(valorRetido)}</Text>
      <Text style={styles.detalhe}>
        {totalEmEspera} {totalEmEspera === 1 ? 'desejo em espera' : 'desejos em espera'} ·{' '}
        {horasSuorRetidas}h de trabalho
      </Text>
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
});
