import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { labelCategoria } from './SubscriptionFilters';

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SubscriptionCard({ subscription, onToggle, custoEm5Anos }) {
  const { id, nome, valorMensal, ativo, categoria } = subscription;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={[styles.nome, !ativo && styles.nomeCancelado]}>{nome}</Text>
        <Text style={styles.categoria}>{labelCategoria(categoria)}</Text>
        <Text style={styles.valor}>{formatarMoeda(valorMensal)}/mês</Text>
        {ativo && custoEm5Anos != null && (
          <Text style={styles.custoInvisivel}>{formatarMoeda(custoEm5Anos)} em 5 anos</Text>
        )}
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
  categoria: {
    color: colors.accent,
    fontSize: 12,
    marginTop: 2,
  },
  valor: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  custoInvisivel: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 2,
  },
});