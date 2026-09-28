/**
 * VIEW - Trava Cooldown 48h
 * Integrante 4 - Trava de Compras por Impulso
 *
 * Renderizada dentro da área mainContent do App.js (que já tem seu
 * próprio header/navbar), então esta view não duplica cabeçalho nem
 * SafeAreaView — só o conteúdo da aba.
 *
 * Sprint 2: consome o motor preditivo do back-end (score de impulso, fases
 * temporais e auditoria), com cronômetro ao vivo, modal de novo desejo e
 * modal de encerramento da quarentena.
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
} from 'react-native';
import { useCooldown, DESFECHOS } from '../hooks/useCooldown';
import CooldownCard from '../components/CooldownCard';
import CooldownSummaryCard from '../components/CooldownSummaryCard';
import CooldownWishModal from '../components/CooldownWishModal';
import CooldownOutcomeModal from '../components/CooldownOutcomeModal';
import CooldownAuditPanel from '../components/CooldownAuditPanel';
import { colors } from '../theme/colors';

const MODAL_FECHADO = { visible: false, modo: 'novo', item: null };

export default function CooldownView() {
  const {
    items,
    resumo,
    auditoria,
    categorias,
    perfil,
    loading,
    refreshing,
    salvando,
    error,
    refresh,
    adicionarDesejo,
    responderQuiz,
    registrarDesfecho,
  } = useCooldown();

  const [modalDesejo, setModalDesejo] = useState(MODAL_FECHADO);
  const [itemEncerrando, setItemEncerrando] = useState(null);
  const [resultadoDesfecho, setResultadoDesfecho] = useState(null);
  const [erroAcao, setErroAcao] = useState(null);

  const abrirNovoDesejo = () => {
    setErroAcao(null);
    setModalDesejo({ visible: true, modo: 'novo', item: null });
  };

  const abrirQuiz = (item) => {
    setErroAcao(null);
    setModalDesejo({ visible: true, modo: 'quiz', item });
  };

  const fecharModalDesejo = () => {
    setErroAcao(null);
    setModalDesejo(MODAL_FECHADO);
  };

  const salvarDesejo = async (dados) => {
    const resultado =
      modalDesejo.modo === 'quiz'
        ? await responderQuiz(modalDesejo.item.id, dados.quiz)
        : await adicionarDesejo(dados);

    if (resultado.success) fecharModalDesejo();
    else setErroAcao(resultado.error);
  };

  const abrirEncerramento = (item) => {
    setErroAcao(null);
    setResultadoDesfecho(null);
    setItemEncerrando(item);
  };

  const fecharEncerramento = () => {
    setErroAcao(null);
    setResultadoDesfecho(null);
    setItemEncerrando(null);
  };

  // Registra o desfecho e mantém o modal aberto para mostrar o feedback
  const confirmarDesfecho = async (tipo) => {
    const resultado = await registrarDesfecho(itemEncerrando.id, tipo);

    if (resultado.success) setResultadoDesfecho(resultado);
    else setErroAcao(resultado.error);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const cabecalho = (
    <View>
      <Text style={styles.subtitulo}>
        Todo desejo espera {resumo.periodoCooldownHoras}h antes de virar compra. Se o impulso
        passar, o dinheiro fica.
      </Text>

      <CooldownSummaryCard
        totalEmEspera={resumo.totalEmEspera}
        valorRetido={resumo.valorRetido}
        horasSuorRetidas={resumo.horasSuorRetidas}
        riscoCritico={resumo.riscoCritico}
        economiaTotal={resumo.economiaTotal}
      />

      <TouchableOpacity style={styles.botaoNovo} onPress={abrirNovoDesejo}>
        <Text style={styles.botaoNovoTexto}>+ Colocar um desejo na trava</Text>
      </TouchableOpacity>

      {error && <Text style={styles.erro}>{error}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CooldownCard item={item} onEncerrar={abrirEncerramento} onResponderQuiz={abrirQuiz} />
        )}
        ListHeaderComponent={cabecalho}
        ListFooterComponent={<CooldownAuditPanel auditoria={auditoria} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <Text style={styles.vazio}>
            Nenhum desejo na trava de reflexão. Quando bater a vontade de comprar algo, coloque aqui
            primeiro.
          </Text>
        }
      />

      <CooldownWishModal
        visible={modalDesejo.visible}
        modo={modalDesejo.modo}
        item={modalDesejo.item}
        categorias={categorias}
        valorHora={perfil?.valorHora}
        salvando={salvando}
        erro={erroAcao}
        onFechar={fecharModalDesejo}
        onSalvar={salvarDesejo}
      />

      <CooldownOutcomeModal
        visible={Boolean(itemEncerrando)}
        item={itemEncerrando}
        resultado={resultadoDesfecho}
        salvando={salvando}
        erro={erroAcao}
        onDesisti={() => confirmarDesfecho(DESFECHOS.DESISTIU)}
        onComprei={() => confirmarDesfecho(DESFECHOS.COMPROU)}
        onFechar={fecharEncerramento}
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
  botaoNovo: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoNovoTexto: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
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
    lineHeight: 20,
  },
});
