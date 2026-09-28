/**
 * CooldownCard - card de um desejo em quarentena: preço, custo em horas de
 * trabalho, nível de risco de impulso e cronômetro regressivo das 48h.
 *
 * Sprint 2: o tempo restante é recalculado a cada segundo pelo hook
 * (item.tempoReal) e a régua mostra os marcos de 12h, 24h e 48h.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

const NIVEL_CORES = {
  Baixo: colors.success,
  Médio: colors.warning,
  Crítico: colors.danger,
};

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}

/** 166 953s -> "1d 22:22:33" | 3 723s -> "01:02:03" */
function formatarContagem(segundos) {
  const total = Math.max(Number(segundos) || 0, 0);
  const dias = Math.floor(total / 86400);
  const horas = Math.floor((total % 86400) / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const resto = total % 60;

  const relogio = `${doisDigitos(horas)}:${doisDigitos(minutos)}:${doisDigitos(resto)}`;
  return dias > 0 ? `${dias}d ${relogio}` : relogio;
}

export default function CooldownCard({ item, onEncerrar, onResponderQuiz }) {
  const { item: nome, preco, risco, tempo, quiz, tempoReal } = item;

  const liberado = tempoReal?.liberado ?? tempo.concluido;
  const progresso = tempoReal?.progresso ?? tempo.progresso;
  const segundosRestantes = tempoReal?.segundosRestantes ?? tempo.segundosRestantes;

  const corRisco = NIVEL_CORES[risco.nivel] ?? colors.textSecondary;
  const corTempo = liberado ? colors.success : colors.accent;
  const proximoMarco = liberado ? null : tempo.marcos.find((m) => !m.atingido);

  return (
    <View style={[styles.card, { borderLeftColor: corRisco }]}>
      <View style={styles.linhaTopo}>
        <Text style={styles.nome} numberOfLines={2}>
          {nome}
        </Text>
        <View style={[styles.badge, { borderColor: corRisco }]}>
          <Text style={[styles.badgeTexto, { color: corRisco }]}>
            Risco {risco.nivel} · {risco.score}
          </Text>
        </View>
      </View>

      <Text style={styles.preco}>{formatarMoeda(preco)}</Text>
      <Text style={styles.suor}>
        {item.horasSuor !== null ? `${item.horasSuor}h do seu trabalho` : 'Horas de trabalho indisponíveis'}
        {risco.percentualRenda !== null ? ` · ${risco.percentualRenda}% da renda do mês` : ''}
      </Text>

      <View style={styles.cronometroBox}>
        <Text style={styles.cronometroLabel}>
          {liberado ? 'Quarentena concluída' : 'Liberação em'}
        </Text>
        <Text style={[styles.cronometro, { color: corTempo }]}>
          {liberado ? 'Pode decidir' : formatarContagem(segundosRestantes)}
        </Text>
      </View>

      <View style={styles.barraFundo}>
        <View
          style={[styles.barraProgresso, { width: `${progresso * 100}%`, backgroundColor: corTempo }]}
        />
        {tempo.marcos.slice(0, -1).map((marco) => (
          <View
            key={marco.horas}
            style={[styles.marcador, { left: `${(marco.horas / tempo.periodoCooldownHoras) * 100}%` }]}
          />
        ))}
      </View>

      <View style={styles.linhaMarcos}>
        {tempo.marcos.map((marco) => (
          <Text
            key={marco.horas}
            style={[styles.marcoTexto, marco.atingido && styles.marcoAtingido]}
          >
            {marco.atingido ? '✓ ' : ''}
            {marco.horas}h
          </Text>
        ))}
      </View>

      <Text style={styles.fase}>
        Fase: {tempo.fase.titulo} · {tempo.fase.orientacao}
      </Text>

      {risco.motivos.length > 0 && <Text style={styles.motivo}>• {risco.motivos[0]}</Text>}

      {proximoMarco && (
        <Text style={styles.pergunta}>
          Próximo marco ({proximoMarco.horas}h): {proximoMarco.pergunta}
        </Text>
      )}

      <View style={styles.acoes}>
        {!quiz && (
          <TouchableOpacity
            style={[styles.botao, styles.botaoSecundario]}
            onPress={() => onResponderQuiz?.(item)}
          >
            <Text style={styles.botaoSecundarioTexto}>Responder reflexão</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.botao, styles.botaoPrincipal, !liberado && styles.botaoAtenuado]}
          onPress={() => onEncerrar?.(item)}
        >
          <Text style={styles.botaoPrincipalTexto}>
            {liberado ? 'Registrar desfecho' : 'Encerrar agora'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  nome: {
    flex: 1,
    marginRight: 12,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  preco: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
  },
  suor: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  cronometroBox: {
    marginTop: 12,
    alignItems: 'center',
  },
  cronometroLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cronometro: {
    fontSize: 26,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  barraFundo: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 12,
    overflow: 'hidden',
  },
  barraProgresso: {
    height: '100%',
    borderRadius: 3,
  },
  marcador: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: colors.background,
  },
  linhaMarcos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  marcoTexto: {
    color: colors.textMuted,
    fontSize: 11,
  },
  marcoAtingido: {
    color: colors.success,
  },
  fase: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
  motivo: {
    color: colors.warning,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  pergunta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  acoes: {
    flexDirection: 'row',
    marginTop: 12,
  },
  botao: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  botaoPrincipal: {
    backgroundColor: colors.accentStrong,
  },
  botaoAtenuado: {
    backgroundColor: colors.border,
  },
  botaoPrincipalTexto: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  botaoSecundarioTexto: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
