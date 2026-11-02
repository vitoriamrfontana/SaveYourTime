/**
 * SpendingLimitCard - Sprint 4 (Detox de Assinaturas)
 *
 * Quanto da renda vai para assinaturas, comparado à meta que a pessoa escolhe
 * (5% por padrão). O salário vem do Perfil e aqui é só leitura.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { formatarMoeda, formatarNumero } from '../utils/format';
import Chip from './Chip';

const METAS = [3, 5, 8, 10];

export default function SpendingLimitCard({ limite, onAlterarMeta }) {
  if (!limite) return null;

  const { limitePercentual, percentualAtual, gastoMensal, limiteMensal, acimaDoLimite } = limite;
  const proporcao = percentualAtual == null ? 0 : Math.min(1, percentualAtual / limitePercentual);
  let corBarra = colors.success;
  if (acimaDoLimite) corBarra = colors.danger;
  else if (proporcao >= 0.8) corBarra = colors.warning;

  return (
    <View style={styles.box}>
      <Text style={styles.titulo}>Limite de gasto com assinaturas</Text>

      {percentualAtual == null ? (
        <Text style={styles.detalhe}>
          Informe seu salário na aba Perfil para comparar o gasto com assinaturas com a sua renda.
        </Text>
      ) : (
        <>
          <Text style={styles.resumo}>
            {formatarNumero(percentualAtual, 1)}% da sua renda vão para assinaturas (meta:{' '}
            {formatarNumero(limitePercentual, 1)}%).
          </Text>
          <View
            style={styles.trilho}
            accessible
            accessibilityLabel={`${formatarNumero(percentualAtual, 1)} por cento da renda, meta de ${formatarNumero(limitePercentual, 1)} por cento`}
          >
            <View style={[styles.barra, { width: `${proporcao * 100}%`, backgroundColor: corBarra }]} />
          </View>
          <Text style={[styles.detalhe, acimaDoLimite && styles.alerta]}>
            {acimaDoLimite
              ? `Passou da meta em ${formatarMoeda(gastoMensal - limiteMensal)} por mês.`
              : `${formatarMoeda(gastoMensal)} de ${formatarMoeda(limiteMensal)} por mês.`}
          </Text>
        </>
      )}

      <Text style={styles.rotulo}>Meta (% da renda)</Text>
      <View style={styles.chips}>
        {METAS.map((meta) => (
          <Chip
            key={meta}
            label={`${meta}%`}
            ativo={limitePercentual === meta}
            onPress={() => onAlterarMeta(meta)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  resumo: {
    color: colors.textPrimary,
    fontSize: 14,
    marginTop: 6,
  },
  trilho: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginTop: 10,
    overflow: 'hidden',
  },
  barra: {
    height: 8,
    borderRadius: 4,
  },
  detalhe: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  alerta: {
    color: colors.danger,
    fontWeight: '600',
  },
  rotulo: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
