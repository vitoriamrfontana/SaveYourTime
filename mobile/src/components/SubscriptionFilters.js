/**
 * SubscriptionFilters - chips de filtro por categoria e de ordenação
 * por valor. O estado fica no hook useSubscriptions; aqui é só visual.
 *
 * Sprint 4: categorias e rótulos vêm da API (/meta) em vez de ficarem
 * repetidos aqui. Também busca por nome, filtro por status e ordenação por
 * custo-benefício e por próxima cobrança.
 */

import React from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { TODAS_CATEGORIAS, TODOS_STATUS, ORDENACOES } from '../hooks/useSubscriptions';
import Chip from './Chip';

const OPCOES_ORDENACAO = [
  { valor: ORDENACOES.PADRAO, label: 'Ordem de cadastro' },
  { valor: ORDENACOES.MAIOR_VALOR, label: 'Maior valor' },
  { valor: ORDENACOES.MENOR_VALOR, label: 'Menor valor' },
  // Sprint 4
  { valor: ORDENACOES.CUSTO_BENEFICIO, label: 'Pior custo-benefício' },
  { valor: ORDENACOES.PROXIMA_COBRANCA, label: 'Próxima cobrança' },
];

export default function SubscriptionFilters({
  categorias,
  categoriaFiltro,
  onChangeCategoria,
  status,
  statusFiltro,
  onChangeStatus,
  busca,
  onChangeBusca,
  ordenacao,
  onChangeOrdenacao,
}) {
  return (
    <View style={styles.container}>
      {/* Sprint 4 */}
      <TextInput
        style={styles.busca}
        value={busca}
        onChangeText={onChangeBusca}
        placeholder="Buscar por nome"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Buscar assinatura por nome"
        returnKeyType="search"
      />

      <Text style={styles.rotulo}>Situação</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.linha}
      >
        <Chip
          label="Todas"
          ativo={statusFiltro === TODOS_STATUS}
          onPress={() => onChangeStatus(TODOS_STATUS)}
        />
        {status.map((opcao) => (
          <Chip
            key={opcao.valor}
            label={opcao.rotulo}
            ativo={statusFiltro === opcao.valor}
            onPress={() => onChangeStatus(opcao.valor)}
          />
        ))}
      </ScrollView>

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
            key={categoria.valor}
            label={categoria.rotulo}
            ativo={categoriaFiltro === categoria.valor}
            onPress={() => onChangeCategoria(categoria.valor)}
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
  // Sprint 4
  busca: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 8,
  },
});
