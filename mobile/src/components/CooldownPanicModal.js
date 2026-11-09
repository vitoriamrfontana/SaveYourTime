/**
 * CooldownPanicModal - "Freio de Emergência" antirrecaída (Sprint 4).
 *
 * Para o pico da tentação, em três etapas:
 *   1. escolha    - (opcional) qual desejo da trava está tentando; um toque no
 *                   gatilho já aciona o freio, sem formulário para preencher
 *   2. respiracao - respiração guiada 4-7-8 (protocolo vindo do back-end), com
 *                   o impacto principal da compra na tela
 *   3. reflexao   - impacto imediato na renda, mensagens reflexivas, contagem
 *                   do bloqueio de compras e o atalho "desistir agora"
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { formatarMoeda, formatarNumero } from '../utils/format';
import {
  GATILHOS_PADRAO,
  RESPIRACAO_PADRAO,
  corDoGatilho,
  estadoInicialRespiracao,
  avancarRespiracao,
  formatarMinutosSegundos,
} from '../utils/antirrecaida';

// O driver nativo de animação não existe no react-native-web
const USA_DRIVER_NATIVO = Platform.OS !== 'web';
const ESCALA_MINIMA = 0.55;
// 'segure' não tem alvo: o círculo fica parado, cheio
const ESCALA_POR_FASE = { inspire: 1, expire: ESCALA_MINIMA };

const ORIGEM_TEXTO = {
  informado: 'Sobre o valor que você informou',
  quarentena: 'Somando tudo o que está na trava agora',
};

function RespiracaoGuiada({ respiracao, onConcluir }) {
  const [estado, setEstado] = useState(() => estadoInicialRespiracao(respiracao));
  const escala = useRef(new Animated.Value(ESCALA_MINIMA)).current;

  // A view re-renderiza a cada segundo (cronômetros da trava); guardar o
  // callback numa ref evita reiniciar o relógio da respiração a cada render.
  const concluirRef = useRef(onConcluir);
  useEffect(() => {
    concluirRef.current = onConcluir;
  });

  const etapa = respiracao.etapas[estado.etapa];

  useEffect(() => {
    if (estado.concluido) {
      concluirRef.current?.();
      return undefined;
    }
    const timer = setTimeout(() => setEstado((atual) => avancarRespiracao(atual, respiracao)), 1000);
    return () => clearTimeout(timer);
  }, [estado, respiracao]);

  useEffect(() => {
    const alvo = ESCALA_POR_FASE[etapa?.fase];
    if (estado.concluido || alvo === undefined) return undefined;

    const animacao = Animated.timing(escala, {
      toValue: alvo,
      duration: etapa.segundos * 1000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: USA_DRIVER_NATIVO,
    });
    animacao.start();
    return () => animacao.stop();
  }, [estado.ciclo, estado.etapa, estado.concluido, etapa, escala]);

  return (
    <View style={styles.respiracao}>
      <View style={styles.circuloArea}>
        <Animated.View style={[styles.circulo, { transform: [{ scale: escala }] }]} />
        <View style={styles.circuloTextos} pointerEvents="none">
          <Text style={styles.instrucao} accessibilityLiveRegion="polite">
            {etapa?.instrucao}
          </Text>
          <Text style={styles.segundos}>{estado.restante}</Text>
        </View>
      </View>
      <Text style={styles.ciclo}>
        Ciclo {estado.ciclo} de {respiracao.ciclos} · respiração {respiracao.tecnica}
      </Text>
    </View>
  );
}

function Indicador({ valor, rotulo }) {
  return (
    <View style={styles.indicador}>
      <Text style={styles.indicadorValor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text style={styles.indicadorRotulo}>{rotulo}</Text>
    </View>
  );
}

export default function CooldownPanicModal({
  visible,
  items = [],
  gatilhos = [],
  resultado = null,
  bloqueio = null,
  salvando = false,
  erro = null,
  onAcionar,
  onDesistir,
  onFechar,
}) {
  const [desejoId, setDesejoId] = useState(null);
  const [fase, setFase] = useState('escolha');
  const [desistencia, setDesistencia] = useState(null);
  const [erroDesistencia, setErroDesistencia] = useState(null);

  // Cada abertura começa do zero
  useEffect(() => {
    if (!visible) return;
    setDesejoId(null);
    setFase('escolha');
    setDesistencia(null);
    setErroDesistencia(null);
  }, [visible]);

  // Freio acionado: vai direto para a respiração
  useEffect(() => {
    if (resultado) setFase('respiracao');
  }, [resultado]);

  const opcoesGatilho = gatilhos.length > 0 ? gatilhos : GATILHOS_PADRAO;
  const impacto = resultado?.impacto ?? null;
  const mensagens = resultado?.mensagens ?? [];
  const itemFreado = resultado?.item ?? null;

  const mostraHoras = impacto?.horasTrabalho != null;
  const mostraRenda = impacto?.percentualRenda != null;
  // O que já está nos indicadores ou no quadro do bloqueio não se repete na lista
  const mensagensLista = mensagens.filter(
    (m) =>
      m.tipo !== 'bloqueio' &&
      !(m.tipo === 'tempo' && mostraHoras) &&
      !(m.tipo === 'renda' && mostraRenda)
  );
  const manchete = mensagens.find((m) => m.tipo === 'tempo')?.texto ?? mensagens[0]?.texto ?? null;

  const desistirAgora = async () => {
    setErroDesistencia(null);
    const resposta = await onDesistir?.(itemFreado.id);
    if (resposta?.success) setDesistencia(resposta);
    else setErroDesistencia(resposta?.error ?? 'Não foi possível registrar a desistência.');
  };

  const origem =
    impacto?.origem === 'desejo' && itemFreado
      ? `Sobre "${itemFreado.item}"`
      : ORIGEM_TEXTO[impacto?.origem] ?? null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onFechar}>
      <View style={styles.fundo}>
        <View style={styles.painel}>
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>
              {fase === 'escolha' && 'Freio de emergência'}
              {fase === 'respiracao' && 'Respire antes de decidir'}
              {fase === 'reflexao' && 'Impacto imediato na sua renda'}
            </Text>
            <TouchableOpacity
              onPress={onFechar}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Fechar"
            >
              <Text style={styles.fechar}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {/* ---------- 1. Escolha ---------- */}
            {fase === 'escolha' && (
              <>
                <Text style={styles.subtitulo}>
                  Tentação forte agora? Pare por um minuto antes de qualquer compra.
                </Text>
                <View style={styles.aviso}>
                  <Text style={styles.avisoTexto}>
                    🔒 Ao acionar, registrar compras na trava fica bloqueado por{' '}
                    {bloqueio?.duracaoMinutos ?? 30} minutos. Desistir continua liberado.
                  </Text>
                </View>

                {items.length > 0 && (
                  <>
                    <Text style={styles.label}>É um desejo da trava? (opcional)</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.itensLinha}
                    >
                      {items.map((item) => {
                        const ativo = desejoId === item.id;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[styles.chip, ativo && styles.chipAtivo]}
                            onPress={() => setDesejoId(ativo ? null : item.id)}
                            accessibilityState={{ selected: ativo }}
                          >
                            <Text
                              style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}
                              numberOfLines={1}
                            >
                              {item.item}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </>
                )}

                <Text style={styles.label}>O que está puxando você para a compra?</Text>
                {salvando ? (
                  <ActivityIndicator style={styles.carregando} color={colors.danger} />
                ) : (
                  <>
                    <View style={styles.grade}>
                      {opcoesGatilho.map((gatilho) => (
                        <TouchableOpacity
                          key={gatilho.chave}
                          style={styles.gatilho}
                          onPress={() => onAcionar?.({ gatilho: gatilho.chave, desejoId })}
                          accessibilityRole="button"
                          accessibilityLabel={`Acionar o freio: ${gatilho.rotulo}`}
                        >
                          <View
                            style={[styles.gatilhoFaixa, { backgroundColor: corDoGatilho(gatilho.chave) }]}
                          />
                          <View style={styles.gatilhoTextos}>
                            <Text style={styles.gatilhoRotulo}>{gatilho.rotulo}</Text>
                            {gatilho.descricao ? (
                              <Text style={styles.gatilhoDescricao} numberOfLines={2}>
                                {gatilho.descricao}
                              </Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.botaoSoFrear}
                      onPress={() => onAcionar?.({ desejoId })}
                    >
                      <Text style={styles.botaoSoFrearTexto}>Não sei dizer, só quero frear</Text>
                    </TouchableOpacity>
                  </>
                )}

                {erro && <Text style={styles.erro}>{erro}</Text>}
              </>
            )}

            {/* ---------- 2. Respiração ---------- */}
            {fase === 'respiracao' && resultado && (
              <>
                <RespiracaoGuiada
                  respiracao={resultado.respiracao ?? RESPIRACAO_PADRAO}
                  onConcluir={() => setFase('reflexao')}
                />
                {manchete && <Text style={styles.manchete}>{manchete}</Text>}
                <TouchableOpacity style={styles.botaoLink} onPress={() => setFase('reflexao')}>
                  <Text style={styles.botaoLinkTexto}>Pular para a reflexão</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ---------- 3. Reflexão ---------- */}
            {fase === 'reflexao' && resultado && (
              <>
                {impacto?.valorReferencia != null && (
                  <>
                    {origem && <Text style={styles.subtitulo}>{origem}</Text>}
                    <View style={styles.indicadores}>
                      <Indicador valor={formatarMoeda(impacto.valorReferencia)} rotulo="valor" />
                      {mostraHoras && (
                        <Indicador
                          valor={`${formatarNumero(impacto.horasTrabalho)}h`}
                          rotulo="de trabalho"
                        />
                      )}
                      {mostraRenda && (
                        <Indicador
                          valor={`${formatarNumero(impacto.percentualRenda)}%`}
                          rotulo="do salário"
                        />
                      )}
                    </View>
                  </>
                )}

                {mensagensLista.map((mensagem) => (
                  <Text key={mensagem.tipo} style={styles.mensagem}>
                    • {mensagem.texto}
                  </Text>
                ))}

                <View style={styles.bloqueio}>
                  <Text style={styles.bloqueioTitulo}>🔒 Compras bloqueadas na trava</Text>
                  <Text style={styles.bloqueioTempo}>
                    {bloqueio?.ativo
                      ? `libera em ${formatarMinutosSegundos(bloqueio.segundosRestantes)}`
                      : 'bloqueio encerrado'}
                  </Text>
                  <Text style={styles.bloqueioDica}>Desistir continua liberado.</Text>
                </View>

                {itemFreado && !desistencia && (
                  <TouchableOpacity
                    style={[styles.botaoDesistir, salvando && styles.botaoDesabilitado]}
                    onPress={desistirAgora}
                    disabled={salvando}
                  >
                    {salvando ? (
                      <ActivityIndicator color={colors.background} />
                    ) : (
                      <Text style={styles.botaoDesistirTexto} numberOfLines={2}>
                        Desistir de "{itemFreado.item}" agora
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {desistencia && (
                  <View style={styles.vitoria}>
                    <Text style={styles.vitoriaTitulo}>✓ Impulso vencido!</Text>
                    <Text style={styles.vitoriaTexto}>
                      {formatarMoeda(desistencia.item?.desfecho?.valorPoupado ?? itemFreado?.preco)}{' '}
                      continuam com você.
                    </Text>
                  </View>
                )}

                {erroDesistencia && <Text style={styles.erro}>{erroDesistencia}</Text>}

                <TouchableOpacity style={styles.botaoFechar} onPress={onFechar}>
                  <Text style={styles.botaoFecharTexto}>
                    {desistencia ? 'Fechar' : 'Fechar e continuar refletindo'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  painel: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titulo: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
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
    marginBottom: 12,
  },
  aviso: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    padding: 10,
  },
  avisoTexto: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  itensLinha: {
    flexGrow: 0,
  },
  chip: {
    maxWidth: 200,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 8,
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
  carregando: {
    marginVertical: 28,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gatilho: {
    width: '48.5%',
    minHeight: 72,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  gatilhoFaixa: {
    width: 5,
  },
  gatilhoTextos: {
    flex: 1,
    padding: 10,
  },
  gatilhoRotulo: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  gatilhoDescricao: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  botaoSoFrear: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoSoFrearTexto: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  respiracao: {
    alignItems: 'center',
    marginTop: 8,
  },
  circuloArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circulo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  circuloTextos: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  instrucao: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  segundos: {
    color: colors.accent,
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 4,
  },
  ciclo: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 12,
  },
  manchete: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 16,
  },
  botaoLink: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  botaoLinkTexto: {
    color: colors.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  indicadores: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  indicador: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  indicadorValor: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: 'bold',
  },
  indicadorRotulo: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  mensagem: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  bloqueio: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  bloqueioTitulo: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  bloqueioTempo: {
    color: colors.danger,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bloqueioDica: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  botaoDesistir: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  botaoDesistirTexto: {
    color: colors.background,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  vitoria: {
    alignItems: 'center',
    marginTop: 14,
  },
  vitoriaTitulo: {
    color: colors.success,
    fontSize: 18,
    fontWeight: 'bold',
  },
  vitoriaTexto: {
    color: colors.textPrimary,
    fontSize: 14,
    marginTop: 4,
  },
  erro: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
  },
  botaoFechar: {
    backgroundColor: colors.accentStrong,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  botaoFecharTexto: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
