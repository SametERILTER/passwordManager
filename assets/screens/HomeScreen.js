import { StyleSheet, Text, View, TouchableOpacity, FlatList, Platform, Modal, Animated, Dimensions, StatusBar, TextInput, Keyboard } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { lightColors, darkColors } from '../colors/colors.js';

const { height } = Dimensions.get('window');

const HomeScreen = () => {
  const [passwords, setPasswords] = useState([]);
  const [securityScore, setSecurityScore] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'strong' or 'weak'
  const [filteredPasswords, setFilteredPasswords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);
  const [colorTheme, setColorTheme] = useState('light');

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Tab bar stilini tema değişikliğine göre güncelle
      NavigationBar.setStyle(colorTheme === 'light' ? 'dark' : 'light');
      NavigationBar.setBackgroundColorAsync(
        colorTheme === 'light' ? colors.background : colors.background
      );
      NavigationBar.setVisibilityAsync('visible');
      NavigationBar.setBehaviorAsync('inset-touch');
    }
  }, [colorTheme]);

  // Şifreleri AsyncStorage'dan çek
  const loadPasswords = async () => {
    try {
      const data = await AsyncStorage.getItem('passwords');
      if (data) {
        const parsedPasswords = JSON.parse(data);
        setPasswords(parsedPasswords);
        calculateSecurityScore(parsedPasswords);
      } else {
        setPasswords([]);
        setSecurityScore(0);
      }
    } catch (e) {
      setPasswords([]);
      setSecurityScore(0);
    }
  };

  // Şifre güvenlik puanını hesapla
  const calculateSecurityScore = (passwordList) => {
    if (!passwordList || passwordList.length === 0) {
      setSecurityScore(0);
      return;
    }

    // Her şifre için puan hesapla
    const scores = passwordList.map(item => {
      let passwordScore = 0;
      const password = item.password;

      // Uzunluk puanı (maksimum 30 puan)
      if (password.length >= 16) {
        passwordScore += 30;
      } else if (password.length >= 12) {
        passwordScore += 25;
      } else if (password.length >= 8) {
        passwordScore += 15;
      } else {
        passwordScore += 5;
      }

      // Karakter çeşitliliği puanı (her biri 15 puan, toplam 60 puan)
      if (/[A-Z]/.test(password)) passwordScore += 15; // Büyük harf
      if (/[a-z]/.test(password)) passwordScore += 15; // Küçük harf
      if (/[0-9]/.test(password)) passwordScore += 15; // Rakam
      if (/[^A-Za-z0-9]/.test(password)) passwordScore += 15; // Özel karakter

      // Tekrarlanan karakter cezası
      const repeatedChars = password.length - new Set(password.split('')).size;
      passwordScore -= repeatedChars * 2;

      // Ardışık karakter cezası
      let sequenceCount = 0;
      for (let i = 0; i < password.length - 1; i++) {
        if (password.charCodeAt(i + 1) - password.charCodeAt(i) === 1) {
          sequenceCount++;
        }
      }
      passwordScore -= sequenceCount * 2;

      // Minimum 0, maksimum 100 puan
      return Math.max(0, Math.min(100, passwordScore));
    });

    // Ortalama şifre puanını hesapla
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    setSecurityScore(Math.round(averageScore));
  };

  // Puan rengi belirle
  const getScoreColor = (score) => {
    if (score >= 75) return '#34C759'; // Yeşil (yüksek güvenlik)
    if (score >= 50) return '#FFCC00'; // Sarı (orta güvenlik)
    return '#FF3B30'; // Kırmızı (düşük güvenlik)
  };

  // Ekran her açıldığında şifreleri yükle
  useEffect(() => {
    if (isFocused) {
      loadPasswords();
    }
  }, [isFocused]);

  // Tema tercihini yükle
  const loadThemePreference = async () => {
    try {
      const settingsData = await AsyncStorage.getItem('settings');
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        setColorTheme(settings.darkMode ? 'dark' : 'light');
        console.log("renk seçildi");

      }
    } catch (e) {
      console.log('Tema tercihi yüklenirken hata:', e);
    }
  };

  // Aktif renkleri seç
  const colors = colorTheme === 'light' ? lightColors : darkColors;

  // useEffect içinde tema tercihini yükle
  useEffect(() => {
    loadThemePreference();
  }, []);

  // NavigationBar stilini tema değiştiğinde güncelle
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle(colorTheme === 'light' ? 'dark' : 'light');
      NavigationBar.setBackgroundColorAsync(
        colorTheme === 'light' ? colors.background : colors.background
      );
    }
  }, [colorTheme]);

  // Arama işlevi
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setSearchResults([]);
      return;
    }

    const filtered = passwords.filter(password =>
      password.service.toLowerCase().includes(text.toLowerCase()) ||
      password.username.toLowerCase().includes(text.toLowerCase()) ||
      (password.notes && password.notes.toLowerCase().includes(text.toLowerCase()))
    );
    setSearchResults(filtered);
  };

  // Search input açılışı için animasyonlar

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t) => t * t * t;
  const easeInBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  };

  // Arama açma animasyonu
  const openSearch = () => {
    setIsSearchActive(true);
    Keyboard.dismiss();

    // Animasyonları paralel çalıştır
    Animated.parallel([
      // Search input yukarı çıkma animasyonu (hızlı başlayıp yavaşlıyor)
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        // Ease out cubic - hızlı başlar, yavaş biter
        easing: easeOutCubic
      }),
      // Overlay fade in animasyonu
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Animasyon bitince input'a focus ver
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    });
  };

  // Arama kapatma animasyonu
  const closeSearch = () => {
    Keyboard.dismiss();

    Animated.parallel([
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: easeInCubic
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsSearchActive(false);
      setSearchQuery('');
      setSearchResults([]);
    });
  };

  // Modal'ı aç
  const openModal = (type) => {
    // Şifreleri filtrele
    if (type === 'strong') {
      const strongPasswords = passwords.filter(
        p =>
          p.password.length >= 12 &&
          /[A-Z]/.test(p.password) &&
          /[a-z]/.test(p.password) &&
          /[0-9]/.test(p.password) &&
          /[^A-Za-z0-9]/.test(p.password)
      );
      setFilteredPasswords(strongPasswords);
      setModalType('strong');
    } else if (type === 'weak') {
      const weakPasswords = passwords.filter(
        p =>
          p.password.length < 8 ||
          !/[A-Z]/.test(p.password) ||
          !/[a-z]/.test(p.password) ||
          !/[0-9]/.test(p.password)
      );
      setFilteredPasswords(weakPasswords);
      setModalType('weak');
    }

    setModalVisible(true);
    // Animasyon süresini ve easing fonksiyonunu güncelle
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20, // Yaylanma etkisini azalt
      mass: 1, // Kütle değerini düşür
      stiffness: 100, // Yay sertliğini azalt
      velocity: 0.5 // Başlangıç hızını ayarla
    }).start();
  };

  // Modal'ı kapat
  const closeModal = () => {
    // Kapatma animasyonunu da güncelle
    Animated.spring(slideAnim, {
      toValue: height,
      useNativeDriver: true,
      damping: 20,
      mass: 1,
      stiffness: 200,
      velocity: 0.5
    }).start(() => {
      setModalVisible(false);
    });
  };

  // Her bir şifre kartı için render fonksiyonu
  const renderPasswordItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.passwordItem,
        {
          backgroundColor: colors.cardBackground,
          shadowColor: colors.shadow
        }
      ]}
      onPress={() => navigation.navigate('PasswordDetail', { index, item })}
    >
      <View style={[
        styles.serviceIconContainer,
        {
          backgroundColor: item.categoryColor ? item.categoryColor + '20' : colors.border
        }
      ]}>
        <Icon
          name={item.icon || 'key'}
          size={20}
          color={item.categoryColor || colors.primary}
        />
      </View>
      <View style={styles.passwordInfo}>
        <Text style={[styles.serviceName, { color: colors.primaryText }]}>
          {item.service}
        </Text>
        <Text style={[styles.username, { color: colors.secondaryText }]}>
          {item.username}
        </Text>
      </View>
      <Icon name="chevron-right" size={16} color={colors.secondaryText} />
    </TouchableOpacity>
  );

  // Modal içindeki şifre kartları için render fonksiyonu
  const renderModalPasswordItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.modalPasswordItem,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border
        }
      ]}
      onPress={() => {
        closeModal();
        navigation.navigate('PasswordDetail', { index, item });
      }}
    >
      <View style={[
        styles.modalServiceIconContainer,
        {
          backgroundColor: item.categoryColor ? item.categoryColor + '20' : colors.border,
          borderColor: item.categoryColor || colors.border
        }
      ]}>
        <Icon
          name={item.icon || 'key'}
          size={20}
          color={item.categoryColor || (modalType === 'strong' ? colors.highSecurity : colors.lowSecurity)}
        />
      </View>
      <View style={styles.passwordInfo}>
        <Text style={[styles.serviceName, { color: colors.primaryText }]}>
          {item.service}
        </Text>
        <Text style={[styles.username, { color: colors.secondaryText }]}>
          {item.username}
        </Text>
        <View style={styles.passwordStrengthIndicator}>
          <Text style={[
            styles.strengthText,
            {
              color: modalType === 'strong' ? colors.highSecurity : colors.lowSecurity,
              backgroundColor: colors.border
            }
          ]}>
            {modalType === 'strong' ? 'Güçlü' : 'Zayıf'} Şifre
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={16} color={colors.secondaryText} />
    </TouchableOpacity>
  );

  const recentPasswords = passwords
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        barStyle={colorTheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20
        }
      ]}>
        {/* Üst Başlık Kısmı */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Şifre Yöneticisi</Text>
          <TouchableOpacity style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}>
            <Icon name="user-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Güvenlik Skoru */}
        <TouchableOpacity
          style={[
            styles.scoreContainer,
            {
              backgroundColor: colors.cardBackground,
              shadowColor: colors.shadow
            }
          ]}
          onPress={() => navigation.navigate("SecurityInfo")}
        >
          <View
            style={[
              styles.scoreCircle,
              { borderColor: getScoreColor(securityScore) }
            ]}
          >
            <Text style={[styles.scoreNumber, { color: getScoreColor(securityScore) }]}>
              {securityScore}
            </Text>
          </View>
          <View style={styles.scoreTextContainer}>
            <Text style={[styles.scoreTitle, { color: colors.primaryText }]}>
              Şifre Güvenlik Skoru
            </Text>
            <Text style={[styles.scoreDescription, { color: colors.secondaryText }]}>
              {securityScore >= 75
                ? 'Harika! Şifreleriniz oldukça güçlü.'
                : securityScore >= 50
                  ? 'İyi! Bazı şifrelerinizi güçlendirebilirsiniz.'
                  : 'Şifrelerinizi güçlendirmeniz gerekiyor.'}
            </Text>
            <View style={[styles.scoreBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.scoreProgress,
                  {
                    width: `${securityScore}%`,
                    backgroundColor: getScoreColor(securityScore)
                  }
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* İstatistikler */}
        <View style={styles.statsContainer}>
          <View style={[
            styles.statBox,
            {
              backgroundColor: colors.cardBackground,
              shadowColor: colors.shadow
            }
          ]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {passwords.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>
              Toplam Şifre
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.statBox,
              styles.strongBox,
              {
                backgroundColor: colors.strongPasswordBg,
                shadowColor: colors.shadow
              }
            ]}
            onPress={() => openModal('strong')}
          >
            <Text style={[styles.statNumber, { color: colors.highSecurity }]}>
              {
                passwords.filter(
                  p =>
                    p.password.length >= 12 &&
                    /[A-Z]/.test(p.password) &&
                    /[a-z]/.test(p.password) &&
                    /[0-9]/.test(p.password) &&
                    /[^A-Za-z0-9]/.test(p.password)
                ).length
              }
            </Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>
              Güçlü Şifre
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statBox,
              styles.weakBox,
              {
                backgroundColor: colors.weakPasswordBg,
                shadowColor: colors.shadow
              }
            ]}
            onPress={() => openModal('weak')}
          >
            <Text style={[styles.statNumber, { color: colors.lowSecurity }]}>
              {
                passwords.filter(
                  p =>
                    p.password.length < 8 ||
                    !/[A-Z]/.test(p.password) ||
                    !/[a-z]/.test(p.password) ||
                    !/[0-9]/.test(p.password)
                ).length
              }
            </Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>
              Zayıf Şifre
            </Text>
          </TouchableOpacity>
        </View>

        {/* Son Eklenenler */}
        <View style={[styles.recentSection, { backgroundColor: colors.background }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
              Son Eklenen Şifreler
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("AllPasswords")}>
              <Text style={[styles.seeAllButton, { color: colors.primary }]}>
                Tümünü Gör
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentPasswords}
            renderItem={renderPasswordItem}
            keyExtractor={(_, idx) => idx.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={{ justifyContent: "center", alignItems: "center", marginTop: 60 }}>
                <Icon name="folder-open" size={64} color={colors.secondaryText} />
                <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                  Henüz şifre eklenmedi.
                </Text>
              </View>
            }
          />
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddPassword')}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Hızlı Arama Çubuğu */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={[styles.searchButton, {
              backgroundColor: colors.cardBackground,
              shadowColor: colors.shadow
            }]}
            onPress={openSearch}
          >
            <Icon name="search" size={18} color={colors.secondaryText} />
            <Text style={[styles.searchPlaceholder, { color: colors.secondaryText }]}>
              Şifre ara...
            </Text>
          </TouchableOpacity>
        </View>

        {/* Şifre Modal */}
        <Modal
          animationType="none"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <TouchableOpacity
            style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
            activeOpacity={1}
            onPress={closeModal}
          >
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.modalBackground,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                style={styles.modalContent}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <Text style={[styles.modalTitle, { color: colors.primaryText }]}>
                    {modalType === 'strong' ? 'Güçlü Şifreler' : 'Zayıf Şifreler'}
                  </Text>
                  <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                    <Icon name="times" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                {filteredPasswords.length > 0 ? (
                  <FlatList
                    data={filteredPasswords}
                    renderItem={renderModalPasswordItem}
                    keyExtractor={(_, idx) => idx.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.modalListContainer}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Icon
                      name={modalType === 'strong' ? 'shield-alt' : 'shield-alt'}
                      size={40}
                      color={modalType === 'strong' ? '#34C759' : '#34C759'}
                    />
                    <Text style={styles.emptyText}>
                      {modalType === 'strong'
                        ? 'Henüz güçlü şifre bulunmuyor. Güçlü şifreler ekleyin!'
                        : 'Tebrikler! Zayıf şifre bulunmuyor.'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {/* Arama Overlay ve Input */}
        {isSearchActive && (
          <>
            {/* Overlay */}
            <Animated.View
              style={[
                styles.searchOverlay,
                {
                  opacity: overlayAnim,
                  backgroundColor: colors.modalOverlay
                }
              ]}
            >
              <TouchableOpacity style={styles.overlayTouchable} onPress={closeSearch} />
            </Animated.View>

            {/* Animated Search Input */}
            <Animated.View
              style={[
                styles.animatedSearchContainer,
                {
                  backgroundColor: colors.background,
                  transform: [
                    {
                      translateY: searchAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [height - 50, Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 80]
                      })
                    },
                    {
                      scale: searchAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1]
                      })
                    }
                  ],
                  opacity: searchAnim
                }
              ]}
            >
              <View style={[styles.searchInputContainer, {
                backgroundColor: colors.cardBackground,
                borderColor: colors.primary
              }]}>
                <Icon name="search" size={20} color={colors.secondaryText} />
                <TextInput
                  ref={searchInputRef}
                  style={[styles.searchInput, { color: colors.primaryText }]}
                  placeholder="Şifre ara..."
                  placeholderTextColor={colors.secondaryText}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoFocus={false}
                />
                <TouchableOpacity onPress={closeSearch} style={styles.searchCloseButton}>
                  <Icon name="times" size={18} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>

              {/* Arama Sonuçları */}
              {searchQuery.length > 0 && (
                <View style={[styles.searchResults, { backgroundColor: colors.background }]}>
                  {searchResults.length > 0 ? (
                    <FlatList
                      data={searchResults}
                      renderItem={({ item, index }) => (
                        <TouchableOpacity
                          style={[styles.searchResultItem, {
                            backgroundColor: colors.cardBackground,
                            borderBottomColor: colors.border
                          }]}
                          onPress={() => {
                            closeSearch();
                            navigation.navigate('PasswordDetail', { index, item });
                          }}
                        >
                          <View style={[
                            styles.serviceIconContainer,
                            { backgroundColor: item.categoryColor ? item.categoryColor + '20' : colors.border }
                          ]}>
                            <Icon
                              name={item.icon || 'key'}
                              size={18}
                              color={item.categoryColor || colors.primary}
                            />
                          </View>
                          <View style={styles.searchResultInfo}>
                            <Text style={[styles.searchResultService, { color: colors.primaryText }]}>
                              {item.service}
                            </Text>
                            <Text style={[styles.searchResultUsername, { color: colors.secondaryText }]}>
                              {item.username}
                            </Text>
                          </View>
                          <Icon name="chevron-right" size={14} color={colors.secondaryText} />
                        </TouchableOpacity>
                      )}
                      keyExtractor={(_, idx) => idx.toString()}
                      showsVerticalScrollIndicator={false}
                      style={styles.searchResultsList}
                    />
                  ) : (
                    <View style={styles.noResultsContainer}>
                      <Icon name="search" size={40} color={colors.secondaryText} />
                      <Text style={[styles.noResultsText, { color: colors.secondaryText }]}>
                        Arama sonucu bulunamadı
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 18
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "InterBold",
    color: '#000'
  },
  profileButton: {
    padding: 5
  },
  // Güvenlik Skoru Stilleri
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  scoreNumber: {
    fontSize: 24,
    fontFamily: "InterBold",
  },
  scoreTextContainer: {
    flex: 1
  },
  scoreTitle: {
    fontSize: 15,
    fontFamily: "InterBold",
    color: '#000',
    marginBottom: 5
  },
  scoreDescription: {
    fontSize: 13,
    fontFamily: "InterNormal",
    color: '#8E8E93',
    marginBottom: 10
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden'
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 10
  },
  statBox: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 16,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  strongBox: {
    backgroundColor: '#E5FAE7', // Açık yeşil arka plan
    borderWidth: 0,
    borderColor: '#34C759'
  },
  weakBox: {
    backgroundColor: '#FFE5E5', // Açık kırmızı arka plan
    borderWidth: 0,
    borderColor: '#FF3B30'
  },
  statNumber: {
    fontSize: 24,
    fontFamily: "InterBold",
    color: '#007AFF'
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "InterBold",
    color: '#8E8E93',
    marginTop: 4
  },
  recentSection: {
    flex: 1,
    backgroundColor: 'rgb(245, 245, 250)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "InterBold",
    color: '#000'
  },
  seeAllButton: {
    color: '#007AFF',
    fontSize: 15,
    fontFamily: "InterNormal",
  },
  listContainer: {
    paddingBottom: 80,
  },
  passwordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    marginHorizontal: 5,
    elevation: 2
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  passwordInfo: {
    flex: 1,
    marginLeft: 15
  },
  serviceName: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: '#000'
  },
  username: {
    fontSize: 14,
    fontFamily: "InterNormal",
    color: '#8E8E93',
    marginTop: 4
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 5
  },
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
    maxHeight: height * 0.8,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    position: 'relative'
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    position: 'absolute',
    top: 8
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "InterBold",
    color: '#000',
    textAlign: 'center'
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalListContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120
  },
  modalPasswordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1
  },
  modalServiceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1
  },
  passwordStrengthIndicator: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center'
  },
  strengthText: {
    fontSize: 12,
    fontFamily: "InterBold",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    fontFamily: "InterNormal",
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22
  },

  // Ana arama container
  searchContainer: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    width: "68%"
  },

  // Arama butonu
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  // Arama placeholder metni
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: "InterNormal",
    color: '#8E8E93',
    flex: 1,
  },

  // Arama overlay (arka plan karartma)
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
  },

  // Overlay dokunma alanı
  overlayTouchable: {
    flex: 1,
  },

  // Animasyonlu arama container
  animatedSearchContainer: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 1001,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  // Arama input container
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 0,
    borderColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 15,
  },

  // Arama input field
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: "InterNormal",
    color: '#000',
  },

  // Arama kapatma butonu
  searchCloseButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Arama sonuçları container
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 15,
    maxHeight: 350,
    overflow: 'hidden',
  },

  // Arama sonuçları listesi
  searchResultsList: {
    maxHeight: 350,
  },

  // Arama sonucu item
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },

  // Arama sonucu bilgi container
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },

  // Arama sonucu servis adı
  searchResultService: {
    fontSize: 16,
    fontFamily: "InterBold",
    color: '#000',
  },

  // Arama sonucu kullanıcı adı
  searchResultUsername: {
    fontSize: 14,
    fontFamily: "InterNormal",
    color: '#8E8E93',
    marginTop: 2,
  },

  // Sonuç bulunamadı container
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },

  // Sonuç bulunamadı metni
  noResultsText: {
    marginTop: 15,
    fontSize: 16,
    fontFamily: "InterNormal",
    color: '#8E8E93',
    textAlign: 'center',
  },
});