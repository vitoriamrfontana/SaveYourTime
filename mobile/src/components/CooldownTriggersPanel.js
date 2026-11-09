/**
 * CooldownTriggersPanel - auditoria final do Cooldown (Sprint 4): por que o
 * usuário resistiu ou cedeu depois da quarentena.
 *
 *   - badge de Maturidade Comportamental
 *   - gráfico de rosca dos gatilhos emocionais superados (desistências), com
 *     legenda tocável: tocar num gatilho destaca a fatia e mostra o número
 *     dele no centro
 *   - barra da taxa global de conversão x desistência
 *   - leituras automáticas do back-end (gatilho mais vencido, ponto fraco,
 *     efeito do freio de emergência)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { formatarMoeda, formatarNumero } from '../utils/format';
import { corDoGatilho } from '../utils/antirrecaida';
import MaturityBadge from './MaturityBadge';
import TriggerDonutChart from './TriggerDonutChart';

// Desfechos na barra de conversão: estados, então usam as cores de status do app
const SEGMENTOS_CONVERSAO = [
  { campo: 'desistencias', rotulo: 'Desistências', cor: colors.success },
  { campo: 'comprasConscientes', rotulo: 'Compras após a quarentena', cor: colors.textMuted },
  { campo: 'comprasImpulsivas', rotulo: 'Compras por impulso', cor: colors.danger },
];

function plural(quantidade, singular, pluralForma) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralForma}`;
}

function descreverRosca(fatias, total) {
  if (total === 0) return 'Nenhum gatilho emocional superado ainda.';
  const partes = fatias
    .filter((f) => f.quantidade > 0)
    .map((f) => `${f.rotulo}: ${f.quantidade} (${formatarNumero(f.percentual, 0)}%)`);
  return `Gatilhos emocionais superados, ${total} no total. ${partes.join('; ')}.`;
}

function LinhaLegenda({ fatia, ativa, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.legendaLinha, ativa && styles.legendaLinhaAtiva]}
      onPress={onPress}
      disabled={fatia.quantidade === 0}
      accessibilityRole="button"
      accessibilityState={{ selected: ativa }}
    >
      <View style={[styles.amostra, { backgroundColor: corDoGatilho(fatia.chave) }]} />
      <View style={styles.legendaTextos}>
        <Text style={styles.legendaRotulo}>{fatia.rotulo}</Text>
        <Text style={styles.legendaDetalhe}>
          {fatia.quantidade > 0 ? `${formatarMoeda(fatia.valorPoupado)} poupados` : 'nenhuma desistência ainda'}
        </Text>
      </View>
      <Text style={styles.legendaValor}>
        {fatia.quantidade}
        <Text style={styles.legendaPercentual}> · {formatarNumero(fatia.percentual, 0)}%</Text>
      </Text>
    </TouchableOpacity>
  );
}

function BarraConversao({ conversao }) {
  const segmentos = SEGMENTOS_CONVERSAO.map((s) => ({ ...s, valor: conversao[s.campo] ?? 0 }));
  const visiveis = segmentos.filter((s) => s.valor > 0);

  return (
    <>
      <View style={styles.barra}>
        {visiveis.length === 0 ? (
          <View style={[styles.barraSegmento, { flex: 1, backgroundColor: colors.border }]} />
        ) : (
          visiveis.map((s, indice) => (
            <View
              key={s.campo}
              style={[
                styles.barraSegmento,
                { flex: s.valor, backgroundColor: s.cor, marginLeft: indice === 0 ? 0 : 2 },
              ]}
            />
          ))
        )}
      </View>

      {segmentos.map((s) => (
        <View key={s.campo} style={styles.conversaoLinha}>
          <View style={[styles.amostraPequena, { backgroundColor: s.cor }]} />
          <Text style={styles.conversaoRotulo}>{s.rotulo}</Text>
          <Text style={styles.conversaoValor}>{s.valor}</Text>
        </View>
      ))}
    </>
  );
}

export default function CooldownTriggersPanel({ analytics }) {
  const [selecionado, setSelecionado] = useState(null);

  if (!analytics) return null;

  const { superados, conversao, maturidade, insights = [], porGatilho = [] } = analytics;
  const fatias = superados?.fatias ?? [];
  const total = superados?.total ?? 0;
  const fatiaSelecionada = fatias.find((f) => f.chave === selecionado && f.quantidade > 0) ?? null;
  const necessidade = porGatilho.find((g) => !g.emocional) ?? null;

  const alternar = (chave) => setSelecionado((atual) => (atual === chave ? null : chave));

  return (
    <View style={styles.box}>
      <Text style={styles.titulo}>Auditoria final dos gatilhos</Text>
      <Text style={styles.subtitulo}>
        O que levou você a resistir ou a ceder quando a quarentena terminou.
      </Text>

      <MaturityBadge maturidade={maturidade} />

      <View style={styles.cartao}>
        <Text style={styles.cartaoTitulo}>Gatilhos emocionais superados</Text>

        {total === 0 ? (
          <Text style={styles.vazio}>
            Quando você desistir de um desejo marcado com tédio, ansiedade ou promoção relâmpago, ele
            aparece aqui.
          </Text>
        ) : (
          <>
            <View style={styles.roscaArea}>
              <TriggerDonutChart
                fatias={fatias}
                selecionado={fatiaSelecionada?.chave ?? null}
                valorCentro={fatiaSelecionada ? fatiaSelecionada.quantidade : total}
                rotuloCentro={
                  fatiaSelecionada
                    ? `${fatiaSelecionada.rotulo} · ${formatarNumero(fatiaSelecionada.percentual, 0)}%`
                    : total === 1
                      ? 'tentação vencida'
                      : 'tentações vencidas'
                }
                descricaoAcessivel={descreverRosca(fatias, total)}
              />
            </View>

            {fatias.map((fatia) => (
              <LinhaLegenda
                key={fatia.chave}
                fatia={fatia}
                ativa={fatiaSelecionada?.chave === fatia.chave}
                onPress={() => alternar(fatia.chave)}
              />
            ))}

            <Text style={styles.dica}>
              {formatarMoeda(superados.valorPoupado)} poupados vencendo gatilhos emocionais. Toque
              num gatilho para destacá-lo.
            </Text>
          </>
        )}

        {necessidade && necessidade.totalDecisoes > 0 && (
          <View style={styles.necessidade}>
            <View style={[styles.amostraPequena, { backgroundColor: corDoGatilho(necessidade.chave) }]} />
            <Text style={styles.necessidadeTexto}>
              {necessidade.rotulo} (fora da rosca, não é gatilho emocional):{' '}
              {plural(necessidade.comprasConscientes, 'compra consciente', 'compras conscientes')} ·{' '}
              {plural(necessidade.desistencias, 'desistência', 'desistências')}
            </Text>
          </View>
        )}
      </View>

      {conversao && (
        <View style={styles.cartao}>
          <Text style={styles.cartaoTitulo}>Conversão x desistência</Text>
          {conversao.totalDecisoes === 0 ? (
            <Text style={styles.vazio}>Nenhuma quarentena encerrada ainda.</Text>
          ) : (
            <>
              <View style={styles.taxas}>
                <View style={styles.taxa}>
                  <Text style={styles.taxaValor}>{formatarNumero(conversao.taxaDesistencia)}%</Text>
                  <Text style={styles.taxaRotulo}>desistiram</Text>
                </View>
                <View style={styles.taxa}>
                  <Text style={styles.taxaValor}>{formatarNumero(conversao.taxaConversao)}%</Text>
                  <Text style={styles.taxaRotulo}>viraram compra</Text>
                </View>
                <View style={styles.taxa}>
                  <Text style={styles.taxaValor}>{conversao.totalDecisoes}</Text>
                  <Text style={styles.taxaRotulo}>decisões</Text>
                </View>
              </View>
              <BarraConversao conversao={conversao} />
            </>
          )}
        </View>
      )}

      {insights.length > 0 && (
        <View style={styles.insights}>
          {insights.map((texto) => (
            <Text key={texto} style={styles.insight}>
              • {texto}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitulo: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 17,
  },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cartaoTitulo: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  vazio: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  roscaArea: {
    alignItems: 'center',
    marginBottom: 12,
  },
  legendaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  legendaLinhaAtiva: {
    backgroundColor: colors.background,
  },
  amostra: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 10,
  },
  legendaTextos: {
    flex: 1,
  },
  legendaRotulo: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  legendaDetalhe: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  legendaValor: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  legendaPercentual: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'normal',
  },
  dica: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },
  necessidade: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  necessidadeTexto: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  taxas: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  taxa: {
    flex: 1,
  },
  taxaValor: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  taxaRotulo: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  barra: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barraSegmento: {
    height: '100%',
  },
  conversaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  amostraPequena: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 8,
  },
  conversaoRotulo: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
  },
  conversaoValor: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  insights: {
    marginBottom: 4,
  },
  insight: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
});
