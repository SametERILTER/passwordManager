import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert, ScrollView, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { lightColors, darkColors } from '../colors/colors.js';

const CATEGORIES = [
  {
    id: 'all',
    name: 'Tümü',
    icon: 'list'
  },
  {
    id: 'favorites',
    name: 'Favoriler',
    icon: 'star'
  },
  {
    id: 'shopping',
    name: 'Alışveriş',
    icon: 'shopping-cart'
  },
  {
    id: 'bank',
    name: 'Banka',
    icon: 'university'
  },
  {
    id: 'food',
    name: 'Yemek',
    icon: 'utensils'
  },
  {
    id: 'game',
    name: 'Oyun',
    icon: 'gamepad'
  }
];

// Kategori renklerini tanımlayalım (en üste ekleyin)
const CATEGORY_COLORS = {
  shopping: '#FF9500', // Turuncu
  bank: '#34C759',     // Yeşil
  food: '#FF3B30',     // Kırmızı
  game: '#5856D6',     // Mor
  default: '#0A84FF'   // Mavi (varsayılan)
};

const AllPasswordsScreen = () => {
  const [passwords, setPasswords] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [colorTheme, setColorTheme] = useState('light');
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  // Animasyon için useRef
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const loadPasswords = async () => {
    try {
      const data = await AsyncStorage.getItem('passwords');
      if (data) {
        setPasswords(JSON.parse(data));
      } else {
        setPasswords([]);
      }
    } catch (e) {
      setPasswords([]);
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

  // Aktif renkleri seç
  const colors = colorTheme === 'light' ? lightColors : darkColors;

  useEffect(() => {
    if (isFocused) {
      loadPasswords();
    }
    loadThemePreference();
  }, [isFocused]);

  // Scroll event handler
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: ({ nativeEvent }) => {
        const offsetY = nativeEvent.contentOffset.y;
        // 80px scroll olduktan sonra header'ı göster
        if (offsetY > 80) {
          Animated.timing(headerOpacity, {
            toValue: 0.98,
            duration: 50,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.timing(headerOpacity, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }).start();
        }
      }
    }
  );

  // Ana başlığın animasyonu
  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Filtrelenmiş şifreler
  const filteredPasswords = passwords.filter(p => {
    // Arama filtresi
    const matchesSearch = 
      p.service.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase());
    
    // Kategori ve favori filtresi
    let matchesFilter = true;
    if (filterMode === 'favorites') {
      matchesFilter = p.isFavorite;
    } else if (filterMode !== 'all') {
      matchesFilter = p.category === filterMode;
    }
    
    return matchesSearch && matchesFilter;
  });

  // Şifreyi favori olarak işaretle
  const toggleFavorite = async (index) => {
    const updatedPasswords = [...passwords];
    updatedPasswords[index].isFavorite = !updatedPasswords[index].isFavorite;
    
    try {
      await AsyncStorage.setItem('passwords', JSON.stringify(updatedPasswords));
      setPasswords(updatedPasswords);
    } catch (e) {
      Alert.alert('Hata', 'Favori durumu güncellenirken bir hata oluştu.');
    }
  };

  const renderPasswordItem = ({ item, index }) => (
    <View style={styles.passwordItemContainer}>
      <TouchableOpacity
        style={[styles.passwordItem, { backgroundColor: colors.cardBackground }]}
        onPress={() => navigation.navigate('PasswordDetail', { 
          index: passwords.findIndex(p => p.service === item.service && p.username === item.username), 
          item 
        })}
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
          <Text style={[styles.serviceName, { color: colors.primaryText }]}>{item.service}</Text>
          <Text style={[styles.username, { color: colors.secondaryText }]}>{item.username}</Text>
        </View>
        <Icon name="chevron-right" size={16} color={colors.secondaryText} />
      </TouchableOpacity>
      
      {/* Favori butonu */}
      <TouchableOpacity 
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(passwords.findIndex(
          p => p.service === item.service && p.username === item.username
        ))}
      >
        <Icon 
          name="star" 
          solid={item.isFavorite}
          size={18} 
          color={item.isFavorite ? "#FFD700" : colors.secondaryText} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        translucent={true}
        backgroundColor="transparent"
        style={colorTheme === 'light' ? 'dark-content' : 'light-content'}
      />
      
      {/* Sabit Header - Scroll sonrası görünür */}
      <Animated.View 
        style={[
          styles.fixedHeader, 
          { 
            backgroundColor: colors.background,
            opacity: headerOpacity,
            borderBottomColor: colors.border
          }
        ]}
      >
        <Text style={[styles.fixedHeaderTitle, { color: colors.primaryText }]}>
          Tüm Şifreler
        </Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Ana Başlık - Animasyonlu */}
        <Animated.View 
          style={[
            styles.pageTitleContainer,
            {
              transform: [{ translateY: titleTranslateY }],
              opacity: titleOpacity,
            }
          ]}
        >
          <Text style={[styles.pageTitle, { color: colors.primaryText }]}>Tüm Şifreler</Text>
        </Animated.View>
        
        {/* Arama Çubuğu */}
        <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
          <Icon name="search" size={18} color={colors.secondaryText} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.primaryText }]}
            placeholder="Servis veya kullanıcı adı ara..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={colors.secondaryText}
          />
        </View>
        
        {/* Filtre Butonları */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.filterButton,
                  { backgroundColor: colors.border },
                  filterMode === category.id && { 
                    backgroundColor: (CATEGORY_COLORS[category.id] || colors.primary) + '20' 
                  }
                ]}
                onPress={() => setFilterMode(category.id)}
              >
                <Icon 
                  name={category.icon} 
                  size={14} 
                  color={filterMode === category.id ? 
                    (CATEGORY_COLORS[category.id] || colors.primary) : 
                    colors.secondaryText
                  } 
                  solid={category.id === 'favorites' && filterMode === 'favorites'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[
                  styles.filterButtonText,
                  { color: colors.secondaryText },
                  filterMode === category.id && { 
                    color: CATEGORY_COLORS[category.id] || colors.primary 
                  }
                ]}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Şifre listesi */}
        <View style={styles.listContainer}>
          {filteredPasswords.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon 
                name={filterMode === 'favorites' ? "star" : 
                      filterMode === 'all' ? "lock" : 
                      CATEGORIES.find(cat => cat.id === filterMode)?.icon || "lock"} 
                size={50} 
                color={colors.secondaryText} 
              />
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                {filterMode === 'favorites' 
                  ? 'Henüz favori şifreniz yok'
                  : filterMode === 'all'
                    ? 'Henüz şifre eklenmedi'
                    : `${CATEGORIES.find(cat => cat.id === filterMode)?.name} kategorisinde şifre bulunmuyor`}
              </Text>
              <Text style={[styles.emptySubText, { color: colors.secondaryText }]}>
                {filterMode === 'favorites' 
                  ? 'Sık kullandığınız şifreleri favorilere ekleyebilirsiniz'
                  : filterMode === 'all'
                    ? 'Şifre eklemek için ana sayfadaki + butonuna tıklayın'
                    : 'Bu kategoriye şifre eklemek için ana sayfadaki + butonuna tıklayın'}
              </Text>
            </View>
          ) : (
            filteredPasswords.map((item, index) => (
              <View key={index} style={styles.passwordItemContainer}>
                <TouchableOpacity
                  style={[styles.passwordItem, { backgroundColor: colors.cardBackground }]}
                  onPress={() => navigation.navigate('PasswordDetail', { 
                    index: passwords.findIndex(p => p.service === item.service && p.username === item.username), 
                    item 
                  })}
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
                    <Text style={[styles.serviceName, { color: colors.primaryText }]}>{item.service}</Text>
                    <Text style={[styles.username, { color: colors.secondaryText }]}>{item.username}</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={colors.secondaryText} />
                </TouchableOpacity>
                
                {/* Favori butonu */}
                <TouchableOpacity 
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(passwords.findIndex(
                    p => p.service === item.service && p.username === item.username
                  ))}
                >
                  <Icon 
                    name="star" 
                    solid={item.isFavorite}
                    size={18} 
                    color={item.isFavorite ? "#FFD700" : colors.secondaryText} 
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default AllPasswordsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(245, 245, 250)",
    paddingTop: 25,
  },
  // Sabit header stilleri
  fixedHeader: {
    position: 'absolute',
    top: 25,
    left: 0,
    right: 0,
    height: 35,
    paddingBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  fixedHeaderTitle: {
    fontSize: 18,
    fontFamily: "InterBold",
    color: "#000",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  pageTitleContainer: {
    width: "100%",
    paddingLeft: 20,
    paddingTop: 10,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "InterBold",
    color: "#000",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 18,
    paddingHorizontal: 16,
    height: 44,
    elevation: 1
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "InterNormal",
    color: "#222",
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#F2F2F7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: "InterNormal",
    color: '#8E8E93',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  passwordItemContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  passwordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    elevation: 2
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  passwordInfo: {
    flex: 1,
    marginLeft: 15
  },
  serviceName: {
    fontSize: 17,
    fontFamily: "InterBold",
    color: '#000'
  },
  username: {
    fontSize: 14,
    fontFamily: "InterNormal",
    color: '#8E8E93',
    marginTop: 4
  },
  favoriteButton: {
    position: 'absolute',
    top: 18,
    right: 28,
    zIndex: 1,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "InterBold",
    color: '#8E8E93',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: "InterNormal",
    color: '#AEAEB2',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  }
});