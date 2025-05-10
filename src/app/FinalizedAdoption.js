import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams  } from 'expo-router';
import { useNavigation } from '@react-navigation/native'; // For navigation
import * as SplashScreen from 'expo-splash-screen';

export default function PaidAdoption({ }) {
  const router = useRouter();

  const navigation = useNavigation(); // Hook to handle navigation
  const [isLoading, setIsLoading] = useState(true); // State to control loading state

  // Handle splash screen and navigation after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      router.push('/Main/Notification'); // Navigate to Notification tab
    }, 5000); // Delay for 5 seconds

    return () => clearTimeout(timer); // Clean up the timer
  }, [navigation]);

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync(); // Prevent auto-hide of splash screen
    }
    prepare();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.greetingsText}>Your new pet is excited to meet you!</Text>
        <Text style={styles.instructionText}>Please check your notification tab for further updates. Thank You!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#68C2FF",
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingsText: {
    fontSize: 25, 
    fontFamily: 'Lilita',
    color: 'white',
    marginTop: 15,
  },
  instructionText: {
    fontSize: 18, 
    fontFamily: 'Lato',
    color: 'white',
    margin: 20,
    textAlign: 'center',
  },
});