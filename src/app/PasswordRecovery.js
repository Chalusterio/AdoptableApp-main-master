import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ImageBackground,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getAuth, sendPasswordResetEmail } from "firebase/auth"; // Import Firebase functions

export default function PasswordRecovery() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleRecovery = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      // User is not logged in, proceed with password reset
      if (email.trim()) {
        try {
          await sendPasswordResetEmail(auth, email);
          setMessage("A verification code has been sent to your email.");
        } catch (error) {
          setMessage("Error: " + error.message);
        }
      } else {
        setMessage("Please enter a valid email address.");
      }
    } else {
      setMessage(
        "You are already logged in. Please log out to reset your password."
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundContainer}>
        <ImageBackground
          source={require("../assets/Login/loginPawImage.png")}
          style={styles.loginPawImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.textOverlayContainer}>
        <Text style={styles.heading}>Password Recovery</Text>
        <Text style={styles.subText}>
          Please enter your email to reset your password.
        </Text>

        {/* Input container */}
        <View style={styles.inputContainer}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="flat"
            activeUnderlineColor="gray"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity
          onPress={handleRecovery}
          style={styles.button}
          activeOpacity={0.7} // This will make the button slightly fade when clicked
        >
          <Text style={styles.buttonText}>Send Reset Link</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("./Login")}>
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  backgroundContainer: {
    height: 300,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  loginPawImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
    width: "130%",
  },
  textOverlayContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: -50,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 40,
    fontFamily: "Lilita",
    color: "#68C2FF",
    textAlign: "center",
    marginBottom: 20,
  },
  subText: {
    fontSize: 16,
    fontFamily: "Lato",
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    width: "90%",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F3F3F3",
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    width: "90%",
    backgroundColor: "#EF5B5B",
    marginTop: 40,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backText: {
    fontFamily: "Lato",
    color: "gray",
    marginTop: 20,
    textAlign: "center",
  },
});
