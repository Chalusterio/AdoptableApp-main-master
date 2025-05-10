import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, Dimensions, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native'; // For navigation
import * as SplashScreen from 'expo-splash-screen';

const Splash = () => {
  const theme = useTheme();
  const navigation = useNavigation(); // Hook to handle navigation
  const [isLoading, setIsLoading] = useState(true); // State to control loading state

  // Handle splash screen and navigation after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigation.replace('Login'); // Replace splash screen with the login screen
    }, 2000); // Delay for 2 seconds

    return () => clearTimeout(timer); // Clean up the timer
  }, [navigation]);

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync(); // Prevent auto-hide of splash screen
    }
    prepare();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.splashContainer, { backgroundColor: theme.colors.primary }]}>
          <Image
            source={require('../assets/Splash/logoImage.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.taglineText}>Bringing paws and people together</Text>
          <Image
            source={require('../assets/Splash/splashImage.png')}
            style={styles.splashImage}
          />
        </View>
      </SafeAreaView>
    );
  }

  return null; // After the loading time, the screen will transition
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  splashContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center', // Center contents vertically
  },
  logoImage: {
    height: 70,
    width: 400,
    marginTop: 150,
  },
  taglineText: {
    fontSize: 18,
    color: '#68C2FF',
    marginTop: 20,
    fontStyle: 'Lato',
  },
  splashImage: {
    height: 550,
    width: 550,
    marginTop: 150,
  },
});

export default Splash;
