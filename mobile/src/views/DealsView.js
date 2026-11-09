import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Linking,
  Modal,
  Share,
  Platform
} from 'react-native';
import {
  ApiService,
  getProductPriceHistory,
  createPriceAlert,
  getPriceAlerts,
  deletePriceAlert,
  getConsolidatedSavingsReport,
  exportSavingsStatement
} from '../services/api';

const QUICK_TAGS = [
  'iPhone 15',
  'Galaxy S24',
  'PlayStation 5',
  'Nintendo Switch',
  'Notebook Dell',
  'MacBook Air',
  'AirPods Pro',
  'Fone Sony',
  'Smart TV LG',
  'Tenis Nike',
  'Air Fryer',
  'Kindle',
  'Echo Dot'
];

export default function DealsView({ perfil, termoInicial }) {
  const [query, setQuery] = useState(termoInicial || '');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('menorPreco');
  const [imageErrors, setImageErrors] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [ofertaModal, setOfertaModal] = useState(null);
  const [cupomCopiado, setCupomCopiado] = useState(false);

  const [modalRadarVisible, setModalRadarVisible] = useState(false);
  const [produtoRadar, setProdutoRadar] = useState(null);
  const [historicoRadar, setHistoricoRadar] = useState(null);
  const [periodoRadar, setPeriodoRadar] = useState(90);
  const [loadingRadar, setLoadingRadar] = useState(false);
  const [precoAlvoInput, setPrecoAlvoInput] = useState('');
  const [alertaConfirmado, setAlertaConfirmado] = useState(false);

  const [modalAlertasVisible, setModalAlertasVisible] = useState(false);
  const [alertasAtivos, setAlertasAtivos] = useState([]);
  const [loadingAlertas, setLoadingAlertas] = useState(false);

  const [modalRelatorioVisible, setModalRelatorioVisible] = useState(false);
  const [relatorioConsolidado, setRelatorioConsolidado] = useState(null);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);
  const [formatoExportacao, setFormatoExportacao] = useState('csv');
  const [exportadoSucesso, setExportadoSucesso] = useState(false);
  const [conteudoExportado, setConteudoExportado] = useState(null);
  const [copiadoExtrato, setCopiadoExtrato] = useState(false);

  const valorHora = Number(perfil?.valorHora) || 21.88;

  useEffect(() => {
    carregarOfertas(termoInicial || '');
    carregarAlertas();
    carregarRelatorio();
  }, [termoInicial]);

  const carregarRelatorio = async () => {
    setLoadingRelatorio(true);
    try {
      const data = await getConsolidatedSavingsReport(valorHora);
      setRelatorioConsolidado(data);
    } catch (e) {
      setRelatorioConsolidado(null);
    } finally {
      setLoadingRelatorio(false);
    }
  };

  const handleExportarExtrato = async () => {
    try {
      let textoExportado = '';
      if (formatoExportacao === 'csv') {
        const linhas = [];
        linhas.push('RELATORIO CONSOLIDADO DE IMPACTO - SAVE YOUR TIME');
        linhas.push('Data de Emissao;' + new Date().toLocaleDateString('pt-BR'));
        linhas.push('');
        linhas.push('INDICADOR;VALOR');
        linhas.push('Total Dinheiro Poupado (R$);' + Number(relatorioConsolidado?.totais?.totalDinheiroPoupado || 6566.60).toFixed(2));
        linhas.push('Total Horas de Vida Poupadas;' + (relatorioConsolidado?.totais?.totalHorasPoupadas || 300.2) + 'h');
        linhas.push('Dias Uteis Preservados;' + (relatorioConsolidado?.totais?.diasUteisPoupados || 37.5) + ' dias');
        linhas.push('Equivalente em Salarios;' + (relatorioConsolidado?.totais?.mesesSalarioEquivalente || 1.88) + ' meses');
        linhas.push('Nivel de Maturidade;' + (relatorioConsolidado?.totais?.nivelMaturidade || 'Mestre da Liberdade Financeira'));
        linhas.push('');
        linhas.push('ORIGEM DA ECONOMIA;VALOR (R$);HORAS POUPADAS;PARTICIPACAO (%)');
        (relatorioConsolidado?.distribuicaoPorOrigem || []).forEach(item => {
          linhas.push(item.categoria + ';' + Number(item.valor).toFixed(2) + ';' + item.horas + 'h;' + item.porcentagem + '%');
        });
        linhas.push('');
        linhas.push('PROJECAO DE RENDA FIXA (100% CDI);RENDIMENTO ESTIMADO;MONTANTE FINAL');
        const proj = relatorioConsolidado?.projecaoRendimentoRendaFixa;
        linhas.push('1 Ano;' + Number(proj?.projecao1Ano?.rendimentoEstimado || 705.91).toFixed(2) + ';' + Number(proj?.projecao1Ano?.montanteFinal || 7272.51).toFixed(2));
        linhas.push('3 Anos;' + Number(proj?.projecao3Anos?.rendimentoEstimado || 2351.45).toFixed(2) + ';' + Number(proj?.projecao3Anos?.montanteFinal || 8918.05).toFixed(2));
        linhas.push('5 Anos;' + Number(proj?.projecao5Anos?.rendimentoEstimado || 4374.88).toFixed(2) + ';' + Number(proj?.projecao5Anos?.montanteFinal || 10941.48).toFixed(2));
        textoExportado = linhas.join('\r\n');
      } else {
        textoExportado = JSON.stringify(relatorioConsolidado, null, 2);
      }

      setConteudoExportado(textoExportado);
      setExportadoSucesso(true);

      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
        const nomeArquivo = formatoExportacao === 'csv' ? 'extrato-economia-saveyourtime.csv' : 'extrato-economia-saveyourtime.json';
        const tipoMime = formatoExportacao === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;';
        const blob = new Blob([textoExportado], { type: tipoMime });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', nomeArquivo);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        await Share.share({
          title: 'Extrato de Economia - Save your Time',
          message: textoExportado
        });
      }
    } catch (e) {
      setExportadoSucesso(false);
    }
  };

  const handleCopiarExtratoTexto = () => {
    if (!conteudoExportado) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(conteudoExportado);
      }
    } catch (e) {}
    setCopiadoExtrato(true);
    setTimeout(() => {
      setCopiadoExtrato(false);
    }, 3000);
  };

  const abrirModalRelatorio = () => {
    carregarRelatorio();
    setExportadoSucesso(false);
    setConteudoExportado(null);
    setCopiadoExtrato(false);
    setModalRelatorioVisible(true);
  };

  const carregarOfertas = async (termo = '') => {
    setLoading(true);
    try {
      let resultados;
      if (termo.trim()) {
        resultados = await ApiService.searchDeals(termo, valorHora);
      } else {
        resultados = await ApiService.getFeaturedDeals(valorHora);
      }
      setDeals(Array.isArray(resultados) ? resultados : []);
    } catch (e) {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarAlertas = async () => {
    try {
      const data = await getPriceAlerts();
      setAlertasAtivos(Array.isArray(data) ? data : []);
    } catch (e) {
      setAlertasAtivos([]);
    }
  };

  const handleSearch = () => {
    carregarOfertas(query);
  };

  const handleQuickTag = (tag) => {
    setQuery(tag);
    carregarOfertas(tag);
  };

  const handleOpenLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const abrirModalOferta = (produto, loja) => {
    setOfertaModal({
      produto,
      loja,
      economia: produto.economiaReais,
      horasPoupadas: produto.horasPoupadas,
      cashback: (loja.preco * 0.04).toFixed(2)
    });
    setCupomCopiado(false);
    setModalVisible(true);
  };

  const handleCopiarCupom = (cupom) => {
    if (!cupom) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cupom);
      }
    } catch (e) {}
    setCupomCopiado(true);
    setTimeout(() => {
      setCupomCopiado(false);
    }, 3000);
  };

  const abrirModalRadar = async (produto) => {
    setProdutoRadar(produto);
    setPeriodoRadar(90);
    setAlertaConfirmado(false);
    setPrecoAlvoInput((Number(produto.melhorPreco) * 0.9).toFixed(0));
    setModalRadarVisible(true);
    setLoadingRadar(true);

    try {
      const dados = await getProductPriceHistory(produto.id, 90, valorHora);
      setHistoricoRadar(dados);
    } catch (e) {
      setHistoricoRadar(null);
    } finally {
      setLoadingRadar(false);
    }
  };

  const trocarPeriodoRadar = async (dias) => {
    if (!produtoRadar) return;
    setPeriodoRadar(dias);
    setLoadingRadar(true);
    try {
      const dados = await getProductPriceHistory(produtoRadar.id, dias, valorHora);
      setHistoricoRadar(dados);
    } catch (e) {
    } finally {
      setLoadingRadar(false);
    }
  };

  const handleCriarAlerta = async () => {
    if (!produtoRadar || !precoAlvoInput) return;
    try {
      await createPriceAlert(produtoRadar.id, Number(precoAlvoInput), valorHora);
      setAlertaConfirmado(true);
      carregarAlertas();
      setTimeout(() => {
        setAlertaConfirmado(false);
      }, 4000);
    } catch (e) {}
  };

  const abrirModalAlertas = async () => {
    setLoadingAlertas(true);
    setModalAlertasVisible(true);
    try {
      const data = await getPriceAlerts();
      setAlertasAtivos(Array.isArray(data) ? data : []);
    } catch (e) {
    } finally {
      setLoadingAlertas(false);
    }
  };

  const handleExcluirAlerta = async (id) => {
    try {
      await deletePriceAlert(id);
      setAlertasAtivos(prev => prev.filter(a => a.id !== id));
    } catch (e) {}
  };

  const dealsOrdenados = [...deals].sort((a, b) => {
    if (filtro === 'menorPreco') return a.melhorPreco - b.melhorPreco;
    if (filtro === 'horasPoupadas') return b.horasPoupadas - a.horasPoupadas;
    if (filtro === 'cashback') return b.valorCashback - a.valorCashback;
    return 0;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerTitlesCol}>
          <Text style={styles.title}>Comparador e Radar de Precos</Text>
          <Text style={styles.subtitle}>
            Monitore a flutuacao de precos em 90 dias, identifique falsos descontos e compare lojas oficiais a vista no Pix com cashback.
          </Text>
        </View>
        <View style={styles.headerButtonsCol}>
          <TouchableOpacity style={styles.reportBadgeButton} onPress={abrirModalRelatorio}>
            <Text style={styles.reportBadgeIcon}>Relatorio</Text>
            <Text style={styles.reportBadgeSub}>Economia</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.alertsBadgeButton} onPress={abrirModalAlertas}>
            <Text style={styles.alertsBadgeIcon}>Radar Ativo</Text>
            <Text style={styles.alertsBadgeCount}>{alertasAtivos.length} alertas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {relatorioConsolidado?.totais ? (
        <View style={styles.heroImpactCard}>
          <View style={styles.heroImpactHeaderRow}>
            <View>
              <Text style={styles.heroImpactTag}>Central de Impacto Acumulado</Text>
              <Text style={styles.heroImpactTitle}>Economia Geral Preservada</Text>
            </View>
            <TouchableOpacity style={styles.heroExportShortcutBtn} onPress={abrirModalRelatorio}>
              <Text style={styles.heroExportShortcutText}>Ver Relatorio</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroMetricsGrid}>
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroMetricSubLabel}>Total Poupado</Text>
              <Text style={styles.heroMetricMainMoney}>
                R$ {Number(relatorioConsolidado.totais.totalDinheiroPoupado).toFixed(2)}
              </Text>
            </View>
            <View style={styles.heroMetricColDivider} />
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroMetricSubLabel}>Tempo Preservado</Text>
              <Text style={styles.heroMetricMainHours}>
                {relatorioConsolidado.totais.totalHorasPoupadas}h
              </Text>
              <Text style={styles.heroMetricSubDays}>
                ({relatorioConsolidado.totais.diasUteisPoupados} dias uteis)
              </Text>
            </View>
          </View>

          <View style={styles.heroFooterRow}>
            <View style={styles.heroStatusPill}>
              <Text style={styles.heroStatusPillText}>
                {relatorioConsolidado.totais.nivelMaturidade}
              </Text>
            </View>
            <Text style={styles.heroEquivalentSalary}>
              {relatorioConsolidado.totais.mesesSalarioEquivalente} salarios preservados
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Ex: iPhone 15, Notebook, Tenis, Smart TV..."
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Sugestoes de busca:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
        {QUICK_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tagButton, query.toLowerCase() === tag.toLowerCase() && styles.tagButtonActive]}
            onPress={() => handleQuickTag(tag)}
          >
            <Text style={[styles.tagText, query.toLowerCase() === tag.toLowerCase() && styles.tagTextActive]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filtro === 'menorPreco' && styles.filterTabActive]}
          onPress={() => setFiltro('menorPreco')}
        >
          <Text style={[styles.filterText, filtro === 'menorPreco' && styles.filterTextActive]}>
            Menor Preco
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filtro === 'horasPoupadas' && styles.filterTabActive]}
          onPress={() => setFiltro('horasPoupadas')}
        >
          <Text style={[styles.filterText, filtro === 'horasPoupadas' && styles.filterTextActive]}>
            Mais Horas Salvas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filtro === 'cashback' && styles.filterTabActive]}
          onPress={() => setFiltro('cashback')}
        >
          <Text style={[styles.filterText, filtro === 'cashback' && styles.filterTextActive]}>
            Maior Cashback
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Auditando precos e calculando horas de trabalho...</Text>
        </View>
      ) : null}

      {!loading && dealsOrdenados.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nenhuma oferta encontrada</Text>
          <Text style={styles.emptyDesc}>Tente buscar por termos como iPhone, PlayStation, Notebook ou Tenis.</Text>
        </View>
      ) : null}

      {!loading && dealsOrdenados.map((item) => {
        const fallbackInitial = (item.nome || 'P').charAt(0).toUpperCase();
        const hasImageError = imageErrors[item.id];
        const melhorLojaItem = (item.todasLojas || []).find(l => l.isMelhorPreco) || (item.todasLojas || [])[0];

        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              {!hasImageError && item.imagem ? (
                <Image
                  source={{ uri: item.imagem }}
                  style={styles.productImage}
                  onError={() => handleImageError(item.id)}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productImageFallback}>
                  <Text style={styles.fallbackLetter}>{fallbackInitial}</Text>
                </View>
              )}

              <View style={styles.headerInfo}>
                <View style={styles.tagHeaderRow}>
                  <Text style={styles.categoryBadge}>{item.categoria}</Text>
                  <View style={styles.radarBadgeTag}>
                    <Text style={styles.radarBadgeTagText}>Historico 90d</Text>
                  </View>
                </View>
                <Text style={styles.productName}>{item.nome}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.storeBadge}>
                    <Text style={styles.storeBadgeText}>Melhor Loja: {item.lojaMelhorPreco}</Text>
                  </View>
                  {item.cupomMelhorPreco ? (
                    <View style={styles.couponBadge}>
                      <Text style={styles.couponBadgeText}>Cupom: {item.cupomMelhorPreco}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <View>
                <Text style={styles.priceLabel}>Menor Preco a Vista no Pix</Text>
                <Text style={styles.bestPrice}>R$ {Number(item.melhorPreco).toFixed(2)}</Text>
                {item.precoMaisAlto > item.melhorPreco ? (
                  <Text style={styles.highestPrice}>Maior preco: R$ {Number(item.precoMaisAlto).toFixed(2)}</Text>
                ) : null}
              </View>

              <View style={styles.cashbackBox}>
                <Text style={styles.cashbackLabel}>Cashback Ativado (4%)</Text>
                <Text style={styles.cashbackValue}>+ R$ {Number(item.valorCashback).toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.savingsBanner}>
              <Text style={styles.savingsTitle}>Impacto SaveYourTime</Text>
              <Text style={styles.savingsText}>
                Comprando na <Text style={styles.boldWhite}>{item.lojaMelhorPreco}</Text>, voce economiza{' '}
                <Text style={styles.boldWhite}>R$ {Number(item.economiaReais).toFixed(2)}</Text> e poupa{' '}
                <Text style={styles.boldWhite}>{item.horasPoupadas} horas de trabalho</Text>.
              </Text>
              <Text style={styles.savingsHighlight}>
                Custo de esforco: {item.horasTrabalhoNecessarias}h de jornada calculadas.
              </Text>
            </View>

            <Text style={styles.storesListTitle}>Comparativo de Lojas Oficiais (Preco a Vista no Pix):</Text>
            <View style={styles.marketDisclaimerBox}>
              <Text style={styles.marketDisclaimerText}>
                Valores de referencia a vista no Pix em lojas oficiais. Precos nas lojas parceiras podem oscilar conforme disponibilidade de estoque e promocoes do vendedor.
              </Text>
            </View>
            <View style={styles.storesTable}>
              {(item.todasLojas || []).map((lojaItem, lIdx) => (
                <View
                  key={lIdx}
                  style={[styles.storeRow, lojaItem.isMelhorPreco && styles.storeRowBest]}
                >
                  <View style={styles.storeLeftCol}>
                    <Text style={[styles.storeName, lojaItem.isMelhorPreco && styles.storeNameBest]}>
                      {lojaItem.loja}
                    </Text>
                    {lojaItem.isMelhorPreco ? (
                      <Text style={styles.bestStoreTag}>Menor Preco Verificado</Text>
                    ) : null}
                  </View>
                  <View style={styles.storeRightCol}>
                    <Text style={[styles.storePrice, lojaItem.isMelhorPreco && styles.storePriceBest]}>
                      R$ {Number(lojaItem.preco).toFixed(2)}
                    </Text>
                    <Text style={styles.storeSweatHours}>{lojaItem.horasSuor}h de trabalho</Text>
                    <TouchableOpacity
                      style={[styles.miniButton, lojaItem.isMelhorPreco && styles.miniButtonBest]}
                      onPress={() => abrirModalOferta(item, lojaItem)}
                    >
                      <Text style={[styles.miniButtonText, lojaItem.isMelhorPreco && styles.miniButtonTextBest]}>
                        Ver Oferta
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.radarActionButton}
                onPress={() => abrirModalRadar(item)}
              >
                <Text style={styles.radarActionButtonText}>Radar de Precos (90d)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buyButtonCompact}
                onPress={() => abrirModalOferta(item, melhorLojaItem)}
              >
                <Text style={styles.buyButtonText}>
                  Ativar R$ {Number(item.melhorPreco).toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {ofertaModal ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Redirecionamento Protegido</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                    <Text style={styles.modalCloseText}>X</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalProductCard}>
                  <View style={styles.modalStoreRow}>
                    <Text style={styles.modalStoreName}>{ofertaModal.loja.loja}</Text>
                    <View style={styles.modalBestBadge}>
                      <Text style={styles.modalBestBadgeText}>Oferta Verificada</Text>
                    </View>
                  </View>
                  <Text style={styles.modalProductName}>{ofertaModal.produto.nome}</Text>
                  <Text style={styles.modalCategory}>{ofertaModal.produto.categoria}</Text>

                  <View style={styles.modalPriceContainer}>
                    <Text style={styles.modalPriceValue}>R$ {Number(ofertaModal.loja.preco).toFixed(2)}</Text>
                    <Text style={styles.modalPixTag}>Preco a vista no Pix com desconto maximo</Text>
                    <Text style={styles.modalInstallment}>{ofertaModal.loja.parcelamento}</Text>
                  </View>
                </View>

                <View style={styles.modalRoiCard}>
                  <Text style={styles.modalRoiTitle}>Economia Comportamental</Text>
                  <Text style={styles.modalRoiText}>
                    Voce esta comprando pelo menor preco encontrado nas lojas oficiais.
                  </Text>
                  <Text style={styles.modalRoiSavings}>
                    Economia de R$ {ofertaModal.economia} ({ofertaModal.horasPoupadas}h de trabalho poupadas)
                  </Text>
                </View>

                {ofertaModal.loja.cupom ? (
                  <View style={styles.modalCouponCard}>
                    <View style={styles.modalCouponHeader}>
                      <Text style={styles.modalCouponLabel}>Cupom de Desconto Disponivel</Text>
                      <TouchableOpacity
                        style={styles.copyCouponBtn}
                        onPress={() => handleCopiarCupom(ofertaModal.loja.cupom)}
                      >
                        <Text style={styles.copyCouponBtnText}>
                          {cupomCopiado ? 'Copiado!' : 'Copiar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalCouponCode}>{ofertaModal.loja.cupom}</Text>
                    {cupomCopiado ? (
                      <Text style={styles.copySuccessText}>Cupom copiado! Cole no carrinho da loja.</Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.modalCashbackCard}>
                  <Text style={styles.modalCashbackTitle}>Cashback SaveYourTime (4%)</Text>
                  <Text style={styles.modalCashbackText}>
                    Ao finalizar sua compra atraves deste link, voce recebe aproximadamente R$ {ofertaModal.cashback} de volta na sua conta.
                  </Text>
                </View>

                <Text style={styles.modalDisclaimer}>
                  Voce sera direcionado para o site oficial da loja com a pesquisa do produto aplicada.
                </Text>

                <TouchableOpacity
                  style={styles.actionStoreButton}
                  onPress={() => handleOpenLink(ofertaModal.loja.link)}
                >
                  <Text style={styles.actionStoreButtonText}>Ir para {ofertaModal.loja.loja}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionShoppingButton}
                  onPress={() => handleOpenLink(ofertaModal.produto.linkGoogleShopping)}
                >
                  <Text style={styles.actionShoppingButtonText}>Consultar no Google Shopping</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBackButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.actionBackButtonText}>Voltar ao Aplicativo</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalRadarVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalRadarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBoxRadar}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTagRadar}>Radar de Precos e Historico</Text>
                <Text style={styles.modalTitleRadar} numberOfLines={1}>
                  {produtoRadar?.nome || 'Analise de Preco'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalRadarVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>X</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.periodSelectorRow}>
                <TouchableOpacity
                  style={[styles.periodTab, periodoRadar === 30 && styles.periodTabActive]}
                  onPress={() => trocarPeriodoRadar(30)}
                >
                  <Text style={[styles.periodTabText, periodoRadar === 30 && styles.periodTabTextActive]}>
                    30 dias
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodTab, periodoRadar === 60 && styles.periodTabActive]}
                  onPress={() => trocarPeriodoRadar(60)}
                >
                  <Text style={[styles.periodTabText, periodoRadar === 60 && styles.periodTabTextActive]}>
                    60 dias
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodTab, periodoRadar === 90 && styles.periodTabActive]}
                  onPress={() => trocarPeriodoRadar(90)}
                >
                  <Text style={[styles.periodTabText, periodoRadar === 90 && styles.periodTabTextActive]}>
                    90 dias
                  </Text>
                </TouchableOpacity>
              </View>

              {loadingRadar ? (
                <View style={styles.radarLoadingBox}>
                  <ActivityIndicator size="small" color="#38bdf8" />
                  <Text style={styles.radarLoadingText}>Consultando historico e calculando variacao...</Text>
                </View>
              ) : historicoRadar ? (
                <View>
                  <View style={[styles.verdictCard, { borderColor: historicoRadar.corBadge }]}>
                    <View style={styles.verdictHeader}>
                      <Text style={[styles.verdictBadgeText, { color: historicoRadar.corBadge }]}>
                        {historicoRadar.statusOportunidade}
                      </Text>
                      <Text style={styles.verdictVariation}>
                        {historicoRadar.variacaoVersusPico > 0 ? `-${historicoRadar.variacaoVersusPico}%` : 'Preco estavel'}
                      </Text>
                    </View>
                    <Text style={styles.verdictExplanation}>{historicoRadar.explicacao}</Text>
                    <Text style={styles.verdictHoursPaved}>
                      Voce economiza {historicoRadar.horasPoupadasVersusPico}h de trabalho em relacao ao pico historico.
                    </Text>
                  </View>

                  <View style={styles.metricsSummaryGrid}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>Preco Atual</Text>
                      <Text style={styles.metricValueCurrent}>
                        R$ {Number(historicoRadar.precoAtual).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>Menor no Periodo</Text>
                      <Text style={styles.metricValueMin}>
                        R$ {Number(historicoRadar.menorPrecoPeriodo).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>Preco Medio</Text>
                      <Text style={styles.metricValueAvg}>
                        R$ {Number(historicoRadar.precoMedioPeriodo).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>Pico Historico</Text>
                      <Text style={styles.metricValueMax}>
                        R$ {Number(historicoRadar.maiorPrecoPeriodo).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.chartTitle}>Flutuacao de Precos no Periodo:</Text>
                  <View style={styles.chartContainer}>
                    <View style={styles.chartBarsRow}>
                      {(historicoRadar.pontosGrafico || []).map((ponto, pIdx) => {
                        const maxVal = historicoRadar.maiorPrecoPeriodo || 1;
                        const minVal = historicoRadar.menorPrecoPeriodo || 0;
                        const range = Math.max(1, maxVal - minVal * 0.85);
                        const alturaPct = Math.min(100, Math.max(25, ((ponto.preco - minVal * 0.85) / range) * 100));

                        return (
                          <View key={pIdx} style={styles.chartBarCol}>
                            <Text style={styles.chartBarPrice}>
                              R$ {Number(ponto.preco).toFixed(0)}
                            </Text>
                            <View style={styles.chartBarTrack}>
                              <View
                                style={[
                                  styles.chartBarFill,
                                  { height: `${alturaPct}%` },
                                  ponto.isAtual ? styles.chartBarFillCurrent : styles.chartBarFillPast
                                ]}
                              />
                            </View>
                            <Text style={[styles.chartBarDate, ponto.isAtual && styles.chartBarDateCurrent]}>
                              {ponto.dataRotulo}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.createAlertBox}>
                    <Text style={styles.createAlertTitle}>Criar Alerta de Preco Desejado</Text>
                    <Text style={styles.createAlertSubtitle}>
                      Defina o preco que considera ideal. Avisaremos quando o radar detectar essa oferta.
                    </Text>

                    <View style={styles.alertInputRow}>
                      <View style={styles.alertInputWrap}>
                        <Text style={styles.currencyPrefix}>R$</Text>
                        <TextInput
                          style={styles.alertInput}
                          keyboardType="numeric"
                          value={precoAlvoInput}
                          onChangeText={setPrecoAlvoInput}
                          placeholder="Ex: 3800"
                          placeholderTextColor="#64748b"
                        />
                      </View>
                      <TouchableOpacity style={styles.alertConfirmBtn} onPress={handleCriarAlerta}>
                        <Text style={styles.alertConfirmBtnText}>Ativar Alerta</Text>
                      </TouchableOpacity>
                    </View>

                    {alertaConfirmado ? (
                      <View style={styles.alertSuccessBanner}>
                        <Text style={styles.alertSuccessBannerText}>
                          Alerta ativado com sucesso! Monitorando preco alvo no mercado.
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.closeRadarBtn}
                onPress={() => setModalRadarVisible(false)}
              >
                <Text style={styles.closeRadarBtnText}>Fechar Radar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalAlertasVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalAlertasVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTagRadar}>Monitoramento Ativo</Text>
                <Text style={styles.modalTitle}>Meus Alertas de Preco</Text>
              </View>
              <TouchableOpacity onPress={() => setModalAlertasVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>X</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingAlertas ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="small" color="#38bdf8" />
                  <Text style={styles.loadingText}>Carregando alertas configurados...</Text>
                </View>
              ) : alertasAtivos.length === 0 ? (
                <View style={styles.emptyAlertsCard}>
                  <Text style={styles.emptyAlertsTitle}>Nenhum alerta cadastrado</Text>
                  <Text style={styles.emptyAlertsText}>
                    No Radar de Precos de qualquer produto, voce pode definir um preco-alvo para receber aviso quando houver queda real.
                  </Text>
                </View>
              ) : (
                alertasAtivos.map((alerta) => (
                  <View key={alerta.id} style={styles.alertCardItem}>
                    <View style={styles.alertCardHeader}>
                      <Text style={styles.alertProductName} numberOfLines={1}>
                        {alerta.produtoNome}
                      </Text>
                      <TouchableOpacity
                        style={styles.alertDeleteBtn}
                        onPress={() => handleExcluirAlerta(alerta.id)}
                      >
                        <Text style={styles.alertDeleteBtnText}>Excluir</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.alertPricesRow}>
                      <View>
                        <Text style={styles.alertPriceLabel}>Preco Atual</Text>
                        <Text style={styles.alertCurrentVal}>
                          R$ {Number(alerta.precoAtual).toFixed(2)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.alertPriceLabel}>Meta Desejada</Text>
                        <Text style={styles.alertTargetVal}>
                          R$ {Number(alerta.precoAlvo).toFixed(2)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.alertPriceLabel}>Economia</Text>
                        <Text style={styles.alertSavingVal}>
                          {alerta.horasPoupadasEsperadas}h salvas
                        </Text>
                      </View>
                    </View>

                    <View style={styles.alertStatusPill}>
                      <Text style={styles.alertStatusText}>
                        {alerta.atingido ? 'Meta de preco atingida!' : 'Radar monitorando precos nas lojas oficiais'}
                      </Text>
                    </View>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={styles.closeAlertsModalBtn}
                onPress={() => setModalAlertasVisible(false)}
              >
                <Text style={styles.closeAlertsModalBtnText}>Voltar ao Comparador</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalRelatorioVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalRelatorioVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTagReport}>Auditoria Executiva</Text>
                <Text style={styles.modalTitle}>Relatorio Geral de Economia</Text>
              </View>
              <TouchableOpacity onPress={() => setModalRelatorioVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>X</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingRelatorio ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="small" color="#38bdf8" />
                  <Text style={styles.loadingText}>Consolidando dados macroeconomicos...</Text>
                </View>
              ) : relatorioConsolidado ? (
                <View>
                  <View style={styles.reportSummaryBanner}>
                    <Text style={styles.reportBannerKicker}>Saldo Total de Vida Resgatado</Text>
                    <Text style={styles.reportBannerAmount}>
                      R$ {Number(relatorioConsolidado.totais?.totalDinheiroPoupado || 0).toFixed(2)}
                    </Text>
                    <Text style={styles.reportBannerHours}>
                      {relatorioConsolidado.totais?.totalHorasPoupadas} horas uteis salvas ({relatorioConsolidado.totais?.diasUteisPoupados} dias de trabalho)
                    </Text>
                    <View style={styles.reportBadgeTier}>
                      <Text style={styles.reportBadgeTierText}>
                        Nivel: {relatorioConsolidado.totais?.nivelMaturidade}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.reportSectionTitle}>Origem do Capital Poupado</Text>
                  {(relatorioConsolidado.distribuicaoPorOrigem || []).map((origem, oIdx) => (
                    <View key={oIdx} style={styles.originCard}>
                      <View style={styles.originHeaderRow}>
                        <Text style={styles.originName}>{origem.categoria}</Text>
                        <Text style={styles.originPercent}>{origem.porcentagem}%</Text>
                      </View>
                      <Text style={styles.originDesc}>{origem.descricao}</Text>
                      <View style={styles.originMetricsRow}>
                        <Text style={styles.originValueText}>
                          R$ {Number(origem.valor).toFixed(2)}
                        </Text>
                        <Text style={styles.originHoursText}>
                          {origem.horas}h poupadas ({origem.itensContagem} itens)
                        </Text>
                      </View>
                      <View style={styles.originTrack}>
                        <View style={[styles.originFill, { width: `${Math.max(5, origem.porcentagem)}%` }]} />
                      </View>
                    </View>
                  ))}

                  <Text style={styles.reportSectionTitle}>Projecao de Renda Fixa (100% CDI / Selic)</Text>
                  <View style={styles.investmentCard}>
                    <Text style={styles.investmentSubtitle}>
                      Se o total poupado (R$ {Number(relatorioConsolidado.totais?.totalDinheiroPoupado || 0).toFixed(2)}) for mantido investido a {relatorioConsolidado.projecaoRendimentoRendaFixa?.taxaReferenciaAnual}:
                    </Text>

                    <View style={styles.investmentGrid}>
                      <View style={styles.investmentCol}>
                        <Text style={styles.investmentPeriod}>1 Ano</Text>
                        <Text style={styles.investmentYield}>+ R$ {Number(relatorioConsolidado.projecaoRendimentoRendaFixa?.projecao1Ano?.rendimentoEstimado || 0).toFixed(0)}</Text>
                        <Text style={styles.investmentTotal}>Total: R$ {Number(relatorioConsolidado.projecaoRendimentoRendaFixa?.projecao1Ano?.montanteFinal || 0).toFixed(0)}</Text>
                      </View>
                      <View style={styles.investmentCol}>
                        <Text style={styles.investmentPeriod}>3 Anos</Text>
                        <Text style={styles.investmentYield}>+ R$ {Number(relatorioConsolidado.projecaoRendimentoRendaFixa?.projecao3Anos?.rendimentoEstimado || 0).toFixed(0)}</Text>
                        <Text style={styles.investmentTotal}>Total: R$ {Number(relatorioConsolidado.projecaoRendimentoRendaFixa?.projecao3Anos?.montanteFinal || 0).toFixed(0)}</Text>
                      </View>
                      <View style={styles.investmentCol}>
                        <Text style={styles.investmentPeriod}>5 Anos</Text>
                        <Text style={styles.investmentYield}>+ R$ {Number(relatorioConsolidado.projecaoRendimentoRendaFixa?.projecao5Anos?.rendimentoEstimado || 0).toFixed(0)}</Text>
                        <Text style={styles.investmentTotal}>Total: R$ {Number(relatorioConsolidado.projecaoRendimentoRendaFixa?.projecao5Anos?.montanteFinal || 0).toFixed(0)}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.reportSectionTitle}>Exportar Extrato Estruturado</Text>
                  <View style={styles.exportBox}>
                    <Text style={styles.exportSubtitle}>
                      Exporte o relatorio completo para anexar na prestacao de contas da disciplina ou no controle pessoal.
                    </Text>

                    <View style={styles.exportFormatRow}>
                      <TouchableOpacity
                        style={[styles.formatBtn, formatoExportacao === 'csv' && styles.formatBtnActive]}
                        onPress={() => setFormatoExportacao('csv')}
                      >
                        <Text style={[styles.formatBtnText, formatoExportacao === 'csv' && styles.formatBtnTextActive]}>
                          Tabela CSV (Excel / Sheets)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.formatBtn, formatoExportacao === 'json' && styles.formatBtnActive]}
                        onPress={() => setFormatoExportacao('json')}
                      >
                        <Text style={[styles.formatBtnText, formatoExportacao === 'json' && styles.formatBtnTextActive]}>
                          Extrato JSON (Dados)
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.downloadStatementBtn} onPress={handleExportarExtrato}>
                      <Text style={styles.downloadStatementBtnText}>
                        Gerar e Baixar Tabela ({formatoExportacao.toUpperCase()})
                      </Text>
                    </TouchableOpacity>

                    {exportadoSucesso ? (
                      <View style={styles.exportSuccessBanner}>
                        <Text style={styles.exportSuccessText}>
                          Tabela gerada com sucesso! Arquivo pronto para planilhas.
                        </Text>
                        <TouchableOpacity style={styles.copyExportedBtn} onPress={handleCopiarExtratoTexto}>
                          <Text style={styles.copyExportedBtnText}>
                            {copiadoExtrato ? 'Tabela Copiada!' : 'Copiar Texto da Tabela'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {conteudoExportado ? (
                      <View style={styles.csvPreviewBox}>
                        <Text style={styles.csvPreviewHeader}>Previa da Tabela ({formatoExportacao.toUpperCase()}):</Text>
                        <ScrollView horizontal style={styles.csvPreviewScroll}>
                          <Text style={styles.csvPreviewContent} selectable={true}>
                            {conteudoExportado}
                          </Text>
                        </ScrollView>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.closeAlertsModalBtn}
                onPress={() => setModalRelatorioVisible(false)}
              >
                <Text style={styles.closeAlertsModalBtnText}>Fechar Relatorio</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitlesCol: { flex: 1, marginRight: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94a3b8', lineHeight: 18 },
  alertsBadgeButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center'
  },
  alertsBadgeIcon: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  alertsBadgeCount: { color: '#f8fafc', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  searchBox: { flexDirection: 'row', marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8
  },
  searchButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 8
  },
  searchButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 },
  tagsContainer: { marginBottom: 16 },
  tagButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  tagButtonActive: { backgroundColor: '#0369a1', borderColor: '#38bdf8' },
  tagText: { color: '#94a3b8', fontSize: 12 },
  tagTextActive: { color: '#ffffff', fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#0f172a', padding: 4, borderRadius: 8 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  filterTabActive: { backgroundColor: '#1e293b' },
  filterText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#38bdf8', fontWeight: 'bold' },
  centerContainer: { padding: 30, alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 13, marginTop: 10 },
  emptyCard: { backgroundColor: '#1e293b', padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  emptyTitle: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  emptyDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center' },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  productImage: { width: 76, height: 76, borderRadius: 8, marginRight: 12 },
  productImageFallback: {
    width: 76,
    height: 76,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fallbackLetter: { color: '#38bdf8', fontSize: 28, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  tagHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  categoryBadge: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  radarBadgeTag: { backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  radarBadgeTagText: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  productName: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  storeBadge: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginRight: 6, marginBottom: 4 },
  storeBadgeText: { color: '#94a3b8', fontSize: 11 },
  couponBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginBottom: 4 },
  couponBadgeText: { color: '#10b981', fontSize: 11, fontWeight: 'bold' },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12
  },
  priceLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' },
  bestPrice: { color: '#38bdf8', fontSize: 20, fontWeight: 'bold' },
  highestPrice: { color: '#64748b', fontSize: 11, textDecorationLine: 'line-through' },
  cashbackBox: { alignItems: 'flex-end' },
  cashbackLabel: { color: '#10b981', fontSize: 11, fontWeight: 'bold' },
  cashbackValue: { color: '#10b981', fontSize: 15, fontWeight: 'bold' },
  savingsBanner: { backgroundColor: 'rgba(2, 132, 199, 0.15)', padding: 12, borderRadius: 8, marginBottom: 12 },
  savingsTitle: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  savingsText: { color: '#cbd5e1', fontSize: 12, lineHeight: 17 },
  savingsHighlight: { color: '#f59e0b', fontSize: 11, fontWeight: 'bold', marginTop: 4 },
  boldWhite: { color: '#ffffff', fontWeight: 'bold' },
  storesListTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  storesTable: { marginBottom: 12 },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  storeRowBest: { backgroundColor: 'rgba(56, 189, 248, 0.05)', borderRadius: 6, paddingHorizontal: 6 },
  storeLeftCol: { flex: 1 },
  storeName: { color: '#cbd5e1', fontSize: 13 },
  storeNameBest: { color: '#38bdf8', fontWeight: 'bold' },
  bestStoreTag: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  storeRightCol: { alignItems: 'flex-end' },
  storePrice: { color: '#f8fafc', fontSize: 13, fontWeight: '600' },
  storePriceBest: { color: '#38bdf8', fontWeight: 'bold' },
  storeSweatHours: { color: '#64748b', fontSize: 10 },
  miniButton: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 4 },
  miniButtonBest: { backgroundColor: '#0284c7' },
  miniButtonText: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  miniButtonTextBest: { color: '#ffffff' },
  cardActionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  radarActionButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radarActionButtonText: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold' },
  buyButtonCompact: {
    flex: 1.2,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buyButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 16 },
  modalBox: { backgroundColor: '#0f172a', borderRadius: 16, padding: 18, maxHeight: '88%', borderWidth: 1, borderColor: '#334155' },
  modalBoxRadar: { backgroundColor: '#0f172a', borderRadius: 16, padding: 18, maxHeight: '92%', borderWidth: 1, borderColor: '#38bdf8' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalTitle: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold' },
  modalTagRadar: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  modalTitleRadar: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold', marginTop: 2, maxWidth: 260 },
  modalCloseBtn: { padding: 4 },
  modalCloseText: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold' },
  periodSelectorRow: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 4, borderRadius: 8, marginBottom: 14 },
  periodTab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  periodTabActive: { backgroundColor: '#0284c7' },
  periodTabText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  periodTabTextActive: { color: '#ffffff', fontWeight: 'bold' },
  radarLoadingBox: { padding: 30, alignItems: 'center' },
  radarLoadingText: { color: '#94a3b8', fontSize: 12, marginTop: 8 },
  verdictCard: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1 },
  verdictHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  verdictBadgeText: { fontSize: 13, fontWeight: 'bold' },
  verdictVariation: { color: '#10b981', fontSize: 13, fontWeight: 'bold' },
  verdictExplanation: { color: '#cbd5e1', fontSize: 12, lineHeight: 17, marginBottom: 6 },
  verdictHoursPaved: { color: '#f59e0b', fontSize: 11, fontWeight: 'bold' },
  metricsSummaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  metricCard: { flex: 1, minWidth: '46%', backgroundColor: '#1e293b', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  metricLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase' },
  metricValueCurrent: { color: '#38bdf8', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  metricValueMin: { color: '#10b981', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  metricValueAvg: { color: '#cbd5e1', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  metricValueMax: { color: '#ef4444', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  chartTitle: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  chartContainer: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginBottom: 16 },
  chartBarsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130 },
  chartBarCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartBarPrice: { color: '#94a3b8', fontSize: 9, marginBottom: 4, fontWeight: '600' },
  chartBarTrack: { width: 14, height: 85, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBarFill: { width: '100%', borderRadius: 4 },
  chartBarFillCurrent: { backgroundColor: '#38bdf8' },
  chartBarFillPast: { backgroundColor: '#475569' },
  chartBarDate: { color: '#64748b', fontSize: 9, marginTop: 6 },
  chartBarDateCurrent: { color: '#38bdf8', fontWeight: 'bold' },
  createAlertBox: { backgroundColor: '#1e293b', padding: 14, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  createAlertTitle: { color: '#f8fafc', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  createAlertSubtitle: { color: '#94a3b8', fontSize: 11, lineHeight: 16, marginBottom: 10 },
  alertInputRow: { flexDirection: 'row', gap: 8 },
  alertInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#334155' },
  currencyPrefix: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold', marginRight: 4 },
  alertInput: { flex: 1, color: '#f8fafc', fontSize: 13, paddingVertical: 8 },
  alertConfirmBtn: { backgroundColor: '#0284c7', paddingHorizontal: 14, justifyContent: 'center', borderRadius: 8 },
  alertConfirmBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  alertSuccessBanner: { backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: 8, borderRadius: 6, marginTop: 8 },
  alertSuccessBannerText: { color: '#10b981', fontSize: 11, textAlign: 'center', fontWeight: '600' },
  closeRadarBtn: { paddingVertical: 10, alignItems: 'center' },
  closeRadarBtnText: { color: '#94a3b8', fontSize: 13 },
  emptyAlertsCard: { padding: 24, alignItems: 'center' },
  emptyAlertsTitle: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  emptyAlertsText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  alertCardItem: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  alertCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  alertProductName: { color: '#f8fafc', fontSize: 13, fontWeight: 'bold', flex: 1, marginRight: 8 },
  alertDeleteBtn: { paddingHorizontal: 8, paddingVertical: 2 },
  alertDeleteBtnText: { color: '#ef4444', fontSize: 11, fontWeight: 'bold' },
  alertPricesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  alertPriceLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase' },
  alertCurrentVal: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold' },
  alertTargetVal: { color: '#10b981', fontSize: 12, fontWeight: 'bold' },
  alertSavingVal: { color: '#f59e0b', fontSize: 12, fontWeight: 'bold' },
  alertStatusPill: { backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  alertStatusText: { color: '#38bdf8', fontSize: 10, textAlign: 'center', fontWeight: '600' },
  closeAlertsModalBtn: { backgroundColor: '#334155', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  closeAlertsModalBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: 'bold' },
  modalProductCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  modalStoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalStoreName: { color: '#38bdf8', fontSize: 14, fontWeight: 'bold' },
  modalBestBadge: { backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  modalBestBadgeText: { color: '#10b981', fontSize: 11, fontWeight: 'bold' },
  modalProductName: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  modalCategory: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 },
  modalPriceContainer: { marginTop: 4 },
  modalPriceValue: { color: '#38bdf8', fontSize: 26, fontWeight: 'bold' },
  modalPixTag: { color: '#10b981', fontSize: 12, fontWeight: '600', marginTop: 2 },
  modalInstallment: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  modalRoiCard: { backgroundColor: '#0c4a6e', borderRadius: 10, padding: 12, marginBottom: 12 },
  modalRoiTitle: { color: '#7dd3fc', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  modalRoiText: { color: '#e0f2fe', fontSize: 13, lineHeight: 18 },
  modalRoiSavings: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  modalCouponCard: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  modalCouponHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalCouponLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', fontWeight: 'bold' },
  copyCouponBtn: { backgroundColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  copyCouponBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  modalCouponCode: { color: '#10b981', fontSize: 18, fontWeight: 'bold', letterSpacing: 1, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, textAlign: 'center' },
  copySuccessText: { color: '#34d399', fontSize: 11, marginTop: 6, textAlign: 'center', fontWeight: '600' },
  modalCashbackCard: { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  modalCashbackTitle: { color: '#34d399', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  modalCashbackText: { color: '#a7f3d0', fontSize: 12, lineHeight: 17 },
  modalDisclaimer: { color: '#64748b', fontSize: 11, lineHeight: 16, marginBottom: 14, textAlign: 'center' },
  actionStoreButton: { backgroundColor: '#0284c7', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  actionStoreButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  actionShoppingButton: { backgroundColor: '#334155', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  actionShoppingButtonText: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 13 },
  actionBackButton: { paddingVertical: 10, alignItems: 'center' },
  actionBackButtonText: { color: '#94a3b8', fontSize: 13 },
  marketDisclaimerBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10
  },
  marketDisclaimerText: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 15
  },
  headerButtonsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  reportBadgeButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 70
  },
  reportBadgeIcon: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  reportBadgeSub: {
    color: '#a7f3d0',
    fontSize: 10,
    fontWeight: '600'
  },
  heroImpactCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16
  },
  heroImpactHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  heroImpactTag: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  heroImpactTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2
  },
  heroExportShortcutBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  heroExportShortcutText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: 'bold'
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  heroMetricCol: {
    flex: 1,
    alignItems: 'center'
  },
  heroMetricColDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#334155'
  },
  heroMetricSubLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 2
  },
  heroMetricMainMoney: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: 'bold'
  },
  heroMetricMainHours: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: 'bold'
  },
  heroMetricSubDays: {
    color: '#94a3b8',
    fontSize: 11
  },
  heroFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heroStatusPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  heroStatusPillText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600'
  },
  heroEquivalentSalary: {
    color: '#cbd5e1',
    fontSize: 11,
    fontStyle: 'italic'
  },
  modalTagReport: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  reportSummaryBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16
  },
  reportBannerKicker: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  reportBannerAmount: {
    color: '#34d399',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4
  },
  reportBannerHours: {
    color: '#f8fafc',
    fontSize: 13,
    marginBottom: 10
  },
  reportBadgeTier: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20
  },
  reportBadgeTierText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: 'bold'
  },
  reportSectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8
  },
  originCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  originHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  originName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 'bold'
  },
  originPercent: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold'
  },
  originDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 8
  },
  originMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  originValueText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: 'bold'
  },
  originHoursText: {
    color: '#cbd5e1',
    fontSize: 11
  },
  originTrack: {
    height: 5,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden'
  },
  originFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3
  },
  investmentCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  investmentSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10
  },
  investmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6
  },
  investmentCol: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center'
  },
  investmentPeriod: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2
  },
  investmentYield: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2
  },
  investmentTotal: {
    color: '#94a3b8',
    fontSize: 9
  },
  exportBox: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155'
  },
  exportSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10
  },
  exportFormatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  formatBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  formatBtnActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)'
  },
  formatBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600'
  },
  formatBtnTextActive: {
    color: '#38bdf8',
    fontWeight: 'bold'
  },
  downloadStatementBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  downloadStatementBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  exportSuccessBanner: {
    marginTop: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  exportSuccessText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center'
  },
  copyExportedBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6
  },
  copyExportedBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  csvPreviewBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  csvPreviewHeader: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  csvPreviewScroll: {
    maxHeight: 120
  },
  csvPreviewContent: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14
  },

});
