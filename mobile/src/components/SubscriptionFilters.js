/**
 * SubscriptionFilters - chips de filtro por categoria e de ordenação
 * por valor. O estado fica no hook useSubscriptions; aqui é só visual.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { TODAS_CATEGORIAS, ORDENACOES } from '../hooks/useSubscriptions';

const LABELS_CATEGORIA = {
  streaming: 'Streaming',
  saude: 'Saúde',
  financeiro: 'Financeiro',
  software: 'Software',
  outros: 'Outros',
};

export function labelCategoria(categoria) {
  return LABELS_CATEGORIA[categoria] || 'Outros';
}

const OPCOES_ORDENACAO = [
  { valor: ORDENACOES.PADRAO, label: 'Ordem de cadastro' },
  { valor: ORDENACOES.MAIOR_VALOR, label: 'Maior valor' },
  { valor: ORDENACOES.MENOR_VALOR, label: 'Menor valor' },
];

function Chip({ label, ativo, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, ativo && styles.chipAtivo]}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
    >
      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SubscriptionFilters({
  categorias,
  categoriaFiltro,
  onChangeCategoria,
  ordenacao,
  onChangeOrdenacao,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.rotulo}>Categoria</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.linha}
      >
        <Chip
          label="Todas"
          ativo={categoriaFiltro === TODAS_CATEGORIAS}
          onPress={() => onChangeCategoria(TODAS_CATEGORIAS)}
        />
        {categorias.map((categoria) => (
          <Chip
            key={categoria}
            label={labelCategoria(categoria)}
            ativo={categoriaFiltro === categoria}
            onPress={() => onChangeCategoria(categoria)}
          />
        ))}
      </ScrollView>

      <Text style={styles.rotulo}>Ordenar por</Text>
      <View style={[styles.linha, styles.linhaQuebra]}>
        {OPCOES_ORDENACAO.map((opcao) => (
          <Chip
            key={opcao.valor}
            label={opcao.label}
            ativo={ordenacao === opcao.valor}
            onPress={() => onChangeOrdenacao(opcao.valor)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  rotulo: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
    marginTop: 4,
  },
  linha: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 6,
  },
  linhaQuebra: {
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipAtivo: {
    backgroundColor: colors.accentStrong,
    borderColor: colors.accent,
  },
  chipTexto: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chipTextoAtivo: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});