import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function FirstWelcomeScreen({ onContinue }) {
  return (
    <View style={styles.container}>
      <Icon name="shield-alt" size={60} color="#007AFF" style={{ marginBottom: 30 }} />
      <Text style={styles.title}>Şifre Yöneticisi</Text>
      <Text style={styles.description}>
        Güçlü ve güvenli şifreler oluşturun, saklayın ve yönetin. Tüm şifreleriniz güvende!
      </Text>

      <Text style={styles.description}>
        Şifreleriniz şifrelenerek cihazınızda saklanır. Uygulamanın internetle herhangi bir bağlantısı yoktur.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>Uygulamaya Devam Et</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(245, 245, 250)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'InterBold',
    color: '#1c1c1e',
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    fontFamily: 'InterNormal',
    textAlign: 'center',
    color: '#5e5e5e',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'InterBold',
  },
});
