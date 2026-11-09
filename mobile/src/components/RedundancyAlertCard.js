/**
 * RedundancyAlertCard - Sprint 3 (Detox de Assinaturas)
 *
 * Alerta no topo da tela quando há assinaturas ativas que fazem a mesma
 * coisa (ex.: dois streamings de vídeo). Para cada grupo mostra quanto
 * se gasta junto e sugere pausar uma delas.
 *
 * Sprint 4: cor de aviso (warning) em vez da de erro, porque é só uma sugestão.
 * "Pausar" agora pausa de verdade (a tela pergunta por quanto tempo), um teste
 * grátis sugerido vira "Cancelar teste" e os nomes dos tipos vêm da API.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { formatarMoeda } from '../utils/format';

function listarNomes(assinaturas) {
  const nomes = assinaturas.map((s) => s.nome);
  if (nomes.length <= 1) return nomes.join('');
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

function GrupoConcorrente({ grupo, onPausar, descricaoTipo }) {
  const { tipo, quantidade, gastoMensal, assinaturas, sugestaoPausa } = grupo;
  // Sprint 4: um teste grátis não se pausa; cancela-se antes da primeira cobrança
  const ehTeste = sugestaoPausa.status === 'teste';
  const acao = ehTeste ? 'Cancelar teste' : 'Pausar';

  return (
    <View style={styles.grupo}>
      <Text style={styles.grupoTitulo}>
        {quantidade} serviços de {descricaoTipo(tipo)} ativos
      </Text>
      <Text style={styles.detalhe}>
        {listarNomes(assinaturas)}: {formatarMoeda(gastoMensal)} por mês juntos.
      </Text>

      <View style={styles.sugestao}>
        <View style={styles.sugestaoTexto}>
          <Text style={styles.sugestaoNome}>
            Sugestão: {ehTeste ? 'cancelar o teste de' : 'pausar'} {sugestaoPausa.nome}
          </Text>
          <Text style={styles.detalhe}>{sugestaoPausa.motivo}</Text>
          <Text style={styles.economia}>
            Economia de {formatarMoeda(sugestaoPausa.economiaMensal)}/mês (
            {formatarMoeda(sugestaoPausa.economiaAnual)}/ano)
          </Text>
        </View>
        <TouchableOpacity
          style={styles.botao}
          onPress={() => onPausar(sugestaoPausa)}
          accessibilityRole="button"
          accessibilityLabel={`${acao}: ${sugestaoPausa.nome}`}
        >
          <Text style={styles.botaoTexto}>{acao}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RedundancyAlertCard({ redundancias, onPausar, descricaoTipo }) {
  if (!redundancias || redundancias.totalGrupos === 0) return null;

  return (
    <View style={styles.box}>
      <Text style={styles.titulo}>Assinaturas concorrentes</Text>
      <Text style={styles.subtitulo}>
        Você paga por serviços que fazem a mesma coisa. Pausando as sugestões, economiza{' '}
        {formatarMoeda(redundancias.economiaPotencialMensal)} por mês.
      </Text>

      {redundancias.grupos.map((grupo) => (
        <GrupoConcorrente key={grupo.tipo} grupo={grupo} onPausar={onPausar} descricaoTipo={descricaoTipo} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  titulo: {
    color: colors.warning,
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  grupo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grupoTitulo: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  detalhe: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  sugestao: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  sugestaoTexto: {
    flex: 1,
    marginRight: 12,
  },
  sugestaoNome: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  economia: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  botao: {
    backgroundColor: colors.accentStrong,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  botaoTexto: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});