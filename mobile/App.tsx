import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './src/lib/supabase';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      if (!isSupabaseConfigured) {
        setError('Supabase não configurado. Atualize as credenciais em mobile/src/lib/supabase.ts');
        setLoading(false);
        return;
      }

      try {
        // Simple ping to verify connection
        const { error: queryError } = await supabase.from('profiles').select('count').limit(1).single();

        if (queryError && queryError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine for a test
          throw queryError;
        }

        setConnected(true);
      } catch (e: any) {
        setError(e.message || 'Erro ao conectar com Supabase');
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚗 Vrumi Mobile</Text>
      <Text style={styles.subtitle}>React Native + Expo</Text>

      <View style={styles.statusCard}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.statusText}>Testando conexão...</Text>
          </>
        ) : connected ? (
          <>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successText}>Conectado ao Supabase!</Text>
            <Text style={styles.infoText}>Código compartilhado funcionando</Text>
          </>
        ) : (
          <>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </>
        )}
      </View>

      <Text style={styles.footer}>
        Configuração concluída. Pronto para desenvolvimento!
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 40,
  },
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  statusText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#f87171',
    textAlign: 'center',
  },
  footer: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});
