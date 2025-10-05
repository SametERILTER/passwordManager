import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './assets/colors/colors.js';

import FirstWelcomeScreen from './assets/screens/FirstWelcomeScreen';
import HomeScreen from './assets/screens/HomeScreen';
import AddPasswordScreen from './assets/screens/AddPasswordScreen';
import PasswordDetailScreen from './assets/screens/PasswordDetailScreen';
import AllPasswordsScreen from './assets/screens/AllPasswordsScreen';
import SettingsScreen from './assets/screens/SettingsScreen';
import AuthScreen from './assets/screens/AuthScreen';
import SecurityInfoScreen from './assets/screens/SecurityInfoScreen';
import GeneratePasswordScreen from './assets/screens/GeneratePasswordScreen';
import ProfileScreen from './assets/screens/ProfileScreen.js';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AllPasswordsStackNav = createNativeStackNavigator();

// Ana ekran stack navigator'ı
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="AddPassword" component={AddPasswordScreen} />
      <Stack.Screen name="PasswordDetail" component={PasswordDetailScreen} />
      <Stack.Screen name="AllPasswords" component={AllPasswordsScreen} />
      <Stack.Screen name="SecurityInfo" component={SecurityInfoScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function AllPasswordsStack() {
  return (
    <AllPasswordsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AllPasswordsStackNav.Screen name="AllPasswords" component={AllPasswordsScreen} />
      <AllPasswordsStackNav.Screen name="PasswordDetail" component={PasswordDetailScreen} />
    </AllPasswordsStackNav.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'InterNormal': require('./assets/fonts/Inter_24pt-Medium.ttf'),
    'InterBold': require('./assets/fonts/Inter_24pt-Bold.ttf'),
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(null);
  const [colorTheme, setColorTheme] = useState('light');

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle('dark');
      NavigationBar.setBackgroundColorAsync('rgb(245, 245, 250))');
      NavigationBar.setVisibilityAsync('visible');
      NavigationBar.setBehaviorAsync('inset-touch');
    }

    const checkFirstOpen = async () => {
      const hasSeen = await AsyncStorage.getItem('hasSeenWelcome');
      setShowWelcome(hasSeen === null); // true → ilk açılış
    };

    checkFirstOpen();
  }, []);

  useEffect(() => {
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
    loadThemePreference();
  }, []);

  const colors = colorTheme === 'light' ? lightColors : darkColors;

  if (!fontsLoaded || showWelcome === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  if (showWelcome) {
    return (
      <FirstWelcomeScreen
        onContinue={async () => {
          await AsyncStorage.setItem('hasSeenWelcome', 'true');
          setShowWelcome(false);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar 
        translucent 
        backgroundColor={colors.background} 
        style={colorTheme === 'light' ? 'dark' : 'light'} 
      />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.background,
              height: 60,
              paddingBottom: 0,
              elevation: 0,
              borderTopWidth: 0,
              borderTopColor: colors.border,
            },
            tabBarActiveTintColor: colors.tabBarActiveTintColor,
            tabBarInactiveTintColor: colors.tabBarInactiveTintColor,
          }}
        >
          <Tab.Screen
            name="Ana Sayfa"
            component={HomeStack}
            options={{
              tabBarIcon: ({ color }) => (
                <Icon name="home" size={22} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Şifreler"
            component={AllPasswordsStack}
            options={{
              tabBarIcon: ({ color }) => (
                <Icon name="key" size={22} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Şifre Üret"
            component={GeneratePasswordScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <Icon name="magic" size={22} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Ayarlar"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <Icon name="cog" size={22} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
