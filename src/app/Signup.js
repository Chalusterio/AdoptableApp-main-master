import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { TextInput, useTheme, Dialog, Portal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Font from "expo-font";
import { useRouter } from "expo-router";
import { registerUser, isEmailVerified } from "./config/firebase"; // Import new function

export default function Signup() {
  const theme = useTheme();
  const router = useRouter();

  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isOrganization, setIsOrganization] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false); // Loading state
  const [isVerifying, setIsVerifying] = useState(false); // State to handle email verification
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    organizationName: "",
    email: "",
    contactNumber: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        Lilita: require("../assets/fonts/LilitaOne-Regular.ttf"),
      });
      setFontsLoaded(true);
    };
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Validation function for individual fields
  const validateField = (field, value) => {
    let errorMessage = "";

    if (field === "firstName") {
      if (!value.trim()) {
        errorMessage = `First name is required`;
      }
    }

    if (field === "lastName") {
      if (!value.trim()) {
        errorMessage = `Last name is required`;
      }
    }

    if (field === "email") {
      if (!value.trim()) {
        errorMessage = "Email is required";
      } else {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
          errorMessage = "Please enter a valid email address";
        }
      }
    }

    if (field === "contactNumber") {
      if (!value.trim()) {
        errorMessage = "Contact number is required";
      } else if (!/^\d+$/.test(value)) {
        errorMessage = "Contact number must contain only numbers";
      }
    }

    if (field === "password") {
      if (!value) {
        errorMessage = "Password is required";
      } else if (value.length < 6) {
        errorMessage = "Password must be at least 6 characters long";
      } else if (!/[A-Z]/.test(value)) {
        errorMessage = "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(value)) {
        errorMessage = "Password must contain at least one lowercase letter";
      } else if (!/\d/.test(value)) {
        errorMessage = "Password must contain at least one number";
      }
    }

    if (field === "confirmPassword") {
      if (value !== password) {
        errorMessage = "Passwords do not match";
      }
    }

    if (field === "organizationName" && isOrganization) {
      if (!value.trim()) {
        errorMessage = "Organization name is required";
      }
    }

    return errorMessage;
  };

  // Handle input change and validate field
  const handleInputChange = (field, value) => {
    if (field === "firstName") setFirstName(value);
    if (field === "lastName") setLastName(value);
    if (field === "organizationName") setOrganizationName(value);
    if (field === "email") setEmail(value);
    if (field === "contactNumber") setContactNumber(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);

    // Update error for the field in real-time
    setErrors((prevErrors) => ({
      ...prevErrors,
      [field]: validateField(field, value),
    }));
  };
  
  const handleSignup = async () => {
    let valid = true;
    const newErrors = {
      firstName: validateField("firstName", firstName),
      lastName: validateField("lastName", lastName),
      email: validateField("email", email),
      contactNumber: validateField("contactNumber", contactNumber),
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
    };

    // Validate organizationName if signing up as an organization
    if (isOrganization) {
      newErrors.organizationName = validateField(
        "organizationName",
        organizationName
      );
      // For organizations, we don't need firstName and lastName
      newErrors.firstName = newErrors.lastName = null; // Remove these for organization signup
    } else {
      // For individuals, make sure firstName and lastName are not null
      newErrors.firstName = validateField("firstName", firstName);
      newErrors.lastName = validateField("lastName", lastName);
    }

    // Check if there are any errors
    Object.values(newErrors).forEach((error) => {
      if (error) valid = false;
    });

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    setIsSigningUp(true); // Set loading state to true

    const name = isOrganization ? organizationName : `${firstName} ${lastName}`;
    const role = isOrganization ? "organization" : "individual"; // Set the role based on signup type

    try {
      const user = await registerUser(
        email,
        password,
        name,
        contactNumber,
        role
      );

      setDialogVisible(true); // Show success dialog
      setIsVerifying(true); // Inform user to check their email for verification

      // Start polling for email verification status
      pollEmailVerification(user);

      // Reset all fields
      setFirstName("");
      setLastName("");
      setOrganizationName("");
      setEmail("");
      setContactNumber("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.log("Registration error:", error.message);
      setErrors((prevErrors) => ({
        ...prevErrors,
        email: error.message,
      }));
    } finally {
      setIsSigningUp(false); // Reset loading state after process
    }
  };

  const pollEmailVerification = async (user) => {
    const intervalId = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        clearInterval(intervalId);
        navigateToNextPage();
      }
    }, 3000); // Poll every 3 seconds
  };

  const navigateToNextPage = () => {
    const name = isOrganization ? organizationName : `${firstName} ${lastName}`;
    const role = isOrganization ? "organization" : "individual"; // Set the role based on signup type

    if (isOrganization) {
      router.push({
        pathname: "Main/List",
        params: {
          userName: name,
          userEmail: email,
          userContactNumber: contactNumber,
        },
      });
    } else {
      router.push({
        pathname: "Options",
        params: {
          userName: name,
          userEmail: email,
          userContactNumber: contactNumber,
        },
      });
    }
  };

  const handleToggleSignupMode = () => {
    setIsOrganization((prev) => !prev);
    // Reset form fields and errors when switching modes
    setFirstName("");
    setLastName("");
    setOrganizationName("");
    setEmail("");
    setContactNumber("");
    setPassword("");
    setConfirmPassword("");

    setErrors({
      // Clear errors when toggling signup mode
      firstName: "",
      lastName: "",
      organizationName: "",
      email: "",
      contactNumber: "",
      password: "",
      confirmPassword: "",
    });
  };

  const hideDialog = () => setDialogVisible(false);

  if (isVerifying) {
    return (
      <View style={styles.verificationContainer}>
        <Text style={styles.verificationText}>
          Please check your email to verify your account.
        </Text>
        <TouchableOpacity style={styles.verifyButton} onPress={() => setIsVerifying(false)}>
          <Text style={styles.backToSignupText}>Back to Signup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <ImageBackground
          source={require("../assets/Signup/ppaw.png")}
          style={styles.background}
        >
          <View style={styles.container}>
            <Text style={styles.title}>Sign up to adopt!</Text>
            <MaterialCommunityIcons
              name="paw"
              size={24}
              color={theme.colors.primary}
              style={styles.icon}
            />
            <Text style={styles.subtitle}>Create your account</Text>

            {isOrganization ? (
              <TextInput
                label="Organization Name"
                value={organizationName}
                onChangeText={(value) =>
                  handleInputChange("organizationName", value)
                }
                style={[
                  styles.input,
                  errors.organizationName && styles.errorInput,
                ]}
                left={<TextInput.Icon icon="account" />}
                mode="flat"
                activeUnderlineColor="gray"
                autoCapitalize="words"
              />
            ) : (
              <>
                <View style={styles.nameContainer}>
                  <TextInput
                    label="First Name"
                    value={firstName}
                    onChangeText={(value) =>
                      handleInputChange("firstName", value)
                    }
                    style={[
                      styles.nameInput,
                      errors.firstName && styles.errorInput,
                    ]}
                    left={<TextInput.Icon icon="account" />}
                    mode="flat"
                    activeUnderlineColor="gray"
                    autoCapitalize="words"
                  />
                  <TextInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={(value) =>
                      handleInputChange("lastName", value)
                    }
                    style={[
                      styles.nameInput,
                      errors.lastName && styles.errorInput,
                      styles.lastNameInput,
                    ]}
                    left={<TextInput.Icon icon="account" />}
                    mode="flat"
                    activeUnderlineColor="gray"
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.nameErrorContainer}>
                  {errors.firstName && (
                    <Text style={styles.errorFirstNameText}>
                      {errors.firstName}
                    </Text>
                  )}
                  {errors.lastName && (
                    <Text style={styles.errorLastNameText}>
                      {errors.lastName}
                    </Text>
                  )}
                </View>
              </>
            )}

            {errors.organizationName && (
              <Text style={styles.errorText}>{errors.organizationName}</Text>
            )}

            <TextInput
              label="Email"
              value={email}
              onChangeText={(value) => handleInputChange("email", value)}
              left={<TextInput.Icon icon="email" />}
              mode="flat"
              autoCapitalize="none"
              activeUnderlineColor="gray"
              keyboardType="email-address"
              style={[styles.input, errors.email && styles.errorInput]}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <TextInput
              label="Contact Number"
              value={contactNumber}
              onChangeText={(value) =>
                handleInputChange("contactNumber", value)
              }
              style={[styles.input, errors.contactNumber && styles.errorInput]}
              left={<TextInput.Icon icon="phone" />}
              keyboardType="phone-pad"
              mode="flat"
              activeUnderlineColor="gray"
            />
            {errors.contactNumber && (
              <Text style={styles.errorText}>{errors.contactNumber}</Text>
            )}

            <TextInput
              label="Password"
              value={password}
              onChangeText={(value) => handleInputChange("password", value)}
              style={[styles.input, errors.password && styles.errorInput]}
              left={<TextInput.Icon icon="lock" />}
              mode="flat"
              autoCapitalize="none"
              activeUnderlineColor="gray"
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye" : "eye-off"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              secureTextEntry={!showPassword}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(value) =>
                handleInputChange("confirmPassword", value)
              }
              style={[
                styles.input,
                errors.confirmPassword && styles.errorInput,
              ]}
              left={<TextInput.Icon icon="lock-check" />}
              mode="flat"
              autoCapitalize="none"
              activeUnderlineColor="gray"
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? "eye" : "eye-off"}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              secureTextEntry={!showConfirmPassword}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            <TouchableOpacity
              style={[styles.signupButton, isSigningUp && { opacity: 0.5 }]}
              onPress={handleSignup}
              disabled={isSigningUp} // Disable button during loading
            >
              {isSigningUp ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.signupButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push("Login")}>
                <Text style={styles.loginText}> Login</Text>
              </TouchableOpacity>
            </View>

            {/* Divider with "or" */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider}></View>
              <Text style={styles.orText}>OR</Text>
              <View style={styles.divider}></View>
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity onPress={handleToggleSignupMode}>
                <Text style={styles.signupOrganizationText}>
                  {isOrganization
                    ? "Sign up as an individual"
                    : "Sign up as an organization"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dialog */}
            <Portal>
              <Dialog visible={dialogVisible} onDismiss={hideDialog}>
                <Dialog.Icon icon="check-circle" color="#68C2FF" />
                <Dialog.Title style={styles.dialogTitle}>Success</Dialog.Title>
                <Dialog.Content style={styles.dialogContent}>
                  <Text style={styles.dialogText}>
                    Account created successfully!
                  </Text>
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
        </ImageBackground>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  verificationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#68C2FF',
  },
  verificationText: {
    fontSize: 24,
    fontFamily: "Lilita",
    marginBottom: 20,
    textAlign: "center",
    color: 'white',
  },
  verifyButton: {
    justifyContent: 'center',
    width: '40%',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: 'white',
    height: 40,
    marginRight: 10,
  },
  backToSignupText: {
    textAlign: 'center',
    fontFamily: 'Lato',
    fontSize: 18,
    color: 'white',
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50, // Add paddingTop to avoid status bar overlap
  },
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent background to make text readable
    borderRadius: 10,
  },
  title: {
    fontSize: 50,
    fontFamily: "Lilita",
    textAlign: "center",
    color: "#68C2FF",
    marginTop: 50,
  },
  icon: {
    alignSelf: "center",
    marginVertical: 10,
  },
  subtitle: {
    textAlign: "center",
    fontFamily: "Lato",
    fontSize: 18,
    marginTop: -30,
    marginBottom: 40,
  },
  input: {
    marginBottom: 20,
    backgroundColor: "#F5F5F5",
  },
  signupButton: {
    backgroundColor: "#EF5B5B",
    marginTop: 30,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
  signupButtonText: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "white",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    fontFamily: "Lato",
  },
  loginText: {
    fontFamily: "Lato",
    color: "gray",
    marginLeft: 10,
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%", // Ensure it takes up the full width available
  },
  nameInput: {
    flex: 1,
    marginBottom: 20,
    backgroundColor: "#F5F5F5",
  },
  lastNameInput: {
    marginLeft: 10, // Adds space between the first name and last name inputs
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  iconButton: {
    marginHorizontal: 10,
    marginBottom: 15,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  nameErrorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%", // Ensure it takes up the full width available
  },
  errorFirstNameText: {
    color: "red",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  errorLastNameText: {
    color: "red",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginRight: 85,
  },
  // Divider styles
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    flex: 1,
  },
  orText: {
    marginHorizontal: 10,
    color: "#888",
    fontSize: 14,
  },
  signupOrganizationText: {
    fontFamily: "Lato",
    color: "gray",
    marginLeft: 10,
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
