import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { TextInput } from "react-native-paper";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Foundation from "@expo/vector-icons/Foundation";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  getDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Firebase Authentication import

export default function Preferences() {
  const router = useRouter();
  const [userName, setUserName] = React.useState(""); // State for user's name
  const [petSize, setPetSize] = React.useState(9);
  const [personalityLabel, setPersonalityLabel] = React.useState(""); // Replaced slider with input field for personality
  const [selectedPet, setSelectedPet] = React.useState(null);
  const [selectedGender, setSelectedGender] = React.useState(null);
  const [userUid, setUserUid] = React.useState(""); // Store UID of the current user

  React.useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserUid(user.email); // Use email as document ID
        fetchUserName(user.email); // Fetch the user's name
      } else {
        console.log("No user logged in");
      }
    });

    return () => unsubscribe(); // Cleanup the listener
  }, []);

  const fetchUserName = async (email) => {
    const db = getFirestore();
    const usersRef = collection(db, "users"); // Reference to the users collection

    // Query Firestore to find the user document by the email field
    const q = query(usersRef, where("email", "==", email));

    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]; // Get the first document in the query snapshot
        setUserName(userDoc.data().name); // Set the user's name if the document exists
      } else {
        console.log("No such user found!");
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  const handleFindPet = async () => {
    if (selectedPet && selectedGender !== null && personalityLabel !== "") {
      const db = getFirestore();
      const preferencesRef = doc(db, "preferences", userUid); // Using email as document ID

      const preferenceData = {
        userEmail: userUid, // Corrected to use user email
        selectedPet,
        selectedGender,
        petSize,
        petSizeLabel, // Store the label for pet size
        personalityLabel, // Store the personality label from the input field
      };

      try {
        // Check if the document exists and update it
        const existingDoc = await getDoc(preferencesRef);
        if (existingDoc.exists()) {
          await setDoc(preferencesRef, preferenceData, { merge: true });
          console.log("Preferences updated successfully!");
        } else {
          // Create a new document if none exists
          await setDoc(preferencesRef, preferenceData);
          console.log("Preferences created successfully!");
        }
      } catch (error) {
        console.error("Error saving preferences:", error);
      }

      router.push({
        pathname: "Main",
        params: { userName, userUid },
      });
    } else {
      alert("Please complete all selections.");
    }
  };

  const petSizeLabels = {
    cat: [
      "Small (1-3 kg)",
      "Average (3-5 kg)",
      "Biggish (5-7 kg)",
      "Very Big (7-10 kg)",
      "Huge (10+ kg)",
    ],
    dog: [
      "Tiny (1-5 kg)",
      "Small (5-10 kg)",
      "Average (10-15 kg)",
      "Large (15-25 kg)",
      "Extra Large (25-39 kg)",
      "Giant (40+ kg)",
    ],
  };

  const getPetSizeLabel = (value, petType) => {
    const thresholds = petType === "cat" ? [3, 5, 7, 10] : [5, 10, 15, 25, 39];
    const labels = petSizeLabels[petType] || [];
    for (let i = 0; i < thresholds.length; i++) {
      if (value <= thresholds[i]) return labels[i];
    }
    return labels[labels.length - 1];
  };

  const petSizeLabel = getPetSizeLabel(petSize, selectedPet);

  const getSliderLabels = () => {
    if (selectedPet === "cat") {
      return (
        <>
          <Text style={styles.sliderLabel}>Small {"\n"}1-3 kg</Text>
          <Text style={styles.sliderLabel}>Average {"\n"}3-5 kg</Text>
          <Text style={styles.sliderLabel}>Biggish {"\n"}5-7 kg</Text>
          <Text style={styles.sliderLabel}>Very Big {"\n"}7-10 kg</Text>
          <Text style={styles.sliderLabel}>Huge {"\n"}10+ kg</Text>
        </>
      );
    } else if (selectedPet === "dog") {
      return (
        <>
          <Text style={styles.sliderLabel}>Tiny {"\n"}1-5 kg</Text>
          <Text style={styles.sliderLabel}>Small {"\n"}5-10 kg</Text>
          <Text style={styles.sliderLabel}>Average {"\n"}10-15 kg</Text>
          <Text style={styles.sliderLabel}>Large {"\n"}15-25 kg</Text>
          <Text style={styles.sliderLabel}>Extra Large {"\n"}25-40 kg</Text>
          <Text style={styles.sliderLabel}>Giant {"\n"}40+ kg</Text>
        </>
      );
    } else {
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView>
          {/* Back Button */}
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.greetingText}>
            Nice to meet you {userName || "User"},
          </Text>
          <Text style={styles.titleText}>
            We'll help you find the right pet for you!
          </Text>

          {/* Pet Selection */}
          <Text style={styles.question}>Select Pet</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedPet === "cat" && styles.selectedOptionButton,
              ]}
              onPress={() => setSelectedPet("cat")}
            >
              <MaterialCommunityIcons
                name="cat"
                size={24}
                color={selectedPet === "cat" ? "#68C2FF" : "#666"}
              />
              <Text
                style={[
                  styles.optionText,
                  selectedPet === "cat" && styles.selectedOptionText,
                ]}
              >
                Cat
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedPet === "dog" && styles.selectedOptionButton,
              ]}
              onPress={() => setSelectedPet("dog")}
            >
              <MaterialCommunityIcons
                name="dog"
                size={24}
                color={selectedPet === "dog" ? "#68C2FF" : "#666"}
              />
              <Text
                style={[
                  styles.optionText,
                  selectedPet === "dog" && styles.selectedOptionText,
                ]}
              >
                Dog
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gender Selection */}
          <Text style={styles.question}>Select Pet's gender</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedGender === "female" && styles.selectedOptionButton,
              ]}
              onPress={() => setSelectedGender("female")}
            >
              <Foundation
                name="female-symbol"
                size={24}
                color={selectedGender === "female" ? "#68C2FF" : "#666"}
              />
              <Text
                style={[
                  styles.optionText,
                  selectedGender === "female" && styles.selectedOptionText,
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedGender === "male" && styles.selectedOptionButton,
              ]}
              onPress={() => setSelectedGender("male")}
            >
              <Foundation
                name="male-symbol"
                size={24}
                color={selectedGender === "male" ? "#68C2FF" : "#666"}
              />
              <Text
                style={[
                  styles.optionText,
                  selectedGender === "male" && styles.selectedOptionText,
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pet Size Slider */}
          <Text style={styles.question}>Which pet size do you prefer?</Text>
          <Slider
            style={styles.slider}
            minimumValue={1} // Setting the minimum value to 1 kg for more flexibility
            maximumValue={selectedPet === "cat" ? 10 : 40} // Adjusted max value for cat to 20 kg
            step={1}
            value={petSize}
            onValueChange={setPetSize}
            minimumTrackTintColor="#68C2FF"
            maximumTrackTintColor="gray"
            thumbTintColor="#68C2FF"
          />

          <View style={styles.sliderLabelsContainer}>{getSliderLabels()}</View>

          {/* Personality Input */}
          <Text style={styles.question}>
            What type of personality do you prefer in a pet?
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter personality (e.g., Calm, Playful)"
            value={personalityLabel}
            mode="outlined"
            outlineColor="transparent"
            activeOutlineColor="#68C2FF"
            onChangeText={setPersonalityLabel}
          />

          {/* Find Pet Button */}
          <TouchableOpacity
            style={styles.findPetButton}
            onPress={handleFindPet}
          >
            <Text style={styles.findPetButtonText}>Find My Pet</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
    justifyContent: "center",
    width: "100%",
    padding: 20,
    flexDirection: "column",
  },
  backButtonContainer: {
    backgroundColor: "gray",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 70,
  },
  greetingText: {
    fontSize: 18,
    color: "gray",
    marginBottom: 10,
    fontFamily: "Lato",
  },
  titleText: {
    fontSize: 24,
    color: "#68C2FF",
    marginBottom: 20,
    fontFamily: "Lilita",
    marginBottom: 50,
  },
  question: {
    fontSize: 16,
    marginVertical: 15,
    color: "black",
  },
  optionsContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    paddingVertical: 5,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
  },
  selectedOptionButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#68C2FF",
  },
  optionText: {
    color: "gray",
    marginLeft: 10,
  },
  selectedOptionText: {
    color: "#68C2FF",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  sliderLabelLargeText: {
    alignItems: "flex-end",
  },
  sliderLabel: {
    fontSize: 12,
    color: "#666",
  },
  textInput: {
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: "#F5F5F5",
  },
  findPetContainer: {
    width: "100%",
    alignItems: "center",
  },
  findPetButton: {
    backgroundColor: "#EF5B5B",
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    marginVertical: 20,
  },
  findPetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
