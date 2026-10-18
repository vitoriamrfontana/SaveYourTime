/**
 * UsageCheckModal - Sprint 3 (Detox de Assinaturas)
 *
 * Calculadora de custo por uso: a pessoa informa quantas vezes usou a
 * assinatura no último mês, a API divide a mensalidade pelos usos e
 * devolve a classificação (Excelente, Neutro ou Prejuízo).
 * O cálculo e os limites ficam no back-end; aqui é só formulário e exibição.
 *
 * Também exporta o CostBenefitBadge, o selo usado no SubscriptionCard.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';

const SELOS = {
  excelente: { label: 'Excelente', cor: colors.success },
  neutro: { label: 'Neutro', cor: colors.warning },
  prejuizo: { label: 'Prejuízo', cor: colors.danger },
};

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CostBenefitBadge({ classificacao }) {
  const selo = SELOS[classificacao];
  if (!selo) return null;

  return (
    <View style={[styles.selo, { borderColor: selo.cor }]}>
      <Text style={[styles.seloTexto, { color: selo.cor }]}>{selo.label}</Text>
    </View>
  );
}

// "Você paga R$ 90,00/mês e usou 3 vezes = R$ 30,00 por uso."
function fraseResultado({ valorMensal, frequenciaUso, custoPorUso }) {
  if (custoPorUso === null) {
    return `Você paga ${formatarMoeda(valorMensal)}/mês e não usou nenhuma vez no último mês.`;
  }
  const vezes = frequenciaUso === 1 ? 'vez' : 'vezes';
  return `Você paga ${formatarMoeda(valorMensal)}/mês e usou ${frequenciaUso} ${vezes} = ${formatarMoeda(custoPorUso)} por uso.`;
}

export default function UsageCheckModal({ visible, subscription, onFechar, onCalcular }) {
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState(null);

  // Ao abrir, mostra a última verificação dessa assinatura, se já houver uma
  useEffect(() => {
    if (!visible || !subscription) return;
    const ultimo = subscription.usoMensal;
    setTexto(ultimo ? String(ultimo.frequenciaUso) : '');
    setResultado(ultimo ? { ...ultimo, valorMensal: subscription.valorMensal } : null);
    setErro(null);
    setCalculando(false);
  }, [visible, subscription]);

  if (!subscription) return null;

  const semValor = texto === '';

  const calcular = async () => {
    if (semValor || calculando) return;
    setCalculando(true);
    setErro(null);
    try {
      const novoResultado = await onCalcular(subscription.id, Number(texto));
      setResultado(novoResultado);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCalculando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onFechar}>
      <KeyboardAvoidingView
        style={styles.fundo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.painel}>
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>Auditoria de uso</Text>
            <TouchableOpacity
              onPress={onFechar}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Text style={styles.fechar}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitulo}>
            {subscription.nome}: {formatarMoeda(subscription.valorMensal)} por mês.
          </Text>

          <Text style={styles.label}>Quantas vezes você usou no último mês?</Text>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={(valor) => setTexto(valor.replace(/\D/g, ''))}
            placeholder="Ex.: 3"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            onSubmitEditing={calcular}
          />

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          {resultado ? (
            <View style={styles.resultado}>
              <Text style={styles.resultadoFrase}>{fraseResultado(resultado)}</Text>
              <View style={styles.resultadoLinha}>
                <Text style={styles.resultadoLabel}>Custo-benefício:</Text>
                <CostBenefitBadge classificacao={resultado.classificacao} />
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.botao, (semValor || calculando) && styles.botaoDesabilitado]}
            onPress={calcular}
            disabled={semValor || calculando}
            accessibilityRole="button"
          >
            {calculando ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.botaoTexto}>
                {resultado ? 'Calcular de novo' : 'Calcular custo por uso'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  painel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titulo: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  fechar: {
    color: colors.textSecondary,
    fontSize: 18,
    paddingHorizontal: 4,
  },
  subtitulo: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 16,
  },
  erro: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
  },
  resultado: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 16,
  },
  resultadoFrase: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  resultadoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  resultadoLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginRight: 8,
  },
  selo: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  seloTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  botao: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});