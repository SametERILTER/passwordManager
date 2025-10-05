import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import Icon from 'react-native-vector-icons/FontAwesome5';

const FingerprintScreen = ({ onAuthSuccess }) => {
  const [authInProgress, setAuthInProgress] = useState(false);
  const [error, setError] = useState('');
  const [noBiometry, setNoBiometry] = useState(false);

  const authenticate = async () => {
    setAuthInProgress(true);
    setError('');
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      setNoBiometry(true);
      setAuthInProgress(false);
      // 3 saniye sonra ana ekrana yönlendir
      setTimeout(() => {
        onAuthSuccess();
      }, 3000);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Parmak izi ile giriş yapın',
      fallbackLabel: 'Şifre Kullan',
      cancelLabel: 'İptal',
      disableDeviceFallback: true,
    });

    setAuthInProgress(false);

    if (result.success) {
      onAuthSuccess();
    } else if (result.error !== 'user_cancel') {
      setError('Kimlik doğrulama başarısız oldu.');
    }
  };

  useEffect(() => {
    authenticate();
  }, []);

  return (
    <View style={styles.container}>
      <Icon name="fingerprint" size={64} color="#007AFF" style={{ marginBottom: 30 }} />
      <Text style={styles.title}>Parmak İzi Girişi</Text>
      {noBiometry ? (
        <>
          <Text style={styles.error}>
            Cihazınızda parmak izi bulunamadı, uygulamaya yönlendiriliyorsunuz...
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.desc}>Uygulamayı kullanmak için parmak izinizi okutun.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {authInProgress ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 30 }} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={authenticate}>
              <Text style={styles.buttonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

export default FingerprintScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(245, 245, 250)",
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: "InterBold",
    color: "#000",
    marginBottom: 10,
    textAlign: "center",
  },
  desc: {
    fontSize: 16,
    fontFamily: "InterNormal",
    color: "#444",
    marginBottom: 20,
    textAlign: "center",
  },
  error: {
    color: "#FF3B30",
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
    fontFamily: "InterNormal",
  },
  button: {
    marginTop: 30,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "InterBold",
  },
}); 