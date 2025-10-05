import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';

const PIN_STORAGE_KEY = '@password_manager_pin';
const MODAL_HEIGHT = 400;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PinModal = ({ visible, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState('');
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  
  useEffect(() => {
    const loadPin = async () => {
      try {
        const savedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
        if (savedPin) {
          setStoredPin(savedPin);
        } else {
          // Eğer PIN yoksa direkt başarılı sayılır
          if (visible) {
            onSuccess();
            onClose();
          }
        }
      } catch (error) {
        console.log('PIN yüklenirken hata oluştu:', error);
      }
    };
    
    loadPin();
  }, [visible]);
  
  useEffect(() => {
    if (visible) {
      setPin('');
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT - MODAL_HEIGHT,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);
  
  const handleNumberPress = (number) => {
    if (pin.length < 4) {
      setPin(prev => prev + number);
    }
  };
  
  const handleDeletePress = () => {
    setPin(prev => prev.slice(0, -1));
  };
  
  const handleVerify = () => {
    if (pin === storedPin) {
      onSuccess();
      onClose();
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
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalPinOverlay}>
        <TouchableOpacity 
          style={styles.pinDismissArea} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.modalPinContainer,
          ]}
        >
          <View style={styles.modalPinHandle}></View>
          
          <Text style={styles.pinTitle}>PIN Doğrulama</Text>
          <Text style={styles.pinSubTitle}>Şifreyi görüntülemek için PIN kodunuzu girin</Text>
          
          <View style={styles.pinContainer}>
            {renderPinDots()}
          </View>
          
          {renderNumPad()}
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const buttonSize = width / 5;

const styles = StyleSheet.create({
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
    height: 800,
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
});

export default PinModal;