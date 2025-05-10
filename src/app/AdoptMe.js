import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router"; // Get params and router for navigation

const AdoptMe = () => {
  const { petName } = useLocalSearchParams(); // Get the petName from the previous screen
  const router = useRouter();

  useEffect(() => {
    // Set a timer to navigate back to the list screen after 3 seconds
    const timer = setTimeout(() => {
      router.push("/Main"); // Replace "/list" with your list screen route
    }, 3000);

    // Clear the timer on component unmount
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>You chose a loving pet!</Text>
        <Text style={styles.message}>
          Thank you for wanting to adopt {petName}. Check your notification tab
          and we’ll get back to you with an update soon!
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#68C2FF",
    padding: 16,
  },
  scrollContainer: {
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Lobster", // Using Lobster font
  },
  message: {
    fontSize: 18,
    color: "#FFF",
    textAlign: "center",
    fontFamily: "Lobster", // Using Lobster font
    marginHorizontal: 20,
  },
});

export default AdoptMe;
