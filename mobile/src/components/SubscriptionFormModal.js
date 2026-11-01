/**
 * SubscriptionFormModal - Sprint 4 (Detox de Assinaturas)
 *
 * Cadastro e edição de assinatura: nome, valor de cada cobrança, ciclo, dia ou
 * data da cobrança, categoria, tipo, divisão do plano e teste grátis. Na edição,
 * também exclui o cadastro (o que é diferente de cancelar). O erro de cada campo
 * aparece antes de enviar; o erro da API aparece no topo.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { formatarData, formatarMoeda, parseValorBR } from '../utils/format';
import { adicionarDias, hojeLocal } from '../utils/datas';
import { camposIniciais, validarFormulario } from '../utils/formularioAssinatura';
import Chip from './Chip';

// Atalhos para a data em que o teste grátis acaba
const DIAS_DE_TESTE = [7, 14, 30];

function Campo({ rotulo, erro, children }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      {children}
      {erro ? <Text style={styles.erroCampo}>{erro}</Text> : null}
    </View>
  );
}

export default function SubscriptionFormModal({ visible, meta, assinatura, sugestao, onFechar, onSalvar, onExcluir }) {
  const editando = Boolean(assinatura);
  const [campos, setCampos] = useState(() => camposIniciais(assinatura, sugestao));
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Ao abrir, recomeça com os dados da assinatura, do checklist ou em branco
  useEffect(() => {
    if (!visible) return;
    setCampos(camposIniciais(assinatura, sugestao));
    setErros({});
    setErroGeral(null);
    setSalvando(false);
  }, [visible, assinatura, sugestao]);

  const alterar = (campo, valor) => setCampos((atuais) => ({ ...atuais, [campo]: valor }));
  // Trocar de categoria limpa o tipo, que é de outra categoria
  const escolherCategoria = (categoria) => setCampos((atuais) => ({ ...atuais, categoria, tipo: null }));

  const categorias = meta?.categorias ?? [];
  const tiposDaCategoria = categorias.find((c) => c.valor === campos.categoria)?.tipos ?? [];
  const pessoasMaximo = meta?.limites?.compartilhadaComMaximo ?? 20;
  const nomeMaximo = meta?.limites?.nomeMaximo ?? 60;
  const valorDigitado = parseValorBR(campos.valor);
  const datasDeTeste = DIAS_DE_TESTE.map((dias) => ({
    dias,
    texto: formatarData(adicionarDias(hojeLocal(), dias)),
  }));

  const enviar = async () => {
    const { erros: novosErros, dados } = validarFormulario(campos, { editando, nomeMaximo });
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || salvando) return;

    setSalvando(true);
    setErroGeral(null);
    try {
      await onSalvar(dados, assinatura?.id);
      onFechar();
    } catch (err) {
      setErroGeral(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const pedirExclusao = () => {
    Alert.alert(
      'Excluir cadastro?',
      `Use isto só se ${assinatura.nome} foi cadastrada por engano: ela some da lista e da economia. ` +
        'Para parar de pagar, cancele a assinatura no botão do card.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await onExcluir(assinatura.id);
              onFechar();
            } catch (err) {
              setErroGeral(err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onFechar}>
      <KeyboardAvoidingView
        style={styles.fundo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.painel}>
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>{editando ? 'Editar assinatura' : 'Nova assinatura'}</Text>
            <TouchableOpacity
              onPress={onFechar}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Text style={styles.fechar}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {erroGeral ? <Text style={styles.erroGeral}>{erroGeral}</Text> : null}

            <Campo rotulo="Nome" erro={erros.nome}>
              <TextInput
                style={styles.input}
                value={campos.nome}
                onChangeText={(texto) => alterar('nome', texto)}
                placeholder="Ex.: streaming de filmes"
                placeholderTextColor={colors.textMuted}
                maxLength={nomeMaximo}
                accessibilityLabel="Nome da assinatura"
              />
            </Campo>

            <Campo rotulo="Valor de cada cobrança (R$)" erro={erros.valor}>
              <TextInput
                style={styles.input}
                value={campos.valor}
                onChangeText={(texto) => alterar('valor', texto)}
                placeholder="Ex.: 39,90"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                accessibilityLabel="Valor de cada cobrança em reais"
              />
            </Campo>

            <Campo rotulo="Cobrança">
              <View style={styles.chips}>
                {(meta?.ciclos ?? []).map((ciclo) => (
                  <Chip
                    key={ciclo.valor}
                    label={ciclo.rotulo}
                    ativo={campos.ciclo === ciclo.valor}
                    onPress={() => alterar('ciclo', ciclo.valor)}
                  />
                ))}
              </View>
            </Campo>

            {campos.ciclo === 'mensal' ? (
              <Campo rotulo="Dia da cobrança (opcional)" erro={erros.dia}>
                <TextInput
                  style={styles.input}
                  value={campos.dia}
                  onChangeText={(texto) => alterar('dia', texto.replace(/\D/g, ''))}
                  placeholder="Ex.: 15"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  accessibilityLabel="Dia do mês em que a cobrança cai"
                />
              </Campo>
            ) : (
              <Campo rotulo="Próxima cobrança (opcional)" erro={erros.proxima}>
                <TextInput
                  style={styles.input}
                  value={campos.proxima}
                  onChangeText={(texto) => alterar('proxima', texto)}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  accessibilityLabel="Data da próxima cobrança"
                />
              </Campo>
            )}

            <Campo rotulo="Categoria">
              <View style={styles.chips}>
                {categorias.map((categoria) => (
                  <Chip
                    key={categoria.valor}
                    label={categoria.rotulo}
                    ativo={campos.categoria === categoria.valor}
                    onPress={() => escolherCategoria(categoria.valor)}
                  />
                ))}
              </View>
            </Campo>

            {tiposDaCategoria.length > 0 && (
              <Campo rotulo="Tipo (serve para achar serviços que fazem a mesma coisa)">
                <View style={styles.chips}>
                  <Chip label="Nenhum" ativo={campos.tipo === null} onPress={() => alterar('tipo', null)} />
                  {tiposDaCategoria.map((tipo) => (
                    <Chip
                      key={tipo.valor}
                      label={tipo.rotulo}
                      ativo={campos.tipo === tipo.valor}
                      onPress={() => alterar('tipo', tipo.valor)}
                    />
                  ))}
                </View>
              </Campo>
            )}

            <Campo rotulo="Divide o plano com quantas pessoas?">
              <View style={styles.contador}>
                <TouchableOpacity
                  style={styles.botaoContador}
                  onPress={() => alterar('pessoas', Math.max(0, campos.pessoas - 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Uma pessoa a menos"
                >
                  <Text style={styles.botaoContadorTexto}>−</Text>
                </TouchableOpacity>
                <Text style={styles.contadorValor}>
                  {campos.pessoas === 0
                    ? 'Só você'
                    : `${campos.pessoas} ${campos.pessoas === 1 ? 'pessoa' : 'pessoas'}`}
                </Text>
                <TouchableOpacity
                  style={styles.botaoContador}
                  onPress={() => alterar('pessoas', Math.min(pessoasMaximo, campos.pessoas + 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Uma pessoa a mais"
                >
                  <Text style={styles.botaoContadorTexto}>+</Text>
                </TouchableOpacity>
              </View>
              {campos.pessoas > 0 && valorDigitado > 0 && (
                <Text style={styles.dica}>
                  Sua parte de cada cobrança: {formatarMoeda(valorDigitado / (campos.pessoas + 1))}
                </Text>
              )}
            </Campo>

            {!editando && (
              <Campo rotulo="Teste grátis" erro={erros.fimTeste}>
                <View style={styles.linhaSwitch}>
                  <Text style={styles.textoSwitch}>Ainda estou no período de teste grátis</Text>
                  <Switch
                    value={campos.emTeste}
                    onValueChange={(valor) => alterar('emTeste', valor)}
                    trackColor={{ false: colors.border, true: colors.success }}
                    thumbColor={campos.emTeste ? colors.textPrimary : colors.textMuted}
                    accessibilityLabel="Ainda estou no período de teste grátis"
                  />
                </View>
                {campos.emTeste && (
                  <>
                    <View style={[styles.chips, styles.chipsTeste]}>
                      {datasDeTeste.map(({ dias, texto }) => (
                        <Chip
                          key={dias}
                          label={`Em ${dias} dias`}
                          ativo={campos.fimTeste === texto}
                          onPress={() => alterar('fimTeste', texto)}
                        />
                      ))}
                    </View>
                    <TextInput
                      style={styles.input}
                      value={campos.fimTeste}
                      onChangeText={(texto) => alterar('fimTeste', texto)}
                      placeholder="O teste acaba em DD/MM/AAAA"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                      accessibilityLabel="Data em que o teste grátis acaba"
                    />
                  </>
                )}
              </Campo>
            )}

            <TouchableOpacity
              style={[styles.botao, salvando && styles.botaoDesabilitado]}
              onPress={enviar}
              disabled={salvando}
              accessibilityRole="button"
              accessibilityState={{ disabled: salvando }}
            >
              {salvando ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <Text style={styles.botaoTexto}>{editando ? 'Salvar alterações' : 'Cadastrar'}</Text>
              )}
            </TouchableOpacity>

            {editando && (
              <TouchableOpacity style={styles.botaoExcluir} onPress={pedirExclusao} accessibilityRole="button">
                <Text style={styles.botaoExcluirTexto}>Excluir cadastro</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  painel: {
    maxHeight: '90%',
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
    marginBottom: 8,
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
  erroGeral: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 8,
  },
  campo: {
    marginTop: 12,
  },
  rotulo: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  erroCampo: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipsTeste: {
    marginVertical: 8,
  },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botaoContador: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoContadorTexto: {
    color: colors.textPrimary,
    fontSize: 20,
  },
  contadorValor: {
    color: colors.textPrimary,
    fontSize: 15,
    marginHorizontal: 16,
    minWidth: 80,
    textAlign: 'center',
  },
  dica: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  linhaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textoSwitch: {
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  botao: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  botaoExcluir: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  botaoExcluirTexto: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
