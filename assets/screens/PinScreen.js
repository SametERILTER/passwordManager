import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';

const PIN_STORAGE_KEY = '@password_manager_pin';

const PinScreen = ({ onAuthSuccess }) => {
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState('');
  const [isPinSetup, setIsPinSetup] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirmMode, setIsConfirmMode] = useState(false);
  
  // PIN'in daha önce ayarlanıp ayarlanmadığını kontrol et
  useEffect(() => {
    const checkPin = async () => {
      try {
        const savedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
        if (savedPin) {
          setStoredPin(savedPin);
          setIsPinSetup(true);
        }
      } catch (error) {
        console.log('PIN yüklenirken hata oluştu:', error);
      }
    };
    
    checkPin();
  }, []);
  
  const handleNumberPress = (number) => {
    if (pin.length < 4) {
      setPin(prev => prev + number);
    }
  };
  
  const handleDeletePress = () => {
    setPin(prev => prev.slice(0, -1));
  };
  
  const handleSubmit = async () => {
    if (pin.length !== 4) {
      Alert.alert('Hata', '4 haneli bir PIN kodu girmelisiniz.');
      return;
    }
    
    // PIN ayarlama modunda
    if (!isPinSetup) {
      // PIN'i ilk kez giriyorsa, doğrulama için ikinci kez girişe geç
      if (!isConfirmMode) {
        setConfirmPin(pin);
        setPin('');
        setIsConfirmMode(true);
        return;
      }
      
      // Doğrulama için PIN'i ikinci kez giriyor
      if (pin === confirmPin) {
        try {
          await AsyncStorage.setItem(PIN_STORAGE_KEY, pin);
          setIsPinSetup(true);
          setStoredPin(pin);
          onAuthSuccess();
        } catch (error) {
          console.log('PIN kaydedilirken hata oluştu:', error);
          Alert.alert('Hata', 'PIN kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
      } else {
        Alert.alert('Hata', 'PIN kodları eşleşmiyor. Lütfen tekrar deneyin.');
        setPin('');
        setConfirmPin('');
        setIsConfirmMode(false);
      }
    } 
    // PIN giriş modunda
    else {
      if (pin === storedPin) {
        onAuthSuccess();
      } else {
        Alert.alert('Hata', 'Yanlış PIN kodu. Lütfen tekrar deneyin.');
        setPin('');
      }
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
            i < pin.length ? styles.filledPinDot : null
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
                style={[styles.numButton, styles.submitButton]} 
                onPress={handleSubmit}
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
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {!isPinSetup 
            ? (isConfirmMode ? 'PIN Doğrula' : 'PIN Oluştur') 
            : 'PIN Gir'}
        </Text>
        <Text style={styles.subtitle}>
          {!isPinSetup 
            ? (isConfirmMode ? 'Oluşturduğunuz PIN kodunu tekrar girin' : 'Şifrelerinize erişmek için 4 haneli bir PIN kodu belirleyin') 
            : 'Şifrelerinize erişmek için PIN kodunuzu girin'}
        </Text>
      </View>
      
      <View style={styles.pinContainer}>
        {renderPinDots()}
      </View>
      
      {renderNumPad()}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const buttonSize = width / 5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(245, 245, 250)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: 'InterBold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'InterNormal',
    textAlign: 'center',
    color: '#666',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
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
  submitButton: {
    backgroundColor: '#007AFF',
  },
});

export default PinScreen;