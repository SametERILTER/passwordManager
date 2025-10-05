import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ToastAndroid, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../colors/colors.js';

const GeneratePasswordScreen = () => {
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [passwordLength, setPasswordLength] = useState(12);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordGenerated, setPasswordGenerated] = useState(false);
  const [colorTheme, setColorTheme] = useState('light');

  // Animasyon değerleri
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Tema tercihini yükle
  const loadThemePreference = async () => {
    try {
      const settingsData = await AsyncStorage.getItem('settings');
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        setColorTheme(settings.darkMode ? 'dark' : 'light');
      }
    } catch (e) {
      console.log('Tema tercihi yüklenirken hata:', e);
    }
  };

  useEffect(() => {
    loadThemePreference();
  }, []);

  // Aktif renkleri seç
  const colors = colorTheme === 'light' ? lightColors : darkColors;

  const generatePassword = () => {
    // Buton scale animasyonu
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()-_=+[]{}|;:,.<>?';

    if (!charset.length) {
      setGeneratedPassword('Lütfen en az bir seçenek seçin.');
      setPasswordGenerated(true);
      fadeIn();
      return;
    }

    let password = '';
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    setGeneratedPassword(password);
    setPasswordGenerated(true);
    fadeIn();
  };

  const fadeIn = () => {
    fadeAnim.setValue(0); // reset
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const copyToClipboard = () => {
    if (generatedPassword && passwordGenerated && !generatedPassword.includes('Lütfen')) {
      Clipboard.setStringAsync(generatedPassword);
      ToastAndroid.show('Şifre kopyalandı.', ToastAndroid.SHORT);
    }
  };

  const incrementLength = () => {
    if (passwordLength < 32) setPasswordLength(passwordLength + 1);
  };

  const decrementLength = () => {
    if (passwordLength > 6) setPasswordLength(passwordLength - 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primaryText }]}>Şifre Üret</Text>

      <Animated.View style={[styles.passwordBox, { 
        backgroundColor: colors.cardBackground,
        opacity: fadeAnim 
      }]}>
        <Animated.Text
          selectable
          style={[
            styles.passwordText, 
            { color: colors.primaryText },
            !passwordGenerated && { color: colors.secondaryText }
          ]}
        >
          {passwordGenerated ? generatedPassword : 'Güçlü şifreler üretin...'}
        </Animated.Text>
        <TouchableOpacity
          onPress={copyToClipboard}
          disabled={!passwordGenerated}
          style={[styles.copyButton, { opacity: passwordGenerated ? 1 : 0.3 }]}
        >
          <Ionicons name="copy-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.settingsContainer}>
        <SettingSwitch 
          label="Büyük harf (A-Z)" 
          value={includeUppercase} 
          onValueChange={setIncludeUppercase}
          colors={colors}
        />
        <SettingSwitch 
          label="Küçük harf (a-z)" 
          value={includeLowercase} 
          onValueChange={setIncludeLowercase}
          colors={colors}
        />
        <SettingSwitch 
          label="Rakam (0-9)" 
          value={includeNumbers} 
          onValueChange={setIncludeNumbers}
          colors={colors}
        />
        <SettingSwitch 
          label="Sembol (!@#$...)" 
          value={includeSymbols} 
          onValueChange={setIncludeSymbols}
          colors={colors}
        />

        <View style={[styles.lengthContainer, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.lengthLabel, { color: colors.primaryText }]}>Şifre Uzunluğu:</Text>
          <View style={styles.lengthControls}>
            <TouchableOpacity 
              onPress={decrementLength} 
              style={[styles.lengthButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.lengthButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.lengthValue, { color: colors.primaryText }]}>{passwordLength}</Text>
            <TouchableOpacity 
              onPress={incrementLength} 
              style={[styles.lengthButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.lengthButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={generatePassword}
        >
          <Text style={styles.buttonText}>Yeni Şifre Üret</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const SettingSwitch = ({ label, value, onValueChange, colors }) => (
  <View style={[styles.switchRow, { backgroundColor: colors.cardBackground }]}>
    <Text style={[styles.switchLabel, { color: colors.primaryText }]}>{label}</Text>
    <Switch
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={value ? colors.primary : colors.cardBackground}
      onValueChange={onValueChange}
      value={value}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'InterBold',
    marginBottom: 20,
  },
  passwordBox: {
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    marginBottom: 25,
  },
  passwordText: {
    fontSize: 18,
    fontFamily: 'InterNormal',
    flex: 1,
    marginRight: 10,
  },
  copyButton: {
    opacity: 0.3,
  },
  settingsContainer: {
    marginBottom: 25,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 9,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: 'InterBold',
  },
  lengthContainer: {
    marginTop: 16,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  lengthLabel: {
    fontSize: 16,
    fontFamily: 'InterBold',
    marginBottom: 10,
  },
  lengthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lengthButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lengthButtonText: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  lengthValue: {
    fontSize: 20,
    fontFamily: 'InterBold',
  },
  button: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'InterBold',
    color: 'white',
  },
});

export default GeneratePasswordScreen;
