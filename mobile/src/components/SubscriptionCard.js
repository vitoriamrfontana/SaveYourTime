import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { labelCategoria } from './SubscriptionFilters';
import { CostBenefitBadge } from './UsageCheckModal';

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SubscriptionCard({ subscription, onToggle, custoEm5Anos, onVerificarUso }) {
  const { id, nome, valorMensal, ativo, categoria, usoMensal } = subscription;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={[styles.nome, !ativo && styles.nomeCancelado]}>{nome}</Text>
        <Text style={styles.categoria}>{labelCategoria(categoria)}</Text>
        <Text style={styles.valor}>{formatarMoeda(valorMensal)}/mês</Text>
        {ativo && custoEm5Anos != null && (
          <Text style={styles.custoInvisivel}>{formatarMoeda(custoEm5Anos)} em 5 anos</Text>
        )}

        {/* Sprint 3: selo de custo-benefício e calculadora de custo por uso */}
        {ativo && onVerificarUso && (
          <View style={styles.uso}>
            {usoMensal && (
              <>
                <CostBenefitBadge classificacao={usoMensal.classificacao} />
                <Text style={styles.custoPorUso}>
                  {usoMensal.custoPorUso === null
                    ? 'sem uso no mês'
                    : `${formatarMoeda(usoMensal.custoPorUso)} por uso`}
                </Text>
              </>
            )}
            <TouchableOpacity
              onPress={() => onVerificarUso(subscription)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
            >
              <Text style={styles.verificarUso}>
                {usoMensal ? 'Verificar de novo' : 'Verificar uso'}
              </Text>
            </TouchableOpacity>
          </View>
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
  // Sprint 3
  uso: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 8,
  },
  custoPorUso: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
    marginRight: 12,
  },
  verificarUso: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});