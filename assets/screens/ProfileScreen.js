import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../colors/colors.js';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [colorTheme, setColorTheme] = useState('light');
  const [userStats, setUserStats] = useState({
    totalPasswords: 0,
    strongPasswords: 0,
    weakPasswords: 0,
    lastBackup: null,
    categoryStats: {}
  });

  // Tema tercihini yükle
  useEffect(() => {
    loadThemePreference();
    loadUserStats();
  }, []);

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

  const loadUserStats = async () => {
    try {
      const passwords = await AsyncStorage.getItem('passwords');
      const parsedPasswords = passwords ? JSON.parse(passwords) : [];
      
      // Güçlü ve zayıf şifre sayıları
      const strongPasswords = parsedPasswords.filter(p => 
        p.password.length >= 12 &&
        /[A-Z]/.test(p.password) &&
        /[a-z]/.test(p.password) &&
        /[0-9]/.test(p.password) &&
        /[^A-Za-z0-9]/.test(p.password)
      ).length;

      const weakPasswords = parsedPasswords.filter(p =>
        p.password.length < 8 ||
        !/[A-Z]/.test(p.password) ||
        !/[a-z]/.test(p.password) ||
        !/[0-9]/.test(p.password)
      ).length;

      // Kategori dağılımı
      const categoryStats = {
        shopping: parsedPasswords.filter(p => p.category === 'shopping').length,
        bank: parsedPasswords.filter(p => p.category === 'bank').length,
        food: parsedPasswords.filter(p => p.category === 'food').length,
        game: parsedPasswords.filter(p => p.category === 'game').length,
        other: parsedPasswords.filter(p => !p.category).length
      };

      setUserStats({
        totalPasswords: parsedPasswords.length,
        strongPasswords,
        weakPasswords,
        lastBackup: '2024-03-15',
        categoryStats
      });
    } catch (e) {
      console.log('İstatistikler yüklenirken hata:', e);
    }
  };

  // Kategori ikonlarını ve isimlerini tanımlayalım
  const CATEGORY_INFO = {
    shopping: { icon: 'shopping-cart', name: 'Alışveriş' },
    bank: { icon: 'university', name: 'Banka' },
    food: { icon: 'utensils', name: 'Yemek' },
    game: { icon: 'gamepad', name: 'Oyun' },
    other: { icon: 'folder', name: 'Diğer' }
  };

  const colors = colorTheme === 'light' ? lightColors : darkColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Hesabım</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* İstatistikler */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Şifre Güvenliği</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
              <Icon name="key" size={24} color={colors.primary} />
              <Text style={[styles.statNumber, { color: colors.primaryText }]}>{userStats.totalPasswords}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Toplam Şifre</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
              <Icon name="shield-alt" size={24} color={colors.highSecurity} />
              <Text style={[styles.statNumber, { color: colors.primaryText }]}>{userStats.strongPasswords}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Güçlü Şifre</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
              <Icon name="exclamation-triangle" size={24} color={colors.lowSecurity} />
              <Text style={[styles.statNumber, { color: colors.primaryText }]}>{userStats.weakPasswords}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Zayıf Şifre</Text>
            </View>
          </View>
        </View>

        {/* Kategori Dağılımı */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Kategori Dağılımı</Text>
          <View style={styles.categoryGrid}>
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <View key={key} style={[styles.categoryCard, { backgroundColor: colors.cardBackground }]}>
                <Icon name={info.icon} size={20} color={colors.primary} />
                <Text style={[styles.categoryNumber, { color: colors.primaryText }]}>
                  {userStats.categoryStats[key]}
                </Text>
                <Text style={[styles.categoryLabel, { color: colors.secondaryText }]}>
                  {info.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hesap İşlemleri */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Icon name="key" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primaryText }]}>Giriş Şifresini Değiştir</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('BackupSettings')}
          >
            <Icon name="cloud-upload-alt" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primaryText }]}>Yedekleme Ayarları</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('SecuritySettings')}
          >
            <Icon name="shield-alt" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primaryText }]}>Güvenlik Ayarları</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "InterBold",
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "InterBold",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: "InterBold",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "InterNormal",
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "InterNormal",
    marginLeft: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  categoryCard: {
    width: '45%',
    marginHorizontal: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  categoryNumber: {
    fontSize: 20,
    fontFamily: "InterBold",
    marginVertical: 6,
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: "InterNormal",
  },
});