import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../colors/colors.js';

const SecurityInfoScreen = () => {
  const navigation = useNavigation();
  const [colorTheme, setColorTheme] = useState('light');

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        borderBottomColor: colors.border 
      }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.cardBackground }]} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Şifre Güvenliği</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Bölümü */}
        <View style={[styles.heroSection, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.heroImageContainer, { backgroundColor: colors.cardBackground }]}>
            <Icon name="shield-alt" size={60} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.primaryText }]}>Daha Güvenli Şifreler</Text>
          <Text style={[styles.heroSubtitle, { color: colors.secondaryText }]}>
            Şifrelerinizi korumak için şifre güvenliği hakkında bilmeniz gerekenler
          </Text>
        </View>

        {/* İçerik Bölümleri */}
        <View style={[styles.contentSection, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Şifre Güvenlik Skoru Nedir?</Text>
          <Text style={[styles.paragraph, { color: colors.secondaryText }]}>
            Şifre güvenlik skoru, şifrelerinizin genel güvenlik düzeyini gösteren 0-100 arasında bir değerdir. 
            Bu skor, şifre uzunluğu, karakter çeşitliliği, tekrarlanan karakterler ve ardışık karakterler gibi 
            çeşitli faktörlere dayalı olarak hesaplanır.
          </Text>

          <View style={[styles.infoBox, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.infoHeader}>
              <Icon name="info-circle" size={18} color={colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.primaryText }]}>Güvenli Şifrenin Özellikleri</Text>
            </View>
            <Text style={[styles.infoParagraph, { color: colors.secondaryText }]}>
              En az 12 karakter uzunluğunda, büyük harf, küçük harf, rakam ve özel karakterler içeren şifreler 
              en yüksek puanı alır. Tekrarlanan karakterlerden ve ardışık sayılardan kaçınmak puanınızı artırır.
            </Text>
          </View>
        </View>

        <View style={[styles.contentSection, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Şifre Güvenliği İpuçları</Text>
          
          <View style={styles.tipItem}>
            <View style={[styles.tipIconContainer, { backgroundColor: colors.cardBackground }]}>
              <Icon name="ruler" size={20} color={colors.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.primaryText }]}>Uzunluk Önemlidir</Text>
              <Text style={[styles.tipDescription, { color: colors.secondaryText }]}>
                En az 12 karakter uzunluğunda şifreler oluşturun. Uzun şifreler kaba kuvvet saldırılarına karşı daha dayanıklıdır.
              </Text>
            </View>
          </View>

          <View style={styles.tipItem}>
            <View style={[styles.tipIconContainer, { backgroundColor: colors.cardBackground }]}>
              <Icon name="random" size={20} color={colors.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.primaryText }]}>Karmaşıklık</Text>
              <Text style={[styles.tipDescription, { color: colors.secondaryText }]}>
                Büyük/küçük harfler, rakamlar ve özel karakterler kullanın. Karakter çeşitliliği şifrenizi tahmin edilmesi zor hale getirir.
              </Text>
            </View>
          </View>

          <View style={styles.tipItem}>
            <View style={[styles.tipIconContainer, { backgroundColor: colors.cardBackground }]}>
              <Icon name="redo" size={20} color={colors.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.primaryText }]}>Benzersizlik</Text>
              <Text style={[styles.tipDescription, { color: colors.secondaryText }]}>
                Her hesap için farklı şifreler kullanın. Bir hesabın güvenliği ihlal edilirse, diğer hesaplarınız güvende kalır.
              </Text>
            </View>
          </View>

          <View style={styles.tipItem}>
            <View style={[styles.tipIconContainer, { backgroundColor: colors.cardBackground }]}>
              <Icon name="sync" size={20} color={colors.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.primaryText }]}>Düzenli Güncelleyin</Text>
              <Text style={[styles.tipDescription, { color: colors.secondaryText }]}>
                Şifrelerinizi en az 3 ayda bir değiştirin. Düzenli güncellemeler güvenlik ihlallerinin etkisini sınırlar.
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.contentSection, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Kötü Şifre Örnekleri</Text>
          <Text style={[styles.paragraph, { color: colors.secondaryText }]}>
            Aşağıdaki şifre tiplerinden kaçının:
          </Text>
          
          <View style={styles.badExampleContainer}>
            <View style={[styles.badExample, { backgroundColor: colors.lowSecurity + '20' }]}>
              <Icon name="times-circle" size={16} color={colors.lowSecurity} />
              <Text style={[styles.badExampleText, { color: colors.lowSecurity }]}>123456</Text>
            </View>
            <View style={[styles.badExample, { backgroundColor: colors.lowSecurity + '20' }]}>
              <Icon name="times-circle" size={16} color={colors.lowSecurity} />
              <Text style={[styles.badExampleText, { color: colors.lowSecurity }]}>qwerty</Text>
            </View>
            <View style={[styles.badExample, { backgroundColor: colors.lowSecurity + '20' }]}>
              <Icon name="times-circle" size={16} color={colors.lowSecurity} />
              <Text style={[styles.badExampleText, { color: colors.lowSecurity }]}>password</Text>
            </View>
            <View style={[styles.badExample, { backgroundColor: colors.lowSecurity + '20' }]}>
              <Icon name="times-circle" size={16} color={colors.lowSecurity} />
              <Text style={[styles.badExampleText, { color: colors.lowSecurity }]}>abc123</Text>
            </View>
            <View style={[styles.badExample, { backgroundColor: colors.lowSecurity + '20' }]}>
              <Icon name="times-circle" size={16} color={colors.lowSecurity} />
              <Text style={[styles.badExampleText, { color: colors.lowSecurity }]}>doğum tarihleri</Text>
            </View>
          </View>
        </View>

        <View style={[styles.contentSection, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>İdeal Şifre Stratejisi</Text>
          <Text style={[styles.paragraph, { color: colors.secondaryText }]}>
            En iyi uygulama, her hesap için güçlü ve benzersiz şifreler kullanmaktır. 
            Bu uygulama gibi güvenli bir şifre yöneticisi kullanmak, tüm şifrelerinizi güvenli ve organize bir şekilde saklamanıza yardımcı olur.
          </Text>

          <View style={[styles.infoBox, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.infoHeader}>
              <Icon name="lightbulb" size={18} color={colors.mediumSecurity} />
              <Text style={[styles.infoTitle, { color: colors.primaryText }]}>Öneri</Text>
            </View>
            <Text style={[styles.infoParagraph, { color: colors.secondaryText }]}>
              Uzun parolalar (birkaç kelimenin birleşimi) hatırlaması kolay ama tahmin edilmesi zor olabilir. 
              Örneğin: "Mavi-Araba42!Yolda" gibi bir şifre hem güçlü hem de hatırlaması kolaydır.
            </Text>
          </View>
        </View>

        <View style={[styles.contentSection, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>İki Faktörlü Kimlik Doğrulama</Text>
          <Text style={[styles.paragraph, { color: colors.secondaryText }]}>
            Mümkün olan her yerde iki faktörlü kimlik doğrulama (2FA) kullanın. Bu, şifreniz ele geçirilse bile hesabınızı koruyacak ikinci bir güvenlik katmanı ekler.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SecurityInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'InterBold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#F8F8F8',
  },
  heroImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: 'InterBold',
    color: '#000',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'InterNormal',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  contentSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'InterBold',
    color: '#000',
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 16,
    fontFamily: 'InterNormal',
    color: '#3A3A3C',
    lineHeight: 24,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'InterBold',
    color: '#000',
  },
  infoParagraph: {
    fontSize: 15,
    fontFamily: 'InterNormal',
    color: '#3A3A3C',
    lineHeight: 22,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontFamily: 'InterBold',
    color: '#000',
    marginBottom: 5,
  },
  tipDescription: {
    fontSize: 15,
    fontFamily: 'InterNormal',
    color: '#3A3A3C',
    lineHeight: 21,
  },
  badExampleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  badExample: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    padding: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  badExampleText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'InterNormal',
    color: '#FF3B30',
  },
});