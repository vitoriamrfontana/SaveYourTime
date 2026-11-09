/**
 * TriggerDonutChart - gráfico de rosca dos gatilhos emocionais superados.
 *
 * Feito só com View (o projeto não usa react-native-svg): cada arco de até
 * 180° é um meio disco girado dentro de uma janela que mostra só a metade
 * direita, e a janela inteira gira até o ângulo de início do arco. Um furo
 * na cor da superfície transforma o disco em rosca.
 *
 * As fatias são separadas por um respiro de 2px na cor da superfície, e o
 * valor de cada uma fica na legenda (fora daqui), então a identidade nunca
 * depende só da cor.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { corDoGatilho, montarArcosRosca } from '../utils/antirrecaida';

const OPACIDADE_ATENUADA = 0.3;

/** Arco de `varredura` graus (<= 180), começando em `inicio` (0 = topo, sentido horário). */
function Arco({ inicio, varredura, cor, tamanho, opacidade }) {
  const metade = tamanho / 2;

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity: opacidade, transform: [{ rotate: `${inicio}deg` }] }]}
    >
      {/* Janela: só a metade direita (0° a 180°) aparece */}
      <View style={[styles.janela, { left: metade, width: metade, height: tamanho }]}>
        {/* Meio disco esquerdo girado `varredura` graus em torno do centro da rosca */}
        <View
          style={{
            position: 'absolute',
            left: -metade,
            top: 0,
            width: tamanho,
            height: tamanho,
            transform: [{ rotate: `${varredura}deg` }],
          }}
        >
          <View
            style={{
              width: metade,
              height: tamanho,
              backgroundColor: cor,
              borderTopLeftRadius: metade,
              borderBottomLeftRadius: metade,
            }}
          />
        </View>
      </View>
    </View>
  );
}

/** Respiro de 2px entre duas fatias, do furo até a borda. */
function Divisa({ angulo, tamanho, espessura, cor }) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${angulo}deg` }] }]}
    >
      <View
        style={{
          position: 'absolute',
          left: tamanho / 2 - 1,
          top: 0,
          width: 2,
          height: espessura + 1,
          backgroundColor: cor,
        }}
      />
    </View>
  );
}

export default function TriggerDonutChart({
  fatias = [],
  selecionado = null,
  tamanho = 164,
  espessura = 20,
  valorCentro,
  rotuloCentro,
  corSuperficie = colors.surface,
  descricaoAcessivel,
}) {
  const { arcos, divisas } = montarArcosRosca(fatias);
  const furo = tamanho - espessura * 2;

  return (
    <View
      style={{ width: tamanho, height: tamanho }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={descricaoAcessivel}
    >
      {arcos.length === 0 ? (
        <View
          style={[StyleSheet.absoluteFill, { borderRadius: tamanho / 2, backgroundColor: colors.border }]}
        />
      ) : (
        arcos.map((arco, indice) => (
          <Arco
            key={`${arco.chave}-${indice}`}
            inicio={arco.inicio}
            varredura={arco.varredura}
            cor={corDoGatilho(arco.chave)}
            tamanho={tamanho}
            opacidade={selecionado && selecionado !== arco.chave ? OPACIDADE_ATENUADA : 1}
          />
        ))
      )}

      {divisas.map((angulo) => (
        <Divisa key={angulo} angulo={angulo} tamanho={tamanho} espessura={espessura} cor={corSuperficie} />
      ))}

      <View
        style={[
          styles.furo,
          {
            top: espessura,
            left: espessura,
            width: furo,
            height: furo,
            borderRadius: furo / 2,
            backgroundColor: corSuperficie,
          },
        ]}
      >
        <Text style={styles.valorCentro}>{valorCentro}</Text>
        {rotuloCentro ? (
          <Text style={styles.rotuloCentro} numberOfLines={2}>
            {rotuloCentro}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  janela: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  furo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  valorCentro: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
  },
  rotuloCentro: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
