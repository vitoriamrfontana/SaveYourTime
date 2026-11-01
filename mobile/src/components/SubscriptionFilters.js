/**
 * SubscriptionFilters - chips de filtro por categoria e de ordenação
 * por valor. O estado fica no hook useSubscriptions; aqui é só visual.
 *
 * Sprint 4: categorias e rótulos vêm da API (/meta) em vez de ficarem
 * repetidos aqui.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { TODAS_CATEGORIAS, ORDENACOES } from '../hooks/useSubscriptions';
import Chip from './Chip';

const OPCOES_ORDENACAO = [
  { valor: ORDENACOES.PADRAO, label: 'Ordem de cadastro' },
  { valor: ORDENACOES.MAIOR_VALOR, label: 'Maior valor' },
  { valor: ORDENACOES.MENOR_VALOR, label: 'Menor valor' },
];

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
});
