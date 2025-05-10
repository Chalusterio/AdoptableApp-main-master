import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  useTheme,
  TextInput,
  Checkbox,
  Dialog,
  Portal,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Font from "expo-font";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store"; // For storing credentials securely
import { getUserData } from "./config/firebase";
import { auth, signInWithEmailAndPassword } from "./config/firebase"; // Firebase imports
import { persistSession } from "./config/firebase";

export default function Login() {
  const theme = useTheme();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const router = useRouter();

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        Lilita: require("../assets/fonts/LilitaOne-Regular.ttf"),
      });
      setFontsLoaded(true);
    };
    loadFonts();

    // Check if "Remember Me" is stored in SecureStore
    const checkRememberMe = async () => {
      const storedEmail = await SecureStore.getItemAsync("email");
      const storedPassword = await SecureStore.getItemAsync("password");
      if (storedEmail && storedPassword) {
        setEmail(storedEmail);
        setPassword(storedPassword);
        setRememberMe(true);
      }
    };
    checkRememberMe();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setErrors({ email: "", password: "" });
    }, [])
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const validateInputs = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };

    if (!email) {
      newErrors.email = "Email is required";
      valid = false;
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        newErrors.email = "Please enter a valid email address";
        valid = false;
      }
    }
    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRememberMe = async () => {
    if (rememberMe) {
      await SecureStore.deleteItemAsync("email");
      await SecureStore.deleteItemAsync("password");
    } else {
      await SecureStore.setItemAsync("email", email);
      await SecureStore.setItemAsync("password", password);
    }
    setRememberMe(!rememberMe);
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await persistSession(user);

      // Fetch user data from Firestore
      const userData = await getUserData(user.uid);

      if (userData) {
        setDialogVisible(true); // Show success dialog on successful login
        if (userData.role !== "admin") {
          router.push("Main");
        } else {
          router.push("ManageTrack");
        }
        setEmail("");
        setPassword("");
      } else {
        setErrors({
          ...errors,
          email: "User data not found. Contact support.",
        });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setErrors({ ...errors, password: "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  const hideDialog = () => setDialogVisible(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.backgroundContainer}>
            <ImageBackground
              source={require("../assets/Login/loginPawImage.png")}
              style={styles.loginPawImage}
              resizeMode="cover"
            ></ImageBackground>
          </View>

          <View style={styles.textOverlayContainer}>
            <Text style={styles.welcomeBackText}>Welcome Back!</Text>
            <Text style={styles.loginText}>Login to your account</Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.inputContainer}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                left={<TextInput.Icon icon="email" />}
                mode="flat"
                activeUnderlineColor="gray"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, errors.email && styles.errorInput]}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                right={<TextInput.Icon icon={passwordVisible ? "eye" : "eye-off"} onPress={() => setPasswordVisible(!passwordVisible)} />}
                left={<TextInput.Icon icon="lock" />}
                mode="flat"
                autoCapitalize="none"
                activeUnderlineColor="gray"
                style={[styles.input, errors.password && styles.errorInput]}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.rememberForgotContainer}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity style={styles.rememberCheck} onPress={handleRememberMe}>
                  <Checkbox status={rememberMe ? "checked" : "unchecked"} onPress={handleRememberMe} color="gray" />
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => router.push("PasswordRecovery")}>
                <Text style={styles.forgotText}>Forgot Password</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && { opacity: 0.5 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.loginButtonText}>Login</Text>}
            </TouchableOpacity>

            <View style={styles.noAccountContainer}>
              <Text style={styles.noAccountText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push("Signup")}>
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dialog */}
          <Portal>
            <Dialog visible={dialogVisible} onDismiss={hideDialog}>
              <Dialog.Icon icon="check-circle" color="#68C2FF" />
              <Dialog.Title style={styles.dialogTitle}>Success</Dialog.Title>
              <Dialog.Content style={styles.dialogContent}>
                <Text style={styles.dialogText}>Logged in successfully!</Text>
              </Dialog.Content>
              <Dialog.Actions style={styles.dialogActions}>
                <TouchableOpacity
                  onPress={hideDialog}
                  style={styles.dialogButton}
                >
                  <Text style={styles.dialogButtonText}>Done</Text>
                </TouchableOpacity>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    flexDirection: "column",
  },
  backgroundContainer: {
    height: 300, // Set fixed height for the background image
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
    marginTop: -180,
  },
  welcomeBackText: {
    fontSize: 50,
    fontFamily: "Lilita",
    color: "#68C2FF",
    textAlign: "center",
    marginTop: 100,
  },
  loginText: {
    fontFamily: "Lato",
    fontSize: 18,
    marginTop: 10,
    textAlign: "center",
  },
  formContainer: {
    flex: 1, // Take the remaining space after the background container
    width: "100%",
    alignItems: "center",
    marginTop: 80,
  },
  inputContainer: {
    width: "90%",
    marginTop: -40,
  },
  input: {
    backgroundColor: "#F3F3F3",
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  rememberForgotContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    marginTop: -10,
  },
  rememberCheck: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainer: {
    marginLeft: -8,
  },
  rememberText: {
    fontFamily: "Lato",
    color: "gray",
  },
  forgotText: {
    fontFamily: "Lato",
    color: "gray",
  },
  loginButton: {
    width: "90%",
    backgroundColor: "#EF5B5B",
    marginTop: 40,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
  loginButtonText: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "white",
  },
  noAccountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 100,
  },
  noAccountText: {
    fontFamily: "Lato",
  },
  signupButtonText: {
    fontFamily: "Lato",
    color: "gray",
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 20,
    fontFamily: "Lato",
  },
  //dialog
  dialogTitle: {
    textAlign: "center", // Center align the title
    fontFamily: "Lato",
    fontSize: 30,
  },
  dialogContent: {
    alignItems: "center", // Center align the content
    justifyContent: "center", // Center vertically
  },
  dialogText: {
    textAlign: "center",
    fontSize: 15,
  },
  dialogActions: {
    justifyContent: "center", // Center align the actions (button)
    alignItems: "center", // Center horizontally
  },
  dialogButton: {
    backgroundColor: "#68C2FF", // Set the background color
    width: 150, // Set the width of the button
    height: 50, // Set the height of the button
    borderRadius: 25, // Set the border radius for rounded corners
    justifyContent: "center", // Center align text inside button
    alignItems: "center", // Center align text inside button
  },
  dialogButtonText: {
    textAlign: "center",
    fontSize: 15,
    color: "white",
    fontFamily: "Lato",
  },
});
