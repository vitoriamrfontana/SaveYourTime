import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { simularHorasSuor } from '../services/api';

const QUICK_TAGS = [
  { label: 'iPhone', item: 'iPhone 15', preco: '5000' },
  { label: 'Tênis', item: 'Tênis de Marca', preco: '800' },
  { label: 'Lanche', item: 'Combo Fast Food', preco: '45' },
  { label: 'Console', item: 'Video Game', preco: '4000' }
];

export default function SweatHoursView({ perfil }) {
  const [item, setItem] = useState('');
  const [preco, setPreco] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimular = async () => {
    if (!item || !preco) return;
    setLoading(true);
    setResultado(null);
    try {
      const vHora = Number(perfil?.valorHora) || 21.88;
      const res = await simularHorasSuor(item, preco, vHora);
      setResultado(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTag = (tag) => {
    setItem(tag.item);
    setPreco(tag.preco);
  };

  const sim = resultado?.simulacao || resultado;

  return (
    <View style={styles.card}>
      <Text style={styles.badge}>INTEGRANTE 2 - HORAS DE SUOR (Arthur)</Text>
      <Text style={styles.title}>Horas de Suor</Text>
      <Text style={styles.subtitle}>Descubra quanto tempo da sua vida você vai trabalhar para pagar um item.</Text>

      <Text style={styles.sectionTitle}>Ideias Rápidas:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
        {QUICK_TAGS.map((tag, idx) => (
          <TouchableOpacity key={idx} style={styles.tagButton} onPress={() => handleQuickTag(tag)}>
            <Text style={styles.tagText}>{tag.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>O que você quer comprar?</Text>
      <TextInput
        style={styles.input}
        value={item}
        onChangeText={setItem}
        placeholder="Ex: Smartphone / Tênis"
        placeholderTextColor="#64748b"
      />

      <Text style={styles.label}>Preço do Item (R$):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={preco}
        onChangeText={setPreco}
        placeholder="Ex: 1200"
        placeholderTextColor="#64748b"
      />

      <TouchableOpacity 
        style={[styles.button, (!item || !preco) && styles.buttonDisabled]} 
        onPress={handleSimular}
        disabled={!item || !preco || loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Converter em Horas de Suor</Text>
        )}
      </TouchableOpacity>

      {resultado && sim && sim.horasSuor !== undefined && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Impacto Real no seu Trabalho:</Text>
          <Text style={styles.resultBig}>{sim.horasSuor} Horas</Text>
          <Text style={styles.resultDays}>Equivalente a {sim.diasTrabalho} dias úteis de trabalho!</Text>
          
          {sim.percentualSalario !== undefined && (
            <View style={styles.percentualContainer}>
              <Text style={styles.percentualText}>Isso consome {sim.percentualSalario}% do seu salário mensal.</Text>
              <View style={styles.progressBarBg}>
                <View style={[
                  styles.progressBarFill, 
                  { width: `${Math.min(Number(sim.percentualSalario) || 0, 100)}%` },
                  sim.percentualSalario > 20 ? { backgroundColor: '#ef4444' } : 
                  sim.percentualSalario > 5 ? { backgroundColor: '#eab308' } : { backgroundColor: '#22c55e' }
                ]} />
              </View>
            </View>
          )}

          <View style={styles.provocacaoBox}>
            <Text style={styles.provocacaoText}>{resultado.mensagem || `"Vale a pena trabalhar ${sim.diasTrabalho} dias por isso?"`}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#f59e0b', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  badge: { color: '#f59e0b', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 12, lineHeight: 20 },
  sectionTitle: { fontSize: 13, color: '#cbd5e1', marginBottom: 8, fontWeight: '600' },
  tagsContainer: { flexDirection: 'row', marginBottom: 20 },
  tagButton: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#475569' },
  tagText: { color: '#e2e8f0', fontSize: 13, fontWeight: '500' },
  label: { fontSize: 14, color: '#e2e8f0', marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 14, color: '#ffffff', fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#d97706', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8, shadowColor: '#d97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  buttonDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  resultBox: { backgroundColor: '#451a03', borderColor: '#78350f', borderWidth: 1, borderRadius: 12, padding: 20, marginTop: 24, alignItems: 'center' },
  resultTitle: { color: '#fcd34d', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  resultBig: { color: '#fbbf24', fontSize: 36, fontWeight: '900', marginVertical: 8 },
  resultDays: { color: '#fef3c7', fontSize: 16, fontWeight: '500' },
  percentualContainer: { width: '100%', marginTop: 12, alignItems: 'center' },
  percentualText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  progressBarBg: { width: '100%', height: 8, backgroundColor: '#78350f', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  provocacaoBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#78350f', width: '100%' },
  provocacaoText: { color: '#fde68a', fontSize: 15, fontStyle: 'italic', textAlign: 'center', fontWeight: 'bold', lineHeight: 22 }
});