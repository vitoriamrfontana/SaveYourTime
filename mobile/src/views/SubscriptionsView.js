
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSubscriptions, TODAS_CATEGORIAS } from '../hooks/useSubscriptions';
import SubscriptionCard from '../components/SubscriptionCard';
import EconomySummaryCard from '../components/EconomySummaryCard';
import HoursImpactCard from '../components/HoursImpactCard';
import CompoundGrowthPanel from '../components/CompoundGrowthPanel';
import SubscriptionFilters from '../components/SubscriptionFilters';
import AuditHistory from '../components/AuditHistory';
import { colors } from '../theme/colors';

export default function SubscriptionsView() {
  const {
    subscriptionsVisiveis,
    economia,
    insights,
    auditoria,
    categorias,
    categoriaFiltro,
    setCategoriaFiltro,
    ordenacao,
    setOrdenacao,
    loading,
    refreshing,
    error,
    refresh,
    toggle,
  } = useSubscriptions();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // Custo invisível de 5 anos de cada assinatura ativa, indexado pelo id
  const custoEm5AnosPorId = {};
  (insights?.custoInvisivel?.itens ?? []).forEach((item) => {
    const projecao = item.projecoes.find((p) => p.meses === 60);
    if (projecao) custoEm5AnosPorId[item.id] = projecao.valor;
  });

  const cabecalho = (
    <View>
      {error && <Text style={styles.erro}>{error}</Text>}

      <HoursImpactCard horasTrabalho={insights?.horasTrabalho} />

      <EconomySummaryCard
        economiaMensal={economia.economiaMensal}
        economiaAnual={economia.economiaAnual}
      />

      <CompoundGrowthPanel
        projecaoJuros={insights?.projecaoJuros}
        custoInvisivel={insights?.custoInvisivel}
      />

      <Text style={styles.secao}>Suas assinaturas</Text>
      <Text style={styles.subtitulo}>
        Desative o que você não usa mais e veja o impacto no seu orçamento.
      </Text>

      <SubscriptionFilters
        categorias={categorias}
        categoriaFiltro={categoriaFiltro}
        onChangeCategoria={setCategoriaFiltro}
        ordenacao={ordenacao}
        onChangeOrdenacao={setOrdenacao}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={subscriptionsVisiveis}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <SubscriptionCard
            subscription={item}
            onToggle={toggle}
            custoEm5Anos={custoEm5AnosPorId[item.id]}
          />
        )}
        ListHeaderComponent={cabecalho}
        ListFooterComponent={<AuditHistory auditoria={auditoria} />}
        ListEmptyComponent={
          <Text style={styles.vazio}>
            {categoriaFiltro === TODAS_CATEGORIAS
              ? 'Nenhuma assinatura cadastrada ainda.'
              : 'Nenhuma assinatura nesta categoria. Escolha outra categoria acima.'}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
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
  secao: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  erro: {
    color: colors.danger,
    marginBottom: 12,
    fontSize: 13,
  },
  vazio: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
});