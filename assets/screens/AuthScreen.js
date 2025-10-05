import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import FingerprintScreen from './FingerprintScreen';
import PinScreen from './PinScreen';

const AuthScreen = ({ onAuthSuccess }) => {
  const [isCheckingBiometrics, setIsCheckingBiometrics] = useState(true);
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
  
  useEffect(() => {
    checkBiometricSupport();
  }, []);
  
  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      // Hem donanım desteği olmalı hem de en az bir biyometrik kimlik kaydedilmiş olmalı
      setIsBiometricsAvailable(hasHardware && isEnrolled);
      setIsCheckingBiometrics(false);
    } catch (error) {
      console.log('Biyometrik kontrol hatası:', error);
      setIsBiometricsAvailable(false);
      setIsCheckingBiometrics(false);
    }
  };
  
  if (isCheckingBiometrics) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Kimlik doğrulama özellikleri kontrol ediliyor...</Text>
      </View>
    );
  }
  
  return isBiometricsAvailable ? (
    <FingerprintScreen onAuthSuccess={onAuthSuccess} />
  ) : (
    <PinScreen onAuthSuccess={onAuthSuccess} />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(245, 245, 250)',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'InterNormal',
    color: '#666',
  },
});

export default AuthScreen;