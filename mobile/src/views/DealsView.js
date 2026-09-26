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
  Modal
} from 'react-native';
import { ApiService } from '../services/api';

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

  const valorHora = Number(perfil?.valorHora) || 21.88;

  useEffect(() => {
    carregarOfertas(termoInicial || '');
  }, [termoInicial]);

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

  const dealsOrdenados = [...deals].sort((a, b) => {
    if (filtro === 'menorPreco') return a.melhorPreco - b.melhorPreco;
    if (filtro === 'horasPoupadas') return b.horasPoupadas - a.horasPoupadas;
    if (filtro === 'cashback') return b.valorCashback - a.valorCashback;
    return 0;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Comparador de Precos Consciente</Text>
      <Text style={styles.subtitle}>
        Pesquise produtos e compare ofertas em lojas oficiais com base no menor preco a vista no Pix, calculo de horas de trabalho e cupons exclusivos.
      </Text>

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
          <Text style={styles.loadingText}>Comparando lojas e calculando horas de trabalho...</Text>
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
                <Text style={styles.categoryBadge}>{item.categoria}</Text>
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

            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => abrirModalOferta(item, melhorLojaItem)}
            >
              <Text style={styles.buyButtonText}>
                Ativar Oferta de R$ {Number(item.melhorPreco).toFixed(2)} na {item.lojaMelhorPreco}
              </Text>
            </TouchableOpacity>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ativador de Oferta e Cashback</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>

            {ofertaModal ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalProductCard}>
                  <View style={styles.modalStoreRow}>
                    <Text style={styles.modalStoreName}>{ofertaModal.loja.loja}</Text>
                    {ofertaModal.loja.isMelhorPreco ? (
                      <View style={styles.modalBestBadge}>
                        <Text style={styles.modalBestBadgeText}>Menor Preco a Vista</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.modalProductName}>{ofertaModal.produto.nome}</Text>
                  <Text style={styles.modalCategory}>{ofertaModal.produto.categoria}</Text>

                  <View style={styles.modalPriceContainer}>
                    <Text style={styles.modalPriceValue}>
                      R$ {Number(ofertaModal.loja.preco).toFixed(2)}
                    </Text>
                    <Text style={styles.modalPixTag}>Preco a vista no Pix ou boleto</Text>
                    <Text style={styles.modalInstallment}>
                      {ofertaModal.loja.parcelamento || 'em ate 10x sem juros no cartao'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalRoiCard}>
                  <Text style={styles.modalRoiTitle}>Consciencia Financeira</Text>
                  <Text style={styles.modalRoiText}>
                    Esta compra equivale a {ofertaModal.loja.horasSuor}h da sua jornada de trabalho.
                  </Text>
                  {ofertaModal.economia > 0 ? (
                    <Text style={styles.modalRoiSavings}>
                      Economia de R$ {Number(ofertaModal.economia).toFixed(2)} poupando {ofertaModal.horasPoupadas}h de trabalho comparado a loja mais cara.
                    </Text>
                  ) : null}
                </View>

                {ofertaModal.loja.cupom ? (
                  <View style={styles.modalCouponCard}>
                    <View style={styles.modalCouponHeader}>
                      <Text style={styles.modalCouponLabel}>Cupom de Desconto</Text>
                      <TouchableOpacity
                        style={styles.copyCouponBtn}
                        onPress={() => handleCopiarCupom(ofertaModal.loja.cupom)}
                      >
                        <Text style={styles.copyCouponBtnText}>Copiar Cupom</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalCouponCode}>{ofertaModal.loja.cupom}</Text>
                    {cupomCopiado ? (
                      <Text style={styles.copySuccessText}>
                        Cupom copiado com sucesso! Cole na finalizacao do pedido.
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.modalCashbackCard}>
                  <Text style={styles.modalCashbackTitle}>Cashback de 4% Ativado</Text>
                  <Text style={styles.modalCashbackText}>
                    Ao concluir sua compra, R$ {ofertaModal.cashback} serao creditados na sua conta SaveYourTime.
                  </Text>
                </View>

                <Text style={styles.modalDisclaimer}>
                  Nota: Os precos nas lojas oficiais podem oscilar conforme disponibilidade de estoque, condicoes de pagamento e promocoes instantaneas.
                </Text>

                <TouchableOpacity
                  style={styles.actionStoreButton}
                  onPress={() => handleOpenLink(ofertaModal.loja.link)}
                >
                  <Text style={styles.actionStoreButtonText}>
                    Ir para {ofertaModal.loja.loja}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionShoppingButton}
                  onPress={() => handleOpenLink(ofertaModal.produto.linkGoogleShopping)}
                >
                  <Text style={styles.actionShoppingButtonText}>
                    Comparar Ofertas no Google Shopping
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBackButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.actionBackButtonText}>Voltar ao Comparador</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  contentContainer: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 16, lineHeight: 18 },
  searchBox: { flexDirection: 'row', marginBottom: 14 },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 15,
    marginRight: 8
  },
  searchButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  sectionLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 6 },
  tagsContainer: { flexDirection: 'row', marginBottom: 14 },
  tagButton: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8
  },
  tagButtonActive: { backgroundColor: '#0369a1', borderColor: '#38bdf8' },
  tagText: { color: '#cbd5e1', fontSize: 12 },
  tagTextActive: { color: '#ffffff', fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', marginBottom: 18 },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1e293b',
    marginHorizontal: 3
  },
  filterTabActive: { backgroundColor: '#334155', borderWidth: 1, borderColor: '#38bdf8' },
  filterText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  filterTextActive: { color: '#38bdf8', fontWeight: 'bold' },
  centerContainer: { padding: 30, alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 13 },
  emptyCard: { backgroundColor: '#1e293b', padding: 24, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  emptyTitle: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  emptyDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center' },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  productImage: { width: 75, height: 75, borderRadius: 10, backgroundColor: '#0f172a', marginRight: 12 },
  productImageFallback: {
    width: 75,
    height: 75,
    borderRadius: 10,
    backgroundColor: '#0369a1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  fallbackLetter: { color: '#ffffff', fontSize: 28, fontWeight: 'bold' },
  headerInfo: { flex: 1, justifyContent: 'center' },
  categoryBadge: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  productName: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold', lineHeight: 20 },
  badgeRow: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  storeBadge: { backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 6 },
  storeBadgeText: { color: '#38bdf8', fontSize: 11, fontWeight: '600' },
  couponBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  couponBadgeText: { color: '#10b981', fontSize: 11, fontWeight: '600' },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
    marginVertical: 10
  },
  priceLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', fontWeight: '600' },
  bestPrice: { color: '#38bdf8', fontSize: 24, fontWeight: 'bold' },
  highestPrice: { color: '#64748b', fontSize: 12, textDecorationLine: 'line-through' },
  cashbackBox: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 8, borderRadius: 8, alignItems: 'flex-end' },
  cashbackLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  cashbackValue: { color: '#10b981', fontSize: 15, fontWeight: 'bold' },
  savingsBanner: {
    backgroundColor: '#0c4a6e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12
  },
  savingsTitle: { color: '#7dd3fc', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  savingsText: { color: '#e0f2fe', fontSize: 13, lineHeight: 18 },
  savingsHighlight: { color: '#38bdf8', fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  boldWhite: { color: '#ffffff', fontWeight: 'bold' },
  storesListTitle: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  storesTable: { backgroundColor: '#0f172a', borderRadius: 10, padding: 6, marginBottom: 14 },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  storeRowBest: { backgroundColor: 'rgba(56, 189, 248, 0.08)', borderRadius: 8 },
  storeLeftCol: { flex: 1 },
  storeName: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  storeNameBest: { color: '#38bdf8', fontWeight: 'bold' },
  bestStoreTag: { color: '#10b981', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  storeRightCol: { alignItems: 'flex-end' },
  storePrice: { color: '#cbd5e1', fontSize: 14, fontWeight: 'bold' },
  storePriceBest: { color: '#38bdf8' },
  storeSweatHours: { color: '#94a3b8', fontSize: 11, marginBottom: 4 },
  miniButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2
  },
  miniButtonBest: { backgroundColor: '#0284c7' },
  miniButtonText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  miniButtonTextBest: { color: '#ffffff', fontWeight: 'bold' },
  buyButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  buyButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: { color: '#cbd5e1', fontSize: 14, fontWeight: 'bold' },
  modalBody: { flexGrow: 0 },
  modalProductCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
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
  modalRoiCard: {
    backgroundColor: '#0c4a6e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12
  },
  modalRoiTitle: { color: '#7dd3fc', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  modalRoiText: { color: '#e0f2fe', fontSize: 13, lineHeight: 18 },
  modalRoiSavings: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  modalCouponCard: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  modalCouponHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalCouponLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', fontWeight: 'bold' },
  copyCouponBtn: { backgroundColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  copyCouponBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  modalCouponCode: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    textAlign: 'center'
  },
  copySuccessText: { color: '#34d399', fontSize: 11, marginTop: 6, textAlign: 'center', fontWeight: '600' },
  modalCashbackCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  modalCashbackTitle: { color: '#34d399', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  modalCashbackText: { color: '#a7f3d0', fontSize: 12, lineHeight: 17 },
  modalDisclaimer: { color: '#64748b', fontSize: 11, lineHeight: 16, marginBottom: 14, textAlign: 'center' },
  actionStoreButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8
  },
  actionStoreButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  actionShoppingButton: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8
  },
  actionShoppingButtonText: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 13 },
  actionBackButton: {
    paddingVertical: 10,
    alignItems: 'center'
  },
  actionBackButtonText: { color: '#94a3b8', fontSize: 13 }
});
