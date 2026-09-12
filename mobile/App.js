import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [tabAtiva, setTabAtiva] = useState('home');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header do App */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⏳ Save your Time</Text>
        <Text style={styles.headerSubtitle}>Gestão Financeira e Consumo Consciente</Text>
      </View>

      {/* Menu de Navegação entre Módulos (Integrantes) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navBar}>
        <TouchableOpacity style={[styles.navButton, tabAtiva === 'home' && styles.navActive]} onPress={() => setTabAtiva('home')}>
          <Text style={styles.navText}>Visão Geral</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, tabAtiva === 'int1' && styles.navActive]} onPress={() => setTabAtiva('int1')}>
          <Text style={styles.navText}>Perfil / Salário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, tabAtiva === 'int2' && styles.navActive]} onPress={() => setTabAtiva('int2')}>
          <Text style={styles.navText}>Horas de Suor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, tabAtiva === 'int3' && styles.navActive]} onPress={() => setTabAtiva('int3')}>
          <Text style={styles.navText}>Detox Assinaturas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, tabAtiva === 'int4' && styles.navActive]} onPress={() => setTabAtiva('int4')}>
          <Text style={styles.navText}>Cooldown 48h</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, tabAtiva === 'int5' && styles.navActive]} onPress={() => setTabAtiva('int5')}>
          <Text style={styles.navText}>3 Potes 50-30-20</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Área de Conteúdo da Tab */}
      <ScrollView style={styles.content}>
        {tabAtiva === 'home' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚀 Estrutura Base do MVP Pronta!</Text>
            <Text style={styles.cardDesc}>
              O repositório do projeto está configurado. Cada integrante possui sua respectiva aba e rota no backend pronta para receber os códigos da Sprint 1 amanhã!
            </Text>
          </View>
        )}

        {tabAtiva === 'int1' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👤 Perfil & Carga Horária (Integrante 1)</Text>
            <Text style={styles.cardDesc}>Formulário para definir salário mensal e carga horária. Cálculo automático da "Valor da Hora".</Text>
          </View>
        )}

        {tabAtiva === 'int2' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💪 Horas de Suor (Integrante 2)</Text>
            <Text style={styles.cardDesc}>Calculadora visual para converter preço de produtos em horas/dias de trabalho.</Text>
          </View>
        )}

        {tabAtiva === 'int3' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🧹 Detox de Assinaturas (Integrante 3)</Text>
            <Text style={styles.cardDesc}>Checklist interativo para rastrear e cancelar gastos recorrentes com total economizado.</Text>
          </View>
        )}

        {tabAtiva === 'int4' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⏱️ Cooldown 48h (Integrante 4)</Text>
            <Text style={styles.cardDesc}>Lista de desejos com contagem regressiva de 48h para evitar compras impulsivas.</Text>
          </View>
        )}

        {tabAtiva === 'int5' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Orçamento 3 Potes (Integrante 5)</Text>
            <Text style={styles.cardDesc}>Três barras de progresso visuais (50% Necessidades, 30% Estilo de Vida, 20% Dívidas).</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#38bdf8' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  navBar: { paddingHorizontal: 10, paddingVertical: 12, backgroundColor: '#1e293b', maxHeight: 60 },
  navButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#334155', marginRight: 8 },
  navActive: { backgroundColor: '#0284c7' },
  navText: { color: '#ffffff', fontWeight: '600' },
  content: { padding: 16 },
  card: { backgroundColor: '#1e293b', padding: 20, borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#cbd5e1', lineHeight: 20 }
});
