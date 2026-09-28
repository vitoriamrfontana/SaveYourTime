/**
 * CooldownWishModal - formulário modal para colocar um novo desejo na trava
 * de 48h, com o questionário reflexivo (necessidade real, uso previsto e
 * alternativas) que alimenta o Score de Impulso.
 *
 * O mesmo formulário atende os dois modos:
 *   modo="novo" -> nome, preço, categoria + questionário
 *   modo="quiz" -> só o questionário, para um desejo que já está em quarentena
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';

const CATEGORIA_ROTULOS = {
  eletronicos: 'Eletrônicos',
  vestuario: 'Vestuário',
  lazer: 'Lazer',
  casa: 'Casa',
  outros: 'Outros',
};

const USOS = [
  { chave: 'diario', rotulo: 'Todo dia' },
  { chave: 'semanal', rotulo: 'Toda semana' },
  { chave: 'raro', rotulo: 'Raramente' },
];

const ESTADO_INICIAL = {
  nome: '',
  preco: '',
  categoria: 'outros',
  necessidadeReal: null,
  usoPrevisto: null,
  alternativas: '',
};

function paraNumero(texto) {
  const numero = Number(String(texto).replace(',', '.'));
  return Number.isFinite(numero) ? numero : NaN;
}

export default function CooldownWishModal({
  visible,
  modo = 'novo',
  item = null,
  categorias = [],
  valorHora,
  salvando = false,
  erro = null,
  onFechar,
  onSalvar,
}) {
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [erroLocal, setErroLocal] = useState(null);

  const somenteQuiz = modo === 'quiz';

  // Cada abertura começa limpa (ou com o que o desejo já tinha respondido)
  useEffect(() => {
    if (!visible) return;

    setErroLocal(null);
    setForm({
      ...ESTADO_INICIAL,
      nome: item?.item ?? '',
      preco: item ? String(item.preco) : '',
      categoria: item?.categoria ?? 'outros',
      necessidadeReal: item?.quiz?.necessidadeReal ?? null,
      usoPrevisto: item?.quiz?.usoPrevisto ?? null,
      alternativas: item?.quiz?.alternativas ?? '',
    });
  }, [visible, item]);

  const atualizar = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const precoNumero = paraNumero(form.preco);
  const horasSuorPrevia =
    !somenteQuiz && Number(valorHora) > 0 && precoNumero > 0
      ? (precoNumero / Number(valorHora)).toFixed(1)
      : null;

  const opcoesCategoria = categorias.length > 0 ? categorias : Object.keys(CATEGORIA_ROTULOS);

  const montarQuiz = () => ({
    necessidadeReal: form.necessidadeReal,
    usoPrevisto: form.usoPrevisto,
    alternativas: form.alternativas.trim(),
  });

  const enviar = () => {
    if (somenteQuiz) {
      if (form.necessidadeReal === null && form.usoPrevisto === null && !form.alternativas.trim()) {
        setErroLocal('Responda pelo menos uma pergunta do questionário.');
        return;
      }
      setErroLocal(null);
      onSalvar?.({ quiz: montarQuiz() });
      return;
    }

    if (!form.nome.trim()) {
      setErroLocal('Descreva o que você está querendo comprar.');
      return;
    }
    if (!Number.isFinite(precoNumero) || precoNumero <= 0) {
      setErroLocal('Informe um preço maior que zero.');
      return;
    }

    setErroLocal(null);
    onSalvar?.({
      item: form.nome.trim(),
      preco: precoNumero,
      categoria: form.categoria,
      quiz: montarQuiz(),
    });
  };

  const mensagemErro = erroLocal ?? erro;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onFechar}>
      <KeyboardAvoidingView
        style={styles.fundo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.painel}>
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>
              {somenteQuiz ? 'Questionário reflexivo' : 'Novo desejo na trava'}
            </Text>
            <TouchableOpacity onPress={onFechar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.fechar}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitulo}>
              {somenteQuiz
                ? `Suas respostas recalculam o risco de impulso de "${item?.item ?? ''}".`
                : 'O item fica 48h em reflexão. Suas respostas entram no cálculo do risco de impulso.'}
            </Text>

            {!somenteQuiz && (
              <>
                <Text style={styles.label}>O que você quer comprar?</Text>
                <TextInput
                  style={styles.input}
                  value={form.nome}
                  onChangeText={(texto) => atualizar('nome', texto)}
                  placeholder="Ex.: Fone de ouvido bluetooth"
                  placeholderTextColor={colors.textMuted}
                  maxLength={60}
                />

                <Text style={styles.label}>Preço (R$)</Text>
                <TextInput
                  style={styles.input}
                  value={form.preco}
                  onChangeText={(texto) => atualizar('preco', texto)}
                  placeholder="0,00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
                {horasSuorPrevia && (
                  <Text style={styles.previa}>
                    Custa cerca de {horasSuorPrevia}h do seu trabalho.
                  </Text>
                )}

                <Text style={styles.label}>Categoria</Text>
                <View style={styles.chips}>
                  {opcoesCategoria.map((categoria) => {
                    const ativa = form.categoria === categoria;
                    return (
                      <TouchableOpacity
                        key={categoria}
                        style={[styles.chip, ativa && styles.chipAtivo]}
                        onPress={() => atualizar('categoria', categoria)}
                      >
                        <Text style={[styles.chipTexto, ativa && styles.chipTextoAtivo]}>
                          {CATEGORIA_ROTULOS[categoria] ?? categoria}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.secao}>Antes de decidir, responda</Text>

            <Text style={styles.label}>É uma necessidade real?</Text>
            <View style={styles.chips}>
              {[
                { valor: true, rotulo: 'Sim, preciso' },
                { valor: false, rotulo: 'Não, é vontade' },
              ].map((opcao) => {
                const ativa = form.necessidadeReal === opcao.valor;
                return (
                  <TouchableOpacity
                    key={String(opcao.valor)}
                    style={[styles.chip, ativa && styles.chipAtivo]}
                    onPress={() => atualizar('necessidadeReal', opcao.valor)}
                  >
                    <Text style={[styles.chipTexto, ativa && styles.chipTextoAtivo]}>
                      {opcao.rotulo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Com que frequência vai usar?</Text>
            <View style={styles.chips}>
              {USOS.map((uso) => {
                const ativa = form.usoPrevisto === uso.chave;
                return (
                  <TouchableOpacity
                    key={uso.chave}
                    style={[styles.chip, ativa && styles.chipAtivo]}
                    onPress={() => atualizar('usoPrevisto', uso.chave)}
                  >
                    <Text style={[styles.chipTexto, ativa && styles.chipTextoAtivo]}>
                      {uso.rotulo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Que alternativas você considerou?</Text>
            <TextInput
              style={[styles.input, styles.inputMultilinha]}
              value={form.alternativas}
              onChangeText={(texto) => atualizar('alternativas', texto)}
              placeholder="Ex.: usar o que já tenho, comprar usado, esperar promoção"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.dica}>
              Deixe em branco se não existe alternativa. Ter alternativa aumenta o risco de impulso,
              porque mostra que a compra é evitável.
            </Text>

            {mensagemErro && <Text style={styles.erro}>{mensagemErro}</Text>}
          </ScrollView>

          <TouchableOpacity
            style={[styles.botaoSalvar, salvando && styles.botaoDesabilitado]}
            onPress={enviar}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.botaoSalvarTexto}>
                {somenteQuiz ? 'Salvar respostas' : 'Colocar em quarentena de 48h'}
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
    maxHeight: '90%',
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
    marginBottom: 14,
    lineHeight: 18,
  },
  secao: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 14,
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
    fontSize: 14,
  },
  inputMultilinha: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  previa: {
    color: colors.accent,
    fontSize: 12,
    marginTop: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 8,
    marginBottom: 8,
  },
  chipAtivo: {
    borderColor: colors.accent,
    backgroundColor: colors.accentStrong,
  },
  chipTexto: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chipTextoAtivo: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dica: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  erro: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
  },
  botaoSalvar: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  botaoSalvarTexto: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
