/**
 * SubscriptionsView - tela do Detox de Assinaturas. Só JSX: estado e regras
 * ficam no hook useSubscriptions.
 *
 * Sprint 4: se nada carregou (ex.: backend desligado), mostra o erro e um botão
 * "Tentar de novo". Cadastro e edição em formulário, próximas cobranças,
 * checklist de cobranças esquecidas, confirmação antes de cancelar ou pausar e
 * "Desfazer" logo depois.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSubscriptions, TODAS_CATEGORIAS } from '../hooks/useSubscriptions';
import SubscriptionCard from '../components/SubscriptionCard';
import EconomySummaryCard from '../components/EconomySummaryCard';
import HoursImpactCard from '../components/HoursImpactCard';
import CompoundGrowthPanel from '../components/CompoundGrowthPanel';
import SubscriptionFilters from '../components/SubscriptionFilters';
import AuditHistory from '../components/AuditHistory';
import RedundancyAlertCard from '../components/RedundancyAlertCard';
import UsageCheckModal from '../components/UsageCheckModal';
import UpcomingChargesCard from '../components/UpcomingChargesCard';
import SubscriptionFormModal from '../components/SubscriptionFormModal';
import DetoxChecklist from '../components/DetoxChecklist';
import UndoToast from '../components/UndoToast';
import { colors } from '../theme/colors';
import { formatarData, formatarMoeda } from '../utils/format';

export default function SubscriptionsView() {
  const {
    subscriptions,
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
    redundancias,
    checkUsage,
    dadosCarregados,
    tentarDeNovo,
    proximasCobrancas,
    meta,
    rotuloCategoria,
    descricaoTipo,
    fraseCiclo,
    cancelar,
    pausar,
    reativar,
    desfazer,
    desfazerUltima,
    fecharDesfazer,
    salvar,
    excluir,
  } = useSubscriptions();

  // Sprint 3: assinatura aberta no modal de custo por uso (null = modal fechado)
  const [assinaturaEmAuditoria, setAssinaturaEmAuditoria] = useState(null);
  // Sprint 4: formulário aberto ({ assinatura } para editar, { sugestao } vindo do
  // checklist, {} para cadastro em branco) ou null
  const [formulario, setFormulario] = useState(null);
  const [mostrarChecklist, setMostrarChecklist] = useState(false);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!dadosCarregados) {
    return (
      <View style={styles.center}>
        <Text style={styles.falhaTitulo}>Não deu para carregar suas assinaturas</Text>
        <Text style={styles.falhaDetalhe}>{error}</Text>
        <TouchableOpacity style={styles.botao} onPress={tentarDeNovo} accessibilityRole="button">
          <Text style={styles.botaoTexto}>Tentar de novo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Sprint 4: cancelar pede confirmação; reativar não precisa
  const alternar = (assinatura) => {
    if (!assinatura.ativo) {
      reativar(assinatura);
      return;
    }
    const mensagem =
      assinatura.status === 'teste'
        ? `O teste grátis acaba em ${formatarData(assinatura.fimTeste)}. Cancelando agora, a primeira cobrança de ${formatarMoeda(assinatura.valorCobrado)} não acontece.`
        : `Você deixa de pagar ${formatarMoeda(assinatura.valorMensal)} por mês. Dá para desfazer logo depois.`;
    Alert.alert(`Cancelar ${assinatura.nome}?`, mensagem, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar assinatura', style: 'destructive', onPress: () => cancelar(assinatura) },
    ]);
  };

  // Sprint 4: "Pausar" do alerta de concorrentes pausa de verdade, por 1 ou 3 meses
  const pedirPausa = (sugestao) => {
    const assinatura = subscriptions.find((s) => s.id === sugestao.id);
    if (!assinatura) return;
    // Teste grátis não se pausa: cancela-se antes da primeira cobrança
    if (assinatura.status === 'teste') {
      alternar(assinatura);
      return;
    }
    Alert.alert(
      `Pausar ${assinatura.nome}?`,
      'Durante a pausa ela sai dos seus gastos e volta sozinha no fim. Por quanto tempo?',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: '1 mês', onPress: () => pausar(assinatura, 1) },
        { text: '3 meses', onPress: () => pausar(assinatura, 3) },
      ]
    );
  };

  const escolherDoChecklist = (item) => setFormulario({ sugestao: item });

  // Custo invisível de 5 anos de cada assinatura ativa, indexado pelo id
  const custoEm5AnosPorId = {};
  (insights?.custoInvisivel?.itens ?? []).forEach((item) => {
    const projecao = item.projecoes.find((p) => p.meses === 60);
    if (projecao) custoEm5AnosPorId[item.id] = projecao.valor;
  });

  const cabecalho = (
    <View>
      {error && <Text style={styles.erro}>{error}</Text>}

      <UpcomingChargesCard proximas={proximasCobrancas} />

      <RedundancyAlertCard redundancias={redundancias} onPausar={pedirPausa} descricaoTipo={descricaoTipo} />

      <HoursImpactCard horasTrabalho={insights?.horasTrabalho} />

      <EconomySummaryCard
        economiaMensal={economia.economiaMensal}
        economiaAnual={economia.economiaAnual}
        economiaAcumulada={economia.economiaAcumulada}
      />

      <CompoundGrowthPanel
        projecaoJuros={insights?.projecaoJuros}
        custoInvisivel={insights?.custoInvisivel}
      />

      <View style={styles.secaoLinha}>
        <Text style={styles.secao}>Suas assinaturas</Text>
        <TouchableOpacity
          style={styles.botaoAdicionar}
          onPress={() => setFormulario({})}
          accessibilityRole="button"
          accessibilityLabel="Adicionar assinatura"
        >
          <Text style={styles.botaoAdicionarTexto}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitulo}>
        Cancele o que você não usa mais e veja o impacto no seu orçamento.
      </Text>

      {subscriptions.length > 0 && (
        <TouchableOpacity
          onPress={() => setMostrarChecklist((atual) => !atual)}
          accessibilityRole="button"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.link}>
            {mostrarChecklist ? 'Esconder a lista de cobranças esquecidas' : 'Procurar cobranças esquecidas'}
          </Text>
        </TouchableOpacity>
      )}
      {mostrarChecklist && subscriptions.length > 0 && (
        <DetoxChecklist itens={meta?.checklist} onEscolher={escolherDoChecklist} />
      )}

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
            rotuloCategoria={rotuloCategoria(item.categoria)}
            fraseCiclo={fraseCiclo(item.ciclo)}
            onToggle={alternar}
            onEditar={(assinatura) => setFormulario({ assinatura })}
            custoEm5Anos={custoEm5AnosPorId[item.id]}
            onVerificarUso={setAssinaturaEmAuditoria}
          />
        )}
        ListHeaderComponent={cabecalho}
        ListFooterComponent={<AuditHistory auditoria={auditoria} />}
        ListEmptyComponent={
          subscriptions.length === 0 ? (
            // Sprint 4: lista vazia vira o checklist guiado
            <DetoxChecklist itens={meta?.checklist} onEscolher={escolherDoChecklist} />
          ) : (
            <Text style={styles.vazio}>
              {categoriaFiltro === TODAS_CATEGORIAS
                ? 'Nenhuma assinatura cadastrada ainda.'
                : 'Nenhuma assinatura nesta categoria. Escolha outra categoria acima.'}
            </Text>
          )
        }
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
      />

      <UsageCheckModal
        visible={assinaturaEmAuditoria !== null}
        subscription={assinaturaEmAuditoria}
        onFechar={() => setAssinaturaEmAuditoria(null)}
        onCalcular={checkUsage}
      />

      <SubscriptionFormModal
        visible={formulario !== null}
        meta={meta}
        assinatura={formulario?.assinatura ?? null}
        sugestao={formulario?.sugestao ?? null}
        onFechar={() => setFormulario(null)}
        onSalvar={salvar}
        onExcluir={excluir}
      />

      <UndoToast aviso={desfazer} onDesfazer={desfazerUltima} onFechar={fecharDesfazer} />
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
  // Sprint 4
  falhaTitulo: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  falhaDetalhe: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  botao: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  botaoTexto: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  secaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botaoAdicionar: {
    backgroundColor: colors.accentStrong,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  botaoAdicionarTexto: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  link: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
});
