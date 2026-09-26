import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ProfileView from './src/views/ProfileView';
import SubscriptionsView from './src/views/SubscriptionsView';
import SweatHoursView from './src/views/SweatHoursView';
import CooldownView from './src/views/CooldownView';
import Pots from './src/views/Pots';
import DealsView from './src/views/DealsView';

export default function App() {
  const [tabAtiva, setTabAtiva] = useState('profile');
  const [userProfile, setUserProfile] = useState(null);
  const [termoComparador, setTermoComparador] = useState('');

  const navegarParaComparador = (termo = '') => {
    setTermoComparador(termo);
    setTabAtiva('deals');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Save your Time</Text>
        <Text style={styles.headerSubtitle}>Gestão Financeira e Consumo Consciente</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navButton, tabAtiva === 'profile' && styles.navActive]}
          onPress={() => setTabAtiva('profile')}
        >
          <Text style={[styles.navText, tabAtiva === 'profile' && styles.navTextActive]}>
            Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, tabAtiva === 'suor' && styles.navActive]}
          onPress={() => setTabAtiva('suor')}
        >
          <Text style={[styles.navText, tabAtiva === 'suor' && styles.navTextActive]}>
            Horas de Suor
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, tabAtiva === 'detox' && styles.navActive]}
          onPress={() => setTabAtiva('detox')}
        >
          <Text style={[styles.navText, tabAtiva === 'detox' && styles.navTextActive]}>
            Detox Assinaturas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, tabAtiva === 'cooldown' && styles.navActive]}
          onPress={() => setTabAtiva('cooldown')}
        >
          <Text style={[styles.navText, tabAtiva === 'cooldown' && styles.navTextActive]}>
            Cooldown 48h
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, tabAtiva === 'potes' && styles.navActive]}
          onPress={() => setTabAtiva('potes')}
        >
          <Text style={[styles.navText, tabAtiva === 'potes' && styles.navTextActive]}>
            3 Potes (50-30-20)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, tabAtiva === 'deals' && styles.navActive]}
          onPress={() => {
            setTermoComparador('');
            setTabAtiva('deals');
          }}
        >
          <Text style={[styles.navText, tabAtiva === 'deals' && styles.navTextActive]}>
            Comparador
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.mainContent}>
        {tabAtiva === 'profile' && (
          <ProfileView onProfileUpdated={(updated) => setUserProfile(updated)} />
        )}

        {tabAtiva === 'suor' && (
          <ScrollView style={styles.placeholderContainer}>
            <SweatHoursView perfil={userProfile || { valorHora: 21.88, salario: 3500 }} />
          </ScrollView>
        )}

        {tabAtiva === 'detox' && <SubscriptionsView />}

        {tabAtiva === 'cooldown' && <CooldownView onBuscarOferta={navegarParaComparador} />}

        {tabAtiva === 'potes' && (
          <ScrollView style={styles.placeholderContainer}>
            <Pots />
          </ScrollView>
        )}

        {tabAtiva === 'deals' && (
          <DealsView
            perfil={userProfile || { valorHora: 21.88, salario: 3500 }}
            termoInicial={termoComparador}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 16, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#38bdf8' },
  headerSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  navBar: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#1e293b', maxHeight: 58 },
  navButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#334155', marginRight: 8 },
  navActive: { backgroundColor: '#0284c7' },
  navText: { color: '#cbd5e1', fontWeight: '600', fontSize: 13 },
  navTextActive: { color: '#ffffff', fontWeight: 'bold' },
  mainContent: { flex: 1 },
  placeholderContainer: { flex: 1, padding: 16 },
  cardPlaceholder: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#94a3b8', lineHeight: 20 },
  infoBox: { marginTop: 16, padding: 12, backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: 10 },
  infoText: { color: '#f8fafc', fontSize: 13 },
  bold: { fontWeight: 'bold', color: '#38bdf8' }
});