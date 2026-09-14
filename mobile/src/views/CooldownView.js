/**
 * VIEW - Trava Cooldown 48h
 * Integrante 4 - Trava de Compras por Impulso
 *
 * Renderizada dentro da área mainContent do App.js (que já tem seu
 * próprio header/navbar), então esta view não duplica cabeçalho nem
 * SafeAreaView — só o conteúdo da aba.
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useCooldown } from '../hooks/useCooldown';
import CooldownCard from '../components/CooldownCard';
import CooldownSummaryCard from '../components/CooldownSummaryCard';
import { colors } from '../theme/colors';

export default function CooldownView() {
  const { items, resumo, loading, refreshing, error, refresh } = useCooldown();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitulo}>
        Todo desejo espera {resumo.periodoCooldownHoras}h antes de virar compra. Se o impulso
        passar, o dinheiro fica.
      </Text>

      <CooldownSummaryCard
        totalEmEspera={resumo.totalEmEspera}
        valorRetido={resumo.valorRetido}
        horasSuorRetidas={resumo.horasSuorRetidas}
      />

      {error && <Text style={styles.erro}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CooldownCard item={item} periodoCooldownHoras={resumo.periodoCooldownHoras} />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum desejo na trava de reflexão.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  erro: {
    color: colors.danger,
    marginBottom: 12,
    fontSize: 13,
  },
  vazio: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
