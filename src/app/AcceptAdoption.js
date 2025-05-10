import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableWithoutFeedback } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // Importing necessary hooks
import * as SplashScreen from "expo-splash-screen";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

export default function AcceptAdoption() {
  const { adopterEmail, petName = "Pet" } = useLocalSearchParams(); // Getting params from the URL
  const [adopterName, setAdopterName] = useState("Adopter");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); // Using the router from expo-router

  useEffect(() => {
    async function fetchAdopterName() {
      const db = getFirestore();
      try {
        const q = query(
          collection(db, "users"),
          where("email", "==", adopterEmail)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setAdopterName(userData.name || "Adopter");
        } else {
          console.warn("No user found with the provided email.");
        }
      } catch (error) {
        console.error("Error fetching adopter's name:", error);
      }
    }

    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
      await fetchAdopterName();
      setTimeout(async () => {
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }, 3000);
    }

    prepare();
  }, [adopterEmail]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Finalizing details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handlePress = () => {
    // Navigate to /Main using router.push()
    router.push("/Main/Notification");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={styles.fullScreenContainer}>
          {/* Wrapping text elements inside <Text> components */}
          <Text style={styles.greetingsText}>
            You accepted {"\n"} {adopterName} as {petName}’s fur parent.
          </Text>
          <Text style={styles.instructionText}>
            {petName} is one step closer to a loving home. Get ready to finalize the adoption process!
          </Text>
          <Text style={styles.clickText}>
            Click anywhere to go back
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#68C2FF",
  },
  fullScreenContainer: {
    flex: 1, // Makes the container take up the entire screen
    justifyContent: "center", // Centers the content vertically
    alignItems: "center", // Centers the content horizontally
  },
  greetingsText: {
    fontSize: 25,
    fontFamily: "Lilita",
    color: "white",
    marginTop: 15,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 18,
    fontFamily: "Lato",
    color: "white",
    margin: 20,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1, // Takes up the full height
    justifyContent: "center", // Centers the loading indicator vertically
    alignItems: "center", // Centers the loading indicator horizontally
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "white",
  },
  clickText: {
    fontSize: 16,
    fontFamily: "Lato",
    color: "white",
    marginTop: 20,
    textAlign: "center",
    textDecorationLine: "underline", // Optional styling for emphasis
  },
});
