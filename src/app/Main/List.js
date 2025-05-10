import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Dialog, Portal } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import Foundation from "@expo/vector-icons/Foundation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import { usePets } from "../../context/PetContext"; // Adjust the path as needed
import { useNavigation } from "@react-navigation/native";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const List = () => {
  const router = useRouter();
  const navigation = useNavigation();

  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState(null); // New state for pet type
  const [petGender, setSelectedPetGender] = useState(null);
  const [petAge, setPetAge] = useState("");
  const [petWeight, setPetWeight] = useState("");
  const [petPersonality, setPetPersonality] = useState("");
  const [petDescription, setPetDescription] = useState("");
  const [petIllnessHistory, setPetIllnessHistory] = useState("");
  const [petVaccinated, setPetVaccinated] = useState(null);
  const [adoptionFee, setAdoptionFee] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);

  const [dialogVisible, setDialogVisible] = useState(false); // Dialog visibility state
  const [isLoading, setIsLoading] = useState(false); // Add this state

  // Existing state and variables...
  const scrollViewRef = useRef(null); // Ref for ScrollView
  // Scroll to top when the screen is navigated to
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
      }
    });

    // Cleanup listener when the component unmounts
    return unsubscribe;
  }, [navigation]);

  const MAX_IMAGES = 5; // Limit for images

  const [errors, setErrors] = useState({
    petName: "",
    petGender: "",
    petAge: "",
    petWeight: "",
    petPersonality: "",
    petDescription: "",
    petIllnessHistory: "",
    petVaccinated: "",
    adoptionFee: "",
  });

  // Function to pick images
  const pickImages = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      alert(`You can only select up to ${MAX_IMAGES} images.`);
      return;
    }

    // Request permission to access the media library
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Allows selecting multiple images
      selectionLimit: MAX_IMAGES - selectedImages.length,
      quality: 1, // High-quality images
    });

    console.log("Image Picker Result:", result);

    if (!result.canceled && result.assets) {
      // Resolve each URI and update the state
      const resolvedImages = await Promise.all(
        result.assets.map(async (image) => {
          // Save the image to the app's file system
          const fileName = image.uri.split("/").pop();
          const fileUri = FileSystem.documentDirectory + fileName;

          // Move the file to the document directory
          await FileSystem.copyAsync({
            from: image.uri,
            to: fileUri,
          });

          // Return the file URI
          return { uri: fileUri };
        })
      );

      // Add resolved URIs to the selected images
      setSelectedImages((prevImages) => [...prevImages, ...resolvedImages]);
    } else if (result.canceled) {
      console.log("Image selection canceled.");
    } else {
      alert("No images selected.");
    }
  };

  // Function to remove an image from the selected images array
  const handleImageRemove = (index) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
  };

  const handleListPet = async () => {
    if (
      !petName ||
      petType === null ||
      petGender === null ||
      !petAge ||
      !petWeight ||
      !petPersonality ||
      !petDescription ||
      !petIllnessHistory ||
      petVaccinated === null ||
      !adoptionFee ||
      selectedImages.length === 0
    ) {
      setDialogVisible(true);
      return;
    }
  
    setIsLoading(true); // Start loading
  
    try {
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (!user) {
        alert("Please log in to list a pet.");
        setIsLoading(false);
        return;
      }
  
      const storage = getStorage();
      const db = getFirestore();
  
      const newPet = {
        petName,
        petType,
        petGender,
        petAge,
        petWeight,
        petPersonality,
        petDescription,
        petIllnessHistory,
        petVaccinated,
        adoptionFee,
        images: [],
        createdAt: new Date().toISOString(),
        listedBy: user.email,
      };
  
      const petCollection = collection(db, "listed_pets");
      const docRef = await addDoc(petCollection, newPet);
      const petId = docRef.id;
  
      const imageUploadPromises = selectedImages.map(async (image, index) => {
        const response = await fetch(image.uri);
        const blob = await response.blob();
        const imageRef = ref(
          storage,
          `pets/${petId}/${Date.now()}_${index}.jpg`
        );
        await uploadBytes(imageRef, blob);
        return getDownloadURL(imageRef);
      });
  
      const uploadedImages = await Promise.all(imageUploadPromises);
  
      // Update the Firestore document with the uploaded image URLs
      await updateDoc(docRef, { images: uploadedImages });
  
      alert("Pet listed successfully!");
      resetForm();
      router.push("/Main");
    } catch (error) {
      console.error("Error listing pet:", error);
      alert(`Failed to list pet: ${error.message}`);
    } finally {
      setIsLoading(false); // Stop loading
    }
  }  

  const resetForm = () => {
    setAdoptionFee("");
    setPetName("");
    setSelectedPetGender(null);
    setPetAge("");
    setPetWeight("");
    setPetPersonality("");
    setPetDescription("");
    setPetIllnessHistory("");
    setPetVaccinated(null);
    setSelectedImages([]);
  };

  const hideDialog = () => setDialogVisible(false); // Function to hide the dialog

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>List A Pet For Adoption</Text>
            </View>

            {/* Form Field */}
            <View style={styles.formContainer}>
              <Text style={styles.question}>Pet's Name:</Text>
              <TextInput
                placeholder="Pet's Name"
                label="Pet's Name"
                value={petName}
                onChangeText={setPetName}
                style={[styles.input, errors.petName && styles.errorInput]}
                mode="outlined"
                outlineColor="transparent"
                activeOutlineColor="#68C2FF"
                autoCapitalize="words"
              />
              {errors.petName && (
                <Text style={styles.errorText}>{errors.petName}</Text>
              )}
              <Text style={styles.question}>Pet Type:</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    petType === "Cat" && styles.selectedOptionButton,
                  ]}
                  onPress={() => setPetType("Cat")}
                >
                  <MaterialCommunityIcons
                    name="cat"
                    size={24}
                    color={petType === "Cat" ? "#68C2FF" : "#C2C2C2"} // Color for selected/unselected
                  />
                  <Text
                    style={[
                      styles.optionText,
                      petType === "Cat" && styles.selectedOptionText,
                    ]}
                  >
                    Cat
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    petType === "Dog" && styles.selectedOptionButton,
                  ]}
                  onPress={() => setPetType("Dog")}
                >
                  <MaterialCommunityIcons
                    name="dog"
                    size={24}
                    color={petType === "Dog" ? "#68C2FF" : "#C2C2C2"} // Color for selected/unselected
                  />
                  <Text
                    style={[
                      styles.optionText,
                      petType === "Dog" && styles.selectedOptionText,
                    ]}
                  >
                    Dog
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.question}>Gender:</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    petGender === "Female" && styles.selectedOptionButton,
                  ]}
                  onPress={() => setSelectedPetGender("Female")}
                >
                  <Foundation
                    name="female-symbol"
                    size={24}
                    color={petGender === "Female" ? "#68C2FF" : "#C2C2C2"}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      petGender === "Female" && styles.selectedOptionText,
                    ]}
                  >
                    Female
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    petGender === "Male" && styles.selectedOptionButton,
                  ]}
                  onPress={() => setSelectedPetGender("Male")}
                >
                  <Foundation
                    name="male-symbol"
                    size={24}
                    color={petGender === "Male" ? "#68C2FF" : "#C2C2C2"}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      petGender === "Male" && styles.selectedOptionText,
                    ]}
                  >
                    Male
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.question}>Age:</Text>
              <TextInput
                placeholder="e.g., 5 Years"
                label="e.g., 5 Years"
                value={petAge}
                onChangeText={setPetAge}
                keyboardType="number-pad"
                style={[styles.input, errors.petAge && styles.errorInput]}
                mode="outlined"
                outlineColor="transparent"
                activeOutlineColor="#68C2FF"
                autoCapitalize="words"
              />
              {errors.petAge && (
                <Text style={styles.errorText}>{errors.petAge}</Text>
              )}

              <Text style={styles.question}>Weight (kg):</Text>
              <TextInput
                placeholder="e.g., 25"
                label="e.g., 25"
                value={petWeight} // 'petWeight' now includes the 'kg' suffix
                keyboardType="number-pad"
                onChangeText={setPetWeight}
                style={[styles.input, errors.petWeight && styles.errorInput]}
                mode="outlined"
                outlineColor="transparent"
                activeOutlineColor="#68C2FF"
              />
              {errors.petWeight && (
                <Text style={styles.errorText}>{errors.petWeight}</Text>
              )}

              <Text style={styles.question}>
                In 3 words, how would you describe this pet's personality?
              </Text>
              <TextInput
                placeholder="e.g., Friendly, Playful, Loyal"
                label="e.g., Friendly, Playful, Loyal"
                value={petPersonality} // The value includes the formatted input
                onChangeText={(text) => {
                  // Remove spaces and trim the input
                  const cleanedText = text.replace(/\s+/g, "").trim();

                  // Filter out any non-alphabetic characters except commas
                  const validText = cleanedText.replace(/[^a-zA-Z,-]/g, "");

                  // Split the input by commas
                  const words = validText.split(",");

                  // If there are more than 3 words, limit the input to the first 3 words
                  if (words.length > 3) {
                    setPetPersonality(words.slice(0, 3).join(", "));
                  } else {
                    // Update state with the valid input
                    setPetPersonality(words.join(", "));
                  }
                }}
                style={[
                  styles.input,
                  errors.petPersonality && styles.errorInput,
                ]}
                mode="outlined"
                outlineColor="transparent"
                activeOutlineColor="#68C2FF"
                autoCapitalize="words"
              />
              {errors.petPersonality && (
                <Text style={styles.errorText}>{errors.petPersonality}</Text>
              )}

              <Text style={styles.question}>Briefly describe this pet:</Text>
              <TextInput
                placeholder="Provide a brief description of this pet's characteristics"
                label="Provide a brief description of this pet's characteristics"
                value={petDescription}
                onChangeText={setPetDescription}
                style={[
                  styles.input,
                  styles.textArea,
                  errors.petDescription && styles.errorInput,
                ]}
                mode="outlined"
                outlineColor="transparent"
                activeOutlineColor="#68C2FF"
                multiline={true}
                numberOfLines={7}
                textAlignVertical="top"
                autoCapitalize="sentences"
              />
              {errors.petDescription && (
                <Text style={styles.errorText}>{errors.petDescription}</Text>
              )}

              <Text style={styles.question}>Any history of illness?</Text>
              <TextInput
                placeholder="Mention if the pet has any history of illness (or write None)"
                label="Mention if the pet has any history of illness (or write None)"
                value={petIllnessHistory}
                onChangeText={setPetIllnessHistory}
                style={[
                  styles.input,
                  styles.textArea,
                  errors.petIllnessHistory && styles.errorInput,
                ]}
                mode="outlined"
                outlineColor="transparent"
                activeOutlineColor="#68C2FF"
                multiline={true}
                numberOfLines={7}
                textAlignVertical="top"
                autoCapitalize=""
              />
              {errors.petDescription && (
                <Text style={styles.errorText}>{errors.petIllnessHistory}</Text>
              )}

              <Text style={styles.question}>Is the pet vaccinated?</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton1,
                    petVaccinated === "Yes" && styles.selectedOptionButton,
                  ]}
                  onPress={() => setPetVaccinated("Yes")}
                >
                  <Text
                    style={[
                      styles.optionText,
                      petVaccinated === "Yes" && styles.selectedOptionText,
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton1,
                    petVaccinated === "No" && styles.selectedOptionButton,
                  ]}
                  onPress={() => setPetVaccinated("No")}
                >
                  <Text
                    style={[
                      styles.optionText,
                      petVaccinated === "No" && styles.selectedOptionText,
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.question}>Enter adoption fee:</Text>
              <TextInput
                placeholder="e.g., ₱500"
                label="e.g., ₱500"
                value={adoptionFee}
                keyboardType="number-pad"
                onChangeText={setAdoptionFee}
                style={[styles.input, errors.adoptionFee && styles.errorInput]}
                mode="outlined"
                outlineColor="transparent"
                activeOutlineColor="#68C2FF"
              />
              {errors.adoptionFee && (
                <Text style={styles.errorText}>{errors.adoptionFee}</Text>
              )}

              {/* Image Upload */}
              <Text style={styles.question}>Upload picture(s):</Text>
              <View style={styles.uploadContainer}>
                {selectedImages.length === 0 ? (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={pickImages}
                  >
                    <MaterialIcons
                      name="cloud-upload"
                      size={50}
                      color="#C2C2C2"
                    />
                    <Text style={styles.uploadText}>Maximum of 5 Pictures</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.imagePreviewContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.imageSlider}
                    >
                      {selectedImages.map((image, index) => (
                        <View key={index} style={styles.imagePreview}>
                          <Image
                            source={{ uri: image.uri }}
                            style={styles.selectedImage}
                          />
                          <TouchableOpacity
                            style={styles.closeIcon}
                            onPress={() => handleImageRemove(index)}
                          >
                            <MaterialIcons name="close" size={20} color="red" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      {/* Show "add" icon if fewer than 5 images */}
                      {selectedImages.length < 5 && (
                        <TouchableOpacity
                          style={styles.addImageContainer}
                          onPress={pickImages}
                        >
                          <MaterialIcons name="add" size={50} color="gray" />
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.listPetButton,
                  isLoading && { opacity: 0.5 }, // Add disabled style
                ]}
                onPress={isLoading ? null : handleListPet} // Disable interaction if loading
                disabled={isLoading} // Prevent multiple clicks
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" /> // Show loading spinner
                ) : (
                  <Text style={styles.listPetButtonText}>List this pet</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Dialog for Alert */}
            <Portal>
              <Dialog visible={dialogVisible} onDismiss={hideDialog}>
                <Dialog.Icon icon="exclamation-thick" color="#EF5B5B" />
                <Dialog.Title style={styles.dialogTitle}>Alert</Dialog.Title>
                <Dialog.Content style={styles.dialogContent}>
                  <Text style={styles.dialogText}>
                    Please complete all fields before proceeding.
                  </Text>
                </Dialog.Content>
                <Dialog.Actions style={styles.dialogActions}>
                  <TouchableOpacity
                    onPress={hideDialog}
                    style={styles.dialogButton}
                  >
                    <Text style={styles.dialogButtonText}>Okay</Text>
                  </TouchableOpacity>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  flexContainer: {
    flex: 1,
    marginBottom: -80,
  },
  scrollViewContent: {
    paddingBottom: 10,
  },
  container: {
    flex: 1,
    width: "100%",
    padding: 20,
    paddingBottom: 100,
  },
  titleContainer: {
    width: "100%",
  },
  titleText: {
    fontFamily: "Lilita",
    fontSize: 25,
    color: "#68C2FF",
  },
  formContainer: {
    width: "100%",
  },
  question: {
    marginTop: 35,
    fontFamily: "Lato",
    fontSize: 18,
  },
  input: {
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: "#F5F5F5",
  },
  textArea: {
    height: 150,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C2C2C2",
    borderRadius: 8,
    paddingVertical: 5,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
  },
  optionButton1: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C2C2C2",
    borderRadius: 8,
    paddingVertical: 10,
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
  uploadContainer: {
    width: "100%",
    height: 210,
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    width: "100%",
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    textAlign: "center",
    fontFamily: "Lato",
    fontSize: 18,
    color: "#C2C2C2",
  },
  listPetButton: {
    backgroundColor: "#EF5B5B",
    width: "100%",
    height: "50",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  listPetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  imagePreviewContainer: {
    flexDirection: "row",
    justifyContent: "flex-start", // Add some space between images
    alignItems: "center",
    width: "100%",
  },
  imageWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderRadius: 10,
  },
  selectedImage: {
    width: 200,
    height: 150,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  closeIcon: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 5,
    marginLeft: 180,
  },
  addImageContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 200,
    height: 150,
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: 10,
    borderStyle: "dashed",
    marginHorizontal: 10,
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

export default List;
