import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../colors/colors.js';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState({
    biometricAuth: false,
    autoLock: true,
    darkMode: false,
    notifications: true,
    autoBackup: false,
    passwordExpiry: true
  });
  const [colorTheme, setColorTheme] = useState('light');

  // Ayarları AsyncStorage'dan yükle
  const loadSettings = async () => {
    try {
      const data = await AsyncStorage.getItem('settings');
      if (data) {
        const parsedSettings = JSON.parse(data);
        setSettings(parsedSettings);
        setColorTheme(parsedSettings.darkMode ? 'dark' : 'light');
      }
    } catch (e) {
      console.error('Ayarlar yüklenemedi:', e);
    }
  };

  // Ayar değişikliklerini yönet
  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
      
      if (key === 'darkMode') {
        setColorTheme(value ? 'dark' : 'light');
        await AsyncStorage.setItem('colorTheme', value ? 'dark' : 'light');
        
        Alert.alert(
          'Tema Değişikliği',
          'Tema değişikliğinin geçerli olması için uygulamayı kapatıp açmanız gerekmektedir.',
          [{ text: 'Tamam', style: 'default' }]
        );
      }
    } catch (e) {
      console.error('Ayarlar kaydedilemedi:', e);
    }
  };

  // Çıkış yap fonksiyonu
  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Oturumunuzu kapatmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive', 
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }]
            });
          } 
        }
      ]
    );
  };

  // Verileri temizle fonksiyonu
  const handleClearData = () => {
    Alert.alert(
      'Verileri Temizle',
      'Tüm şifre verileriniz silinecek. Bu işlem geri alınamaz!',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Temizle', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Başarılı', 'Tüm şifre verileri temizlendi.');
            } catch (e) {
              Alert.alert('Hata', 'Veriler temizlenirken bir hata oluştu.');
            }
          } 
        }
      ]
    );
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const colors = colorTheme === 'light' ? lightColors : darkColors;

  // Ayar öğesi bileşeni
  const SettingItem = ({ icon, title, description, isSwitch, value, onValueChange, onPress }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={[styles.settingIconContainer, { backgroundColor: colors.cardBackground }]}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.primaryText }]}>{title}</Text>
        {description && <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>{description}</Text>}
      </View>
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={value ? colors.primary : colors.cardBackground}
        />
      ) : (
        <Icon name="chevron-right" size={16} color={colors.secondaryText} />
      )}
    </TouchableOpacity>
  );

  // Bölüm başlığı bileşeni
  const SectionHeader = ({ title }) => (
    <Text style={[styles.sectionHeader, { color: colors.secondaryText }]}>{title}</Text>
  );

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
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Ayarlar</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.settingsContainer}>
        {/* Güvenlik Ayarları */}
        <SectionHeader title="Güvenlik" />
        <View style={[styles.settingsGroup, { backgroundColor: colors.cardBackground }]}>
          <SettingItem
            icon="fingerprint"
            title="Biyometrik Doğrulama"
            description="Parmak izi veya yüz tanıma ile giriş yapın"
            isSwitch={true}
            value={settings.biometricAuth}
            onValueChange={(value) => handleSettingChange('biometricAuth', value)}
          />
          <SettingItem
            icon="lock"
            title="Otomatik Kilitleme"
            description="Uygulama arka plana alındığında kilitle"
            isSwitch={true}
            value={settings.autoLock}
            onValueChange={(value) => handleSettingChange('autoLock', value)}
          />
          <SettingItem
            icon="key"
            title="Master Şifre Değiştir"
            onPress={() => navigation.navigate('ChangeMasterPassword')}
          />
        </View>

        {/* Genel Ayarlar */}
        <SectionHeader title="Genel" />
        <View style={[styles.settingsGroup, { backgroundColor: colors.cardBackground }]}>
          <SettingItem
            icon="moon"
            title="Karanlık Mod"
            isSwitch={true}
            value={settings.darkMode}
            onValueChange={(value) => handleSettingChange('darkMode', value)}
          />
          <SettingItem
            icon="bell"
            title="Bildirimler"
            description="Şifre süresi dolduğunda hatırlat"
            isSwitch={true}
            value={settings.notifications}
            onValueChange={(value) => handleSettingChange('notifications', value)}
          />
        </View>

        {/* Veri Yönetimi */}
        <SectionHeader title="Veri Yönetimi" />
        <View style={[styles.settingsGroup, { backgroundColor: colors.cardBackground }]}>
          <SettingItem
            icon="cloud-upload-alt"
            title="Otomatik Yedekleme"
            description="Şifreleri otomatik olarak buluta yedekle"
            isSwitch={true}
            value={settings.autoBackup}
            onValueChange={(value) => handleSettingChange('autoBackup', value)}
          />
          <SettingItem
            icon="history"
            title="Şifre Geçerlilik Süresi"
            description="Şifrelerin süresi dolduğunda uyar"
            isSwitch={true}
            value={settings.passwordExpiry}
            onValueChange={(value) => handleSettingChange('passwordExpiry', value)}
          />
        </View>

        {/* Tehlikeli Bölge */}
        <SectionHeader title="Verileri sil" />
        <View style={[styles.settingsGroup, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
            <Icon name="trash-alt" size={20} color={colors.lowSecurity} />
            <Text style={[styles.dangerButtonText, { color: colors.lowSecurity }]}>Tüm Verileri Temizle</Text>
          </TouchableOpacity>
        </View>

        {/* Hesap */}
        <SectionHeader title="Hesap" />
        <View style={[styles.settingsGroup, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="sign-out-alt" size={20} color={colors.lowSecurity} />
            <Text style={[styles.logoutButtonText, { color: colors.lowSecurity }]}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        {/* Uygulama Bilgisi */}
        <View style={styles.appInfoContainer}>
          <Text style={[styles.appVersion, { color: colors.secondaryText }]}>Sürüm 1.0.0</Text>
          <Text style={[styles.copyright, { color: colors.secondaryText }]}>© 2024 Şifre Yöneticisi</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

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
  settingsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: '#8E8E93',
    marginTop: 25,
    marginBottom: 10,
    paddingLeft: 10
  },
  settingsGroup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7'
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  settingInfo: {
    flex: 1
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: "InterNormal",
    color: '#000'
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: "InterNormal",
    color: '#8E8E93',
    marginTop: 4
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'center'
  },
  dangerButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: "InterBold",
    marginLeft: 10
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'center'
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: "InterBold",
    marginLeft: 10
  },
  appInfoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30
  },
  appVersion: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: "InterNormal"
  },
  copyright: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: "InterNormal",
    marginTop: 5
  }
});