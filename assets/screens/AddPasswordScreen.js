import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  Switch, 
  Alert, 
  ToastAndroid, 
  ScrollView,
  Platform 
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../colors/colors.js';

// Bilinen servisler ve ikon isimleri eşleştirmesi
const SERVICE_ICONS = {
  instagram: 'instagram',
  facebook: 'facebook',
  google: 'google',
  gmail: 'google',
  youtube: 'youtube',
  twitter: 'twitter',
  linkedin: 'linkedin',
  github: 'github',
  whatsapp: 'whatsapp',
  telegram: 'telegram',
  snapchat: 'snapchat',
  amazon: 'amazon',
  apple: 'apple',
  microsoft: 'windows',
  outlook: 'envelope',
  netflix: 'netflix',
  spotify: 'spotify',
};

// Kategori tanımlamaları
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

// CATEGORIES tanımlamasının altına kategori renklerini ekleyelim
const CATEGORY_COLORS = {
  shopping: '#FF9500', // Turuncu
  bank: '#34C759',     // Yeşil
  food: '#FF3B30',     // Kırmızı
  game: '#5856D6',     // Mor
  default: '#0A84FF'   // Mavi (varsayılan)
};

// Şifre güçlülük hesaplama fonksiyonu
function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: 'Zayıf', color: '#FF3B30', width: '33%' };
  if (score <= 4) return { label: 'Orta', color: '#FF9500', width: '66%' };
  return { label: 'Güçlü', color: '#34C759', width: '100%' };
}

const AddPasswordScreen = ({ navigation }) => {
  // State tanımlamaları
  const [service, setService] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [biometricModalVisible, setBiometricModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [colorTheme, setColorTheme] = useState('light');

  // Şifre oluşturma ayarları
  const [length, setLength] = useState(12);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumber, setUseNumber] = useState(true);
  const [useSymbol, setUseSymbol] = useState(true);
  const [useBiometric, setUseBiometric] = useState(false);

  // Fokslanmış inputlar için state'ler
  const [isServiceFocused, setIsServiceFocused] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const serviceInputRef = useRef(null);

  // Tema tercihini yükle
  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    // Ekran açıldığında servis adı inputuna odaklan
    if (serviceInputRef.current) {
      serviceInputRef.current.focus();
    }
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

  // Aktif renkleri seç
  const colors = colorTheme === 'light' ? lightColors : darkColors;

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
    setModalVisible(false);
  };

  // Şifre güçlülük bilgisi
  const strength = getPasswordStrength(password);

  // Kaydet fonksiyonu
  const handleSave = async () => {
    if (!service.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }

    const serviceKey = service.trim().toLowerCase();
    let icon = SERVICE_ICONS[serviceKey];
    let categoryColor = CATEGORY_COLORS.default; // Varsayılan renk

    if (!icon && selectedCategory) {
      const category = CATEGORIES.find(cat => cat.id === selectedCategory);
      if (category) {
        icon = category.icon;
        categoryColor = CATEGORY_COLORS[selectedCategory] || CATEGORY_COLORS.default;
      }
    }

    if (!icon) {
      icon = 'key';
    }

    try {
      const newEntry = { 
        service, 
        username, 
        password, 
        icon, 
        useBiometric,
        category: selectedCategory,
        categoryColor: categoryColor // Yeni eklenen alan
      };
      
      const existing = await AsyncStorage.getItem('passwords');
      let passwords = [];
      if (existing) {
        passwords = JSON.parse(existing);
      }
      passwords.unshift(newEntry);
      await AsyncStorage.setItem('passwords', JSON.stringify(passwords));
      ToastAndroid.show('Şifre eklendi.', ToastAndroid.SHORT);
      setService('');
      setUsername('');
      setPassword('');
      setSelectedCategory(null);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hata', 'Şifre kaydedilemedi!');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Başlık */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Şifre Ekle</Text>
      </View>

      {/* Ana içerik */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Servis Adı Girişi */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Servis Adı</Text>
            <View style={[
              styles.inputWrapper,
              { 
                backgroundColor: colors.cardBackground,
                borderColor: isServiceFocused ? colors.primary : "rgba(0,0,0,0)"
              }
            ]}>
              <Icon name="globe" size={20} color={colors.secondaryText} style={styles.inputIcon} />
              <TextInput
                ref={serviceInputRef}
                style={[styles.input, { color: colors.primaryText }]}
                placeholder="Örn: Facebook, Instagram..."
                value={service}
                onChangeText={setService}
                placeholderTextColor={colors.secondaryText}
                onFocus={() => setIsServiceFocused(true)}
                onBlur={() => setIsServiceFocused(false)}
                autoFocus // Bu satırı ekle
              />
            </View>
          </View>

          {/* Kullanıcı Adı Girişi */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Kullanıcı Adı</Text>
            <View style={[
              styles.inputWrapper,
              { 
                backgroundColor: colors.cardBackground,
                borderColor: isUsernameFocused ? colors.primary : "rgba(0,0,0,0)" // Sadece renk değişiyor
              }
            ]}>
              <Icon name="user" size={20} color={colors.secondaryText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.primaryText }]}
                placeholder="E-posta veya kullanıcı adı"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor={colors.secondaryText}
                autoCapitalize="none"
                onFocus={() => setIsUsernameFocused(true)}
                onBlur={() => setIsUsernameFocused(false)}
              />
            </View>
          </View>

          {/* Şifre Girişi */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Şifre</Text>
            <View style={[
              styles.inputWrapper,
              { 
                backgroundColor: colors.cardBackground,
                borderColor: isPasswordFocused ? colors.primary : "rgba(0,0,0,0)"
              }
            ]}>
              <Icon name="key" size={20} color={colors.secondaryText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.primaryText }]}
                placeholder="Şifrenizi girin"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                placeholderTextColor={colors.secondaryText}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.visibilityButton}
              >
                <Icon
                  name={isPasswordVisible ? "eye-slash" : "eye"}
                  size={20}
                  color={colors.secondaryText}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.inlineGenerateButton}
              >
                <Icon name="sync" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Şifre Güçlülük Göstergesi */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={[styles.strengthBarBg, { backgroundColor: colors.border }]}>
                  <View style={[
                    styles.strengthBar,
                    { backgroundColor: strength.color, width: strength.width }
                  ]} />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

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
              onValueChange={setUseBiometric}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={useBiometric ? colors.primary : colors.cardBackground}
            />
          </View>

          {/* Kategori Seçimi */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.primaryText }]}>Kategori (İsteğe Bağlı)</Text>
            <TouchableOpacity
              style={[styles.categoryButton, { backgroundColor: colors.cardBackground }]}
              onPress={() => setCategoryModalVisible(true)}
            >
              <View style={styles.categoryButtonContent}>
                {selectedCategory ? (
                  <>
                    <Icon name={CATEGORIES.find(cat => cat.id === selectedCategory)?.icon} size={20} color={CATEGORY_COLORS[selectedCategory]} />
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
        </View>
      </ScrollView>

      {/* Sabit Kaydet Butonu */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.highSecurity }]} 
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </TouchableOpacity>
      </View>

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

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.primaryText }]}>Büyük Harf</Text>
              <Switch 
                value={useUpper} 
                onValueChange={setUseUpper}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={useUpper ? colors.primary : colors.cardBackground}
              />
            </View>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.primaryText }]}>Küçük Harf</Text>
              <Switch 
                value={useLower} 
                onValueChange={setUseLower}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={useLower ? colors.primary : colors.cardBackground}
              />
            </View>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.primaryText }]}>Rakam</Text>
              <Switch 
                value={useNumber} 
                onValueChange={setUseNumber}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={useNumber ? colors.primary : colors.cardBackground}
              />
            </View>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.primaryText }]}>Özel Karakter</Text>
              <Switch 
                value={useSymbol} 
                onValueChange={setUseSymbol}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={useSymbol ? colors.primary : colors.cardBackground}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleGenerate}
            >
              <Icon name="magic" size={18} color="#fff" />
              <Text style={styles.modalButtonText}>Oluştur</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.secondaryText }]}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Biyometrik Modal */}
      <Modal
        visible={biometricModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setBiometricModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.primaryText }]}>Biyometrik Şifre Koruması</Text>
            
            <Text style={[styles.modalDescription, { color: colors.secondaryText }]}>
              Biyometrik şifre koruması olan şifreler görüntülenmek istendiğinde ekstra bir biyometrik doğrulama gerektirir. Bu da şifrelerinizin daha güvenli olmasını sağlar. Cihazınızda parmak izi yoksa pin istenir.
            </Text>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.primaryText }]}>Biyometrik Koruma</Text>
              <Switch 
                value={useBiometric} 
                onValueChange={setUseBiometric}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={useBiometric ? colors.primary : colors.cardBackground}
              />
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setBiometricModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.secondaryText }]}>Kapat</Text>
            </TouchableOpacity>
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
                  selectedCategory === category.id && { 
                    backgroundColor: CATEGORY_COLORS[category.id] + '20' // Seçili kategori rengini hafif transparan yap
                  }
                ]}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setCategoryModalVisible(false);
                }}
              >
                <View style={styles.categoryOptionContent}>
                  <Icon 
                    name={category.icon} 
                    size={20} 
                    color={CATEGORY_COLORS[category.id]} // İkon rengini kategori rengi yap
                  />
                  <Text style={[styles.categoryOptionText, { color: colors.primaryText }]}>
                    {category.name}
                  </Text>
                </View>
                {selectedCategory === category.id && (
                  <Icon 
                    name="check" 
                    size={20} 
                    color={CATEGORY_COLORS[category.id]} // Check ikonunun rengini kategori rengi yap
                  />
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
    </View>
  );
};

export default AddPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "InterBold",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontFamily: "InterBold",
    marginBottom: 12
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1.8 // Sabit border
    // backgroundColor dinamik olarak componentte veriliyor
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    fontFamily: "InterNormal",
  },
  visibilityButton: {
    padding: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 36,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: "InterBold",
    marginLeft: 12
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  saveButton: {
    backgroundColor: '#34C759',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: "InterBold",
  },
  strengthContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  strengthBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  strengthBar: {
    height: 8,
    borderRadius: 6,
  },
  strengthLabel: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "InterBold",
    marginBottom: 28,
    alignSelf: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontFamily: "InterBold",
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: "InterNormal",
    marginBottom: 30,
    lineHeight: 22,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 18,
  },
  modalButtonText: {
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
  modalCancelText: {
    fontSize: 15,
    fontFamily: "InterBold",
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
  securityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // Dinamik olarak yukarıda veriliyor
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
  },
  securitySubtitle: {
    fontSize: 12,
    fontFamily: "InterNormal",
    marginTop: 2,
  },
  inlineGenerateButton: {
    padding: 10,
    marginLeft: 2,
  },
});