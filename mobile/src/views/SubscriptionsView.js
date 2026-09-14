/**
 * VIEW - Detox de Assinaturas
- Detox de Assinaturas
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
import { useSubscriptions } from '../hooks/useSubscriptions';
import SubscriptionCard from '../components/SubscriptionCard';
import EconomySummaryCard from '../components/EconomySummaryCard';
import { colors } from '../theme/colors';

export default function SubscriptionsView() {
  const { subscriptions, economia, loading, refreshing, error, refresh, toggle } =
    useSubscriptions();

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
        Desative o que você não usa mais e veja o impacto no seu orçamento.
      </Text>

      <EconomySummaryCard
        economiaMensal={economia.economiaMensal}
        economiaAnual={economia.economiaAnual}
      />

      {error && <Text style={styles.erro}>{error}</Text>}

      <FlatList
        data={subscriptions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <SubscriptionCard subscription={item} onToggle={toggle} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhuma assinatura cadastrada ainda.</Text>
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