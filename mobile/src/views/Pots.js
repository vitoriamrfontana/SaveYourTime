import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePotsController } from '../controllers/PotsController';

export default function Pots() {
  const { pots, carregando, erro, recarregar } = usePotsController();

  if (carregando) {
    return <Text style={styles.mensagem}>Carregando...</Text>;
  }

  if (erro) {
    return (
      <View style={styles.container}>
        <Text style={[styles.mensagem, styles.erro]}>Erro: {erro}</Text>
        <TouchableOpacity style={styles.botaoRetry} onPress={recarregar}>
          <Text style={styles.botaoTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pots.map((pote) => (
        <View key={pote.chave} style={styles.card}>
          <Text style={styles.nome}>{pote.nome}</Text>
          <Text style={styles.valores}>
            R$ {pote.atual.toFixed(2)} / R$ {pote.limite.toFixed(2)}
          </Text>
          <View style={styles.barraFundo}>
            <View
              style={[
                styles.barraPreenchida,
                { width: `${pote.percentualVisual}%`, backgroundColor: pote.cor },
              ]}
            />
          </View>
          <Text style={[styles.percentual, pote.estourado && styles.percentualEstourado]}>
            {pote.percentualReal.toFixed(0)}%{pote.estourado ? ' — limite excedido' : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 },
  nome: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  valores: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  barraFundo: { height: 10, backgroundColor: '#334155', borderRadius: 5, overflow: 'hidden' },
  barraPreenchida: { height: '100%', borderRadius: 5 },
  percentual: { color: '#cbd5e1', fontSize: 12, marginTop: 4, textAlign: 'right' },
  percentualEstourado: { color: '#f87171', fontWeight: 'bold' },
  mensagem: { color: '#f8fafc', padding: 16, textAlign: 'center' },
  erro: { color: '#f87171' },
  botaoRetry: { backgroundColor: '#0284c7', padding: 12, borderRadius: 8, marginTop: 8 },
  botaoTexto: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});