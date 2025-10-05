import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ToastAndroid, Platform, Modal, Switch, Dimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useLayoutEffect, useEffect } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as LocalAuthentication from 'expo-local-authentication';
import PinModal from './PinModal';
import { lightColors, darkColors } from '../colors/colors.js';

const CATEGORIES = [
  {
    id: 'shopping',
    name: 'Alışveriş sitesi',
    icon: 'shopping-cart'
  },
  {
    id: 'bank',
    name: 'Banka',
    icon: 'university'
  },
  {
    id: 'food',
    name: 'Yemek uygulaması',
    icon: 'utensils'
  },
  {
    id: 'game',
    name: 'Oyun',
    icon: 'gamepad'
  }
];

const PasswordDetailScreen = ({ route, navigation }) => {
  const { index, item } = route.params;
  const [service, setService] = useState(item.service);
  const [username, setUsername] = useState(item.username);
  const [password, setPassword] = useState(item.password);
  const [useBiometric, setUseBiometric] = useState(item.useBiometric);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [length, setLength] = useState(12);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumber, setUseNumber] = useState(true);
  const [useSymbol, setUseSymbol] = useState(true);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState('');
  const PIN_STORAGE_KEY = '@password_manager_pin';
  const MODAL_HEIGHT = 400;
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const [colorTheme, setColorTheme] = useState('light');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(item.category || null);


  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometric(hasHardware && isEnrolled);
    } catch (error) {
      console.log("Biyometrik kontrol hatası:", error);
      setHasBiometric(false);
    }
  };

  useEffect(() => {
    const loadPin = async () => {
      try {
        const savedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
        if (savedPin) {
          setStoredPin(savedPin);
        } else {
          // Eğer PIN yoksa direkt başarılı sayılır
        }
      } catch (error) {
        console.log('PIN yüklenirken hata oluştu:', error);
      }
    };

    loadPin();
  },);

  const handleNumberPress = (number) => {
    if (pin.length < 4) {
      setPin(prev => prev + number);
    }
  };

  const handleDeletePress = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleVerify = (process) => {
    if (pin === storedPin) {
      handlePinSuccess();
      setPinModalVisible(false);
      setPin('');
    } else {
      Alert.alert('Hata', 'Yanlış PIN kodu. Lütfen tekrar deneyin.');
      setPin('');
    }
  };

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < 4; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            i < pin.length ? styles.filledPinDot : {}
          ]}
        />
      );
    }
    return dots;
  };

  const renderNumPad = () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'delete', 0, 'submit'];

    return (
      <View style={styles.numPad}>
        {numbers.map((item, index) => {
          if (item === 'delete') {
            return (
              <TouchableOpacity
                key={index}
                style={styles.numButton}
                onPress={handleDeletePress}
              >
                <Icon name="backspace" size={24} color="#333" />
              </TouchableOpacity>
            );
          }

          if (item === 'submit') {
            return (
              <TouchableOpacity
                key={index}
                style={[styles.numButton, styles.pinSubmitButton]}
                onPress={handleVerify}
                disabled={pin.length !== 4}
              >
                <Icon name="check" size={24} color="#fff" />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={index}
              style={styles.numButton}
              onPress={() => handleNumberPress(item.toString())}
            >
              <Text style={styles.numText}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const handleUpdate = async () => {
    try {
      const existing = await AsyncStorage.getItem('passwords');
      let passwords = [];
      if (existing) {
        passwords = JSON.parse(existing);
      }
      passwords[index] = {
        ...passwords[index],
        service,
        username,
        password,
        useBiometric,
        category: selectedCategory,
        icon: selectedCategory ? CATEGORIES.find(cat => cat.id === selectedCategory)?.icon : 'key'
      };
      await AsyncStorage.setItem('passwords', JSON.stringify(passwords));
      ToastAndroid.show('Şifre güncellendi.', ToastAndroid.SHORT);
      setIsChanged(false);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hata', 'Şifre güncellenemedi!');
    }
  };

  // Şifreyi silme fonksiyonu
  const handleDelete = async () => {
    Alert.alert(
      "Şifreyi Sil",
      "Bu şifreyi silmek istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              const existing = await AsyncStorage.getItem('passwords');
              let passwords = [];
              if (existing) {
                passwords = JSON.parse(existing);
              }
              passwords.splice(index, 1); // ilgili şifreyi sil
              await AsyncStorage.setItem('passwords', JSON.stringify(passwords));
              Alert.alert('Başarılı', 'Şifre silindi!');
              navigation.goBack();
            } catch (e) {
              Alert.alert('Hata', 'Şifre silinemedi!');
            }
          }
        }
      ]
    );
  };

  // Şifreyi panoya kopyala
  const handleCopy = async () => {
    await Clipboard.setStringAsync(password);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Şifre panoya kopyalandı.', ToastAndroid.SHORT);
    } else {
      Alert.alert('Kopyalandı', 'Şifre panoya kopyalandı.');
    }
  };

  const handleShowPassword = async () => {
    // Biyometrik koruma seçiliyse

    if (!isPasswordVisible) {
      if (useBiometric) {
        // Cihaz biyometrik kimlik doğrulamayı destekliyorsa
        if (hasBiometric) {
          console.log("Parmak izi doğrulaması isteniyor");
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Parmak izi ile giriş yapın',
            fallbackLabel: 'Şifre Kullan',
            cancelLabel: 'İptal',
            disableDeviceFallback: true,
          });

          if (result.success) {
            console.log("Parmak izi tanıması başarılı, şifre gösteriliyor");
            setIsPasswordVisible(!isPasswordVisible);
          }
        }
        // Cihaz biyometrik kimlik doğrulamayı desteklemiyorsa PIN sorulur
        else {
          console.log("Parmak izi yok, PIN doğrulaması isteniyor");
          setPinModalVisible(true);
        }
      }
      // Biyometrik koruma seçili değilse direkt şifreyi göster
      else {
        setIsPasswordVisible(!isPasswordVisible);
      }
    }

    else {
      setIsPasswordVisible(!isPasswordVisible);
    }

  };

  // PIN doğrulaması başarılı olduğunda şifreyi göster
  const handlePinSuccess = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Şifre oluşturma fonksiyonu
  const generatePassword = () => {
    let chars = '';
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumber) chars += '0123456789';
    if (useSymbol) chars += '!@#$%^&*()_+-=';
    if (!chars) return '';

    let generated = '';
    for (let i = 0; i < length; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return generated;
  };

  const handleGenerate = () => {
    const newPass = generatePassword();
    setPassword(newPass);
    setIsChanged(true);
    setModalVisible(false);
  };

  // Biyometrik koruma ayarını değiştirme
  const handleBiometricToggle = async (value) => {
    if (useBiometric) {
      if (hasBiometric) {
        console.log("Parmak izi doğrulaması isteniyor");
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Parmak izi ile giriş yapın',
          fallbackLabel: 'Şifre Kullan',
          cancelLabel: 'İptal',
          disableDeviceFallback: true,
        });

        if (result.success) {
          console.log("Parmak izi tanıması başarılı, biyometrik koruma ayarı değiştirildi");
          setUseBiometric(value);
          setIsChanged(true);
        }
      }
      // Cihaz biyometrik kimlik doğrulamayı desteklemiyorsa PIN sorulur
      else {
        console.log("Parmak izi yok, PIN doğrulaması isteniyor");
        setPinModalVisible(true);
        setUseBiometric(value);
        setIsChanged(true);
      }
    }

    else {
      setUseBiometric(value);
      setIsChanged(true);
    }
  };

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Şifre Detayı',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 10, padding: 10 }}
        >
          <Icon name="chevron-left" size={20} color={colors.primary} />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.primary,
    });
  }, [navigation, colors.primary, colors.background]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent={true}
        backgroundColor={colors.background}
        style={colorTheme === 'dark' ? 'light' : 'dark'}
      />

      {/* Geri Tuşu */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Icon name="arrow-left" size={20} color={colors.primary} />
      </TouchableOpacity>

      <Text style={[styles.pageTitle, { color: colors.primaryText }]}>Şifre Detayları</Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Servis Adı</Text>
        <View style={[styles.inputWrapper, { backgroundColor: colors.cardBackground }]}>
          <Icon name="globe" size={20} color={colors.secondaryText} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.primaryText }]}
            value={service}
            onChangeText={t => { setService(t); setIsChanged(true); }}
            placeholderTextColor={colors.secondaryText}
          />
        </View>
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Kullanıcı Adı</Text>
        <View style={[styles.inputWrapper, { backgroundColor: colors.cardBackground }]}>
          <Icon name="user" size={20} color={colors.secondaryText} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.primaryText }]}
            value={username}
            onChangeText={t => { setUsername(t); setIsChanged(true); }}
            autoCapitalize="none"
            placeholderTextColor={colors.secondaryText}
          />
        </View>
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Şifre</Text>
        <View style={[styles.inputWrapper, { backgroundColor: colors.cardBackground }]}>
          <Icon name="key" size={20} color={colors.secondaryText} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.primaryText }]}
            value={password}
            onChangeText={t => { setPassword(t); setIsChanged(true); }}
            secureTextEntry={!isPasswordVisible}
            placeholderTextColor={colors.secondaryText}
          />
          <TouchableOpacity
            onPress={() => handleShowPassword()}
            style={styles.visibilityButton}
          >
            <Icon
              name={isPasswordVisible ? "eye-slash" : "eye"}
              size={20}
              color={colors.secondaryText}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCopy}
            style={styles.copyButton}
          >
            <Icon name="clipboard" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
        {/* Şifre Oluştur Butonu */}
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="random" size={18} color="#fff" />
          <Text style={styles.generateButtonText}>Şifre Oluştur</Text>
        </TouchableOpacity>
      </View>

      {/* Biyometrik koruma seçeneği */}
      <View style={[styles.securityOption, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.securityTextContainer}>
          <Icon name="fingerprint" size={20} color={colors.primary} style={styles.securityIcon} />
          <View>
            <Text style={[styles.securityTitle, { color: colors.primaryText }]}>Biyometrik Koruma</Text>
            <Text style={[styles.securitySubtitle, { color: colors.secondaryText }]}>
              Şifreyi görüntülemek için biyometrik doğrulama gerekir
            </Text>
          </View>
        </View>
        <Switch
          value={useBiometric}
          onValueChange={handleBiometricToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={useBiometric ? colors.primary : colors.cardBackground}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.primaryText }]}>Kategori (İsteğe Bağlı)</Text>
        <TouchableOpacity
          style={[styles.categoryButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => setCategoryModalVisible(true)}
        >
          <View style={styles.categoryButtonContent}>
            {selectedCategory ? (
              <>
                <Icon name={CATEGORIES.find(cat => cat.id === selectedCategory)?.icon} size={20} color={colors.primary} />
                <Text style={[styles.categoryButtonText, { color: colors.primaryText }]}>
                  {CATEGORIES.find(cat => cat.id === selectedCategory)?.name}
                </Text>
              </>
            ) : (
              <>
                <Icon name="folder" size={20} color={colors.secondaryText} />
                <Text style={[styles.categoryButtonText, { color: colors.secondaryText }]}>
                  Kategori Seç
                </Text>
              </>
            )}
          </View>
          <Icon name="chevron-right" size={16} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isChanged ? 1 : 0.5 }]}
        onPress={handleUpdate}
        disabled={!isChanged}
      >
        <Text style={styles.saveButtonText}>Güncelle</Text>
      </TouchableOpacity>
      {/* Silme butonu */}
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: colors.lowSecurity }]}
        onPress={handleDelete}
      >
        <Text style={styles.deleteButtonText}>Sil</Text>
      </TouchableOpacity>

      <View style={{ width: "100%", height: 100 }}></View>

      {/* Şifre Oluşturma Modalı */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.primaryText }]}>Şifre Oluştur</Text>
            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.primaryText }]}>Uzunluk: {length}</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setLength(Math.max(6, length - 1))}>
                <Icon name="minus" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLength(Math.min(32, length + 1))} style={{ marginLeft: 10 }}>
                <Icon name="plus" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSwitchRow}>
              <Text style={[styles.modalLabel, { color: colors.primaryText }]}>Büyük Harf</Text>
              <Switch
                value={useUpper}
                onValueChange={setUseUpper}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={useUpper ? colors.primary : colors.cardBackground}
              />
            </View>
            <View style={styles.modalSwitchRow}>
              <Text style={[styles.modalLabel, { color: colors.primaryText }]}>Küçük Harf</Text>
              <Switch
                value={useLower}
                onValueChange={setUseLower}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={useLower ? colors.primary : colors.cardBackground}
              />
            </View>
            <View style={styles.modalSwitchRow}>
              <Text style={[styles.modalLabel, { color: colors.primaryText }]}>Rakam</Text>
              <Switch
                value={useNumber}
                onValueChange={setUseNumber}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={useNumber ? colors.primary : colors.cardBackground}
              />
            </View>
            <View style={styles.modalSwitchRow}>
              <Text style={[styles.modalLabel, { color: colors.primaryText }]}>Özel Karakter</Text>
              <Switch
                value={useSymbol}
                onValueChange={setUseSymbol}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={useSymbol ? colors.primary : colors.cardBackground}
              />
            </View>
            <TouchableOpacity
              style={[styles.modalGenerateButton, { backgroundColor: colors.primary }]}
              onPress={handleGenerate}
            >
              <Icon name="magic" size={18} color="#fff" />
              <Text style={styles.modalGenerateButtonText}>Oluştur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalCancelButtonText, { color: colors.secondaryText }]}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIN Doğrulama Modalı */}
      <Modal
        visible={pinModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={[styles.modalPinOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalPinContainer, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.modalPinHandle, { backgroundColor: colors.border }]}></View>

            <Text style={[styles.pinTitle, { color: colors.primaryText }]}>PIN Doğrulama</Text>
            <Text style={[styles.pinSubTitle, { color: colors.secondaryText }]}>
              Şifreyi görüntülemek için PIN kodunuzu girin
            </Text>

            <View style={styles.pinContainer}>
              {renderPinDots()}
            </View>

            {renderNumPad()}
          </View>
        </View>
      </Modal>

      {/* Kategori Seçim Modalı */}
      <Modal
        visible={categoryModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.primaryText }]}>Kategori Seç</Text>
            
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  selectedCategory === category.id && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setCategoryModalVisible(false);
                  setIsChanged(true);
                }}
              >
                <View style={styles.categoryOptionContent}>
                  <Icon name={category.icon} size={20} color={colors.primary} />
                  <Text style={[styles.categoryOptionText, { color: colors.primaryText }]}>
                    {category.name}
                  </Text>
                </View>
                {selectedCategory === category.id && (
                  <Icon name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.secondaryText }]}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PasswordDetailScreen;

const { width } = Dimensions.get('window');
const buttonSize = width / 5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontFamily: "InterBold",
    color: '#000',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    fontFamily: "InterNormal"
  },
  visibilityButton: {
    padding: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: "InterBold",
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: "InterBold",
    color: "#000",
    marginBottom: 24,
    marginTop: 0,
    marginLeft: 45,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: "InterBold",
  },
  copyButton: {
    padding: 10,
    marginLeft: 2,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 10,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: "InterBold",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "InterBold",
    color: '#222',
    marginBottom: 18,
    alignSelf: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 16,
    color: '#222',
    fontFamily: "InterBold",
    fontWeight: '500',
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 2,
  },
  modalGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 18,
  },
  modalGenerateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: "InterBold",
    marginLeft: 10,
  },
  modalCancelButton: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
  },
  modalCancelButtonText: {
    color: '#8E8E93',
    fontSize: 15,
    fontFamily: "InterNormal",
    fontWeight: '500',
  },
  securityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  securityTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: "75%"
  },
  securityIcon: {
    marginRight: 15,
  },
  securityTitle: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: '#000',
  },
  securitySubtitle: {
    fontSize: 12,
    fontFamily: "InterNormal",
    color: '#666',
    marginTop: 2,
  },

  modalPinOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  pinDismissArea: {
    flex: 1,
  },
  modalPinContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 700,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  modalPinHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 20,
  },
  pinTitle: {
    fontSize: 22,
    fontFamily: 'InterBold',
    marginBottom: 10,
    color: '#333',
  },
  pinSubTitle: {
    fontSize: 16,
    fontFamily: 'InterNormal',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginHorizontal: 10,
  },
  filledPinDot: {
    backgroundColor: '#007AFF',
  },
  numPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: width * 0.8,
  },
  numButton: {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  numText: {
    fontSize: 24,
    fontFamily: 'InterBold',
    color: '#333',
  },
  pinSubmitButton: {
    backgroundColor: '#007AFF',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    padding: 7,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginTop: 8,
  },
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 16,
    fontFamily: "InterNormal",
    marginLeft: 10,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryOptionText: {
    fontSize: 16,
    fontFamily: "InterNormal",
    marginLeft: 10,
  },
  modalCancelText: {
    color: '#8E8E93',
    fontSize: 15,
    fontFamily: "InterNormal",
    fontWeight: '500',
  },
});