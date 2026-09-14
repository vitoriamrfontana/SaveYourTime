import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SubscriptionCard({ subscription, onToggle }) {
  const { id, nome, valorMensal, ativo } = subscription;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={[styles.nome, !ativo && styles.nomeCancelado]}>{nome}</Text>
        <Text style={styles.valor}>{formatarMoeda(valorMensal)}/mês</Text>
      </View>
      <Switch
        value={ativo}
        onValueChange={() => onToggle(id)}
        trackColor={{ false: colors.border, true: colors.success }}
        thumbColor={ativo ? colors.textPrimary : colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  nome: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  nomeCancelado: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  valor: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});