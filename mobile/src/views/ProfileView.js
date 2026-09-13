import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { ApiService } from '../services/api';

export default function ProfileView({ onProfileUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [nome, setNome] = useState('');
  const [salario, setSalario] = useState('');
  const [horasMensais, setHorasMensais] = useState('');
  const [metaEconomia, setMetaEconomia] = useState('');
  const [valorHora, setValorHora] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const data = await ApiService.getUserProfile();
    if (data) {
      setNome(data.nome || '');
      setSalario(data.salario ? String(data.salario) : '');
      setHorasMensais(data.horasMensais ? String(data.horasMensais) : '');
      setMetaEconomia(data.metaEconomia ? String(data.metaEconomia) : '');
      setValorHora(data.valorHora || 0);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!salario || Number(salario) <= 0) {
      setFeedback({ type: 'error', text: 'Por favor, informe um salário válido maior que zero.' });
      return;
    }
    if (!horasMensais || Number(horasMensais) <= 0) {
      setFeedback({ type: 'error', text: 'Por favor, informe uma carga horária mensal válida.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const updatedData = {
      nome: nome.trim() || 'Usuário',
      salario: Number(salario),
      horasMensais: Number(horasMensais),
      metaEconomia: Number(metaEconomia) || 0
    };

    const res = await ApiService.updateUserProfile(updatedData);

    setSaving(false);

    if (res.success && res.data) {
      setValorHora(res.data.valorHora);
      setFeedback({ type: 'success', text: res.message || 'Perfil atualizado com sucesso.' });
      if (onProfileUpdated) onProfileUpdated(res.data);
    } else {
      setFeedback({ type: 'error', text: 'Erro ao salvar as alterações.' });
    }
  };

  const valorDia = (valorHora * 8).toFixed(2);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Perfil e Carga Horária</Text>
      <Text style={styles.subtitle}>
        Defina seu salário e carga horária para calcular a métrica de tempo de trabalho.
      </Text>

      {/* Card Destaque: Valor da Hora Calculado */}
      <View style={styles.highlightCard}>
        <Text style={styles.highlightBadge}>VALOR DA HORA DE TRABALHO</Text>
        <Text style={styles.highlightValue}>R$ {valorHora.toFixed(2)}</Text>
        <Text style={styles.highlightSubtext}>
          Equivale a aproximadamente <Text style={styles.boldText}>R$ {valorDia}</Text> por dia útil de trabalho (8h).
        </Text>
      </View>

      {/* Formulário */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Dados Financeiros Base</Text>

        <Text style={styles.label}>Nome Completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Vitória"
          placeholderTextColor="#64748b"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>Salário Líquido Mensal (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 3500.00"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          value={salario}
          onChangeText={setSalario}
        />

        <Text style={styles.label}>Carga Horária Mensal (Horas)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 160"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          value={horasMensais}
          onChangeText={setHorasMensais}
        />

        <Text style={styles.label}>Meta de Economia Mensal (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 500.00"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          value={metaEconomia}
          onChangeText={setMetaEconomia}
        />

        {/* Feedback de Alerta */}
        {feedback && (
          <View style={[styles.feedbackBox, feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
            <Text style={styles.feedbackText}>{feedback.text}</Text>
          </View>
        )}

        {/* Botão de Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20, lineHeight: 20 },
  highlightCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: '#38bdf8',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20
  },
  highlightBadge: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.2, marginBottom: 6 },
  highlightValue: { color: '#ffffff', fontSize: 36, fontWeight: 'bold', marginVertical: 4 },
  highlightSubtext: { color: '#cbd5e1', fontSize: 13, textAlign: 'center', marginTop: 4 },
  boldText: { fontWeight: 'bold', color: '#38bdf8' },
  formCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 },
  label: { fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    marginBottom: 16
  },
  feedbackBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
  feedbackSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', borderWidth: 1 },
  feedbackError: { backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: '#f43f5e', borderWidth: 1 },
  feedbackText: { color: '#f8fafc', fontSize: 13, textAlign: 'center' },
  saveButton: { backgroundColor: '#38bdf8', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#0f172a', fontSize: 15, fontWeight: 'bold' }
});
