import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker"; // Import the Picker
import { auth, signOut, db } from "../config/firebase"; // Ensure this imports your Firebase setup
import {
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GOOGLE_API_KEY } from "../config/googleconfig"; // Import the Google API key
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Geolocation from "react-native-geocoding";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const Profile = () => {
  const router = useRouter();
  const [profileInfo, setProfileInfo] = useState({
    name: "Loading...",
    email: "-",
    phone: "-",
    address: "",
    houseType: "Not Indicated",
    hasPet: "Not Indicated",
    bio: "", // Add bio field here
    profilePicture: null, // Add profilePicture here
  });

  const [editableInfo, setEditableInfo] = useState(profileInfo);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isEditConfirmVisible, setEditConfirmVisible] = useState(false);
  const houseTypeOptions = ["Apartment/Condo", "House"];
  const petOptions = ["Yes", "No"];
  const [isSaving, setIsSaving] = useState(false);
  const [isAddressEmpty, setIsAddressEmpty] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]); // Store autocomplete suggestions
  const [selectedAddress, setSelectedAddress] = useState(""); // Store the selected address
  const [isAddressModalVisible, setAddressModalVisible] = useState(false); // Correct initialization
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isProfilePicChanged, setIsProfilePicChanged] = useState(false);
  const [isCoverPicChanged, setIsCoverPicChanged] = useState(false); // Add state for cover picture change

  useEffect(() => {
    const checkPermissionsAndFetch = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        setSelectedLocation({ latitude: 0, longitude: 0 });
        return;
      }

      // Call the fetchUserData after permission is granted
      fetchUserData();
    };

    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Fetch user data from the "users" collection
          const usersCollectionRef = collection(db, "users");
          const q = query(usersCollectionRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
              const userData = doc.data();
              // Fetch lifestyle data based on the user's email
              const lifestyleCollectionRef = collection(db, "lifestyle");
              const lifestyleQuery = query(
                lifestyleCollectionRef,
                where("email", "==", user.email)
              );
              getDocs(lifestyleQuery).then((lifestyleSnapshot) => {
                if (!lifestyleSnapshot.empty) {
                  lifestyleSnapshot.forEach((lifestyleDoc) => {
                    const lifestyleData = lifestyleDoc.data();
                    setProfileInfo((prevState) => ({
                      ...prevState,
                      houseType: lifestyleData.livingSpace || "Not Indicated",
                      hasPet: lifestyleData.ownedPets || "Not Indicated",
                    }));
                    setEditableInfo((prevState) => ({
                      ...prevState,
                      houseType: lifestyleData.livingSpace || "Not Indicated",
                      hasPet: lifestyleData.ownedPets || "Not Indicated",
                    }));
                  });
                }
              });

              // Set the profile data including bio
              setProfileInfo({
                ...userData,
                phone: userData.contactNumber || "-",
                profilePicture: userData.profilePicture || null, // Fetch profile picture URL
                bio: userData.bio || "", // Fetch bio field
              });
              setEditableInfo({
                ...userData,
                phone: userData.contactNumber || "-",
                profilePicture: userData.profilePicture || null, // Fetch profile picture URL
                bio: userData.bio || "", // Fetch bio field
              });
            });
          } else {
            console.log("No such user!");
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      }
    };
    checkPermissionsAndFetch();
    fetchUserData();
  }, []); // Empty dependency array, will run once when component mounts

  let debounceTimeout; // Define this outside the function to persist between calls

  // Handle address input and fetch suggestions
  const handleAddressChange = async (text) => {
    setEditableInfo((prevState) => ({ ...prevState, address: text }));
    setShowSuggestions(true); // Show the suggestions dropdown when typing
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (text.length > 2) {
      debounceTimeout = setTimeout(() => {
        fetchAddressSuggestions(text);
      }, 500); // 500ms delay before triggering API call
    }
  };

  // Fetch address suggestions from Google API
  const fetchAddressSuggestions = async (query) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      setAddressSuggestions(data.predictions);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle the address selection and map update
  const handleAddressSelect = (address) => {
    setSelectedAddress(address); // Store the full address
    setEditableInfo((prevState) => ({ ...prevState, address }));
    setShowSuggestions(false); // Close the suggestions list

    // Geocode the address to get latitude and longitude using Expo Location
    Location.geocodeAsync(address)
      .then((response) => {
        if (response && response[0]) {
          const { latitude, longitude } = response[0];
          // Always update selectedLocation when a new address is selected
          setSelectedLocation({ latitude, longitude });
        } else {
          alert("Could not geocode the address. Please try again.");
        }
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to get location. Please try again.");
      });
  };

  const handleSelectAddressClick = () => {
    const address = editableInfo.address; // Get the address from the state

    console.log('Address on "Select Address" button click:', address); // Debugging log

    console.log("Updating selected address and geocoding it..."); // Debugging log
    setSelectedAddress(address); // Set the selected address in state

    // Correctly update editableInfo without overwriting the object
    setEditableInfo((prevState) => ({ ...prevState, address }));

    // Close the modal after selecting the address
    setAddressModalVisible(false);
    console.log("Modal closed after address selection."); // Debugging log
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const updatedData = {
          ...editableInfo,
          contactNumber: editableInfo.phone,
          bio: editableInfo.bio,
          address: editableInfo.address,
        };

        if (isProfilePicChanged && editableInfo.image?.uri) {
          const fileName = `profilePictures/${user.uid}/profile.jpg`;
          const storageRef = ref(storage, fileName);
          try {
            console.log(
              "Uploading profile picture from URI:",
              editableInfo.image.uri
            );
            const response = await fetch(editableInfo.image.uri);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch image. Status: ${response.status}`
              );
            }
            const blob = await response.blob();
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            updatedData.profilePicture = downloadURL;
            setProfileInfo((prev) => ({
              ...prev,
              profilePicture: downloadURL,
            }));
          } catch (error) {
            console.error("Error uploading profile picture: ", error);
            alert("Profile picture upload failed. Please try again.");
            setIsSaving(false);
            return;
          }
        }

        if (
          isCoverPicChanged &&
          coverImage?.uri &&
          coverImage.uri !== profileInfo.coverPhoto
        ) {
          const coverFileName = `coverPhotos/${user.uid}/cover.jpg`;
          const coverStorageRef = ref(storage, coverFileName);
          try {
            console.log("Uploading cover photo from URI:", coverImage.uri);
            const coverResponse = await fetch(coverImage.uri);
            if (!coverResponse.ok) {
              throw new Error(
                `Failed to fetch cover image. Status: ${coverResponse.status}`
              );
            }
            const coverBlob = await coverResponse.blob();
            await uploadBytes(coverStorageRef, coverBlob);
            const coverDownloadURL = await getDownloadURL(coverStorageRef);
            updatedData.coverPhoto = coverDownloadURL;
            setProfileInfo((prev) => ({
              ...prev,
              coverPhoto: coverDownloadURL,
            }));
          } catch (error) {
            console.error("Error uploading cover photo: ", error);
            alert("Cover photo upload failed. Please try again.");
            setIsSaving(false);
            return;
          }
        }

        await updateDoc(userRef, updatedData);
        setProfileInfo(updatedData);
        setEditConfirmVisible(false);
        setModalVisible(false);

        // Show success alert
        alert("Profile changes have been saved successfully.");
      }
    } catch (error) {
      console.error("Error saving profile data: ", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }

    if (
      !editableInfo.houseNumber ||
      !editableInfo.streetAddress ||
      !editableInfo.barangay ||
      !editableInfo.city
    ) {
      setIsAddressEmpty(true);
    } else {
      setIsAddressEmpty(false);
    }
  };

  const handleEditPress = () => {
    setEditableInfo({
      ...profileInfo,
      image: null, // Reset the image field to null when opening the edit modal
      coverImage:
        coverImage || profileInfo.coverPhoto
          ? { uri: profileInfo.coverPhoto }
          : null, // Set the cover image
    });
    setModalVisible(true);
  };

  const handleCancelEdit = () => {
    setEditConfirmVisible(false);
  };

  const storage = getStorage();

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      const imageUri = pickerResult.assets[0].uri;
      setEditableInfo((prevState) => ({
        ...prevState,
        image: { uri: imageUri },
      }));
      setIsProfilePicChanged(true); // Mark profile picture as changed
    }
  };

  const pickCoverImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      const imageUri = pickerResult.assets[0].uri;
      setCoverImage({ uri: imageUri });
      setEditableInfo((prevState) => ({
        ...prevState,
        coverImage: { uri: imageUri },
      }));
      setIsCoverPicChanged(true); // Mark cover picture as changed
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Icon name="edit" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            {/* Cover Photo */}
            <Image
              style={styles.coverImage}
              source={
                profileInfo.coverPhoto
                  ? { uri: profileInfo.coverPhoto } // Use the cover photo URL from Firestore
                  : coverImage?.uri
                  ? { uri: coverImage.uri } // Temporary cover photo if selected
                  : require("../../assets/Profile/defaultcover.jpg") // Default cover photo
              }
            />

            <Image
              style={styles.profileImage}
              source={
                profileInfo.profilePicture
                  ? { uri: profileInfo.profilePicture } // Firebase Storage URL
                  : require("../../assets/Profile/dp.png") // Default image
              }
            />

            <Text style={styles.profileName}>{profileInfo.name}</Text>
            <Text
              style={[
                styles.bioText,
                !profileInfo.bio && styles.noBioText, // Apply `noBioText` style when bio is not set
              ]}
            >
              {profileInfo.bio || "No bio set"}
            </Text>
          </View>

          {/* Profile Details */}
          <View style={styles.profileDetailsContain}>
            <View style={styles.detailsContainer}>
              <Icon name="email" size={24} color="#444444" />
              <Text style={styles.detailsText}>{profileInfo.email}</Text>
            </View>
            <View style={styles.horizontalLine}></View>

            <View style={styles.detailsContainer}>
              <Icon name="phone" size={24} color="#444444" />
              <Text style={styles.detailsText}>{profileInfo.phone}</Text>
            </View>
            <View style={styles.horizontalLine}></View>

            <View style={styles.detailsContainer}>
              <Icon name="location-on" size={24} color="#444444" />
              <Text style={styles.detailsText}>
                {profileInfo.address || "No Address Provided"}
              </Text>
            </View>
            <View style={styles.horizontalLine}></View>

            <View style={styles.detailsContainer}>
              <Icon name="home" size={24} color="#444444" />
              <Text style={styles.detailsText}>
                House Type: {profileInfo.houseType}
              </Text>
            </View>
            <View style={styles.horizontalLine}></View>

            <View style={styles.detailsContainer}>
              <Icon name="pets" size={24} color="#444444" />
              <Text style={styles.detailsText}>
                Pet Owner: {profileInfo.hasPet}
              </Text>
            </View>
            <View style={styles.horizontalLine}></View>
          </View>

          {/* Edit Modal */}
          <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Profile</Text>

                <ScrollView contentContainerStyle={styles.scrollViewContent2}>
                  <View style={styles.uploadContainer}>
                    <TouchableOpacity
                      style={styles.pickCoverImage}
                      onPress={pickCoverImage}
                    >
                      <Image
                        style={styles.coverImage}
                        source={
                          editableInfo.coverImage?.uri
                            ? { uri: editableInfo.coverImage.uri }
                            : profileInfo.coverPhoto
                            ? { uri: profileInfo.coverPhoto }
                            : require("../../assets/Profile/defaultcover.jpg")
                        }
                      />
                      <TouchableOpacity
                        style={styles.editcoverImage}
                        onPress={pickCoverImage}
                      >
                        <Icon name="edit" size={20} color="white" />
                      </TouchableOpacity>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.profileImageContainer}
                      onPress={pickImage}
                    >
                      <Image
                        style={styles.profileImage}
                        source={
                          editableInfo.image?.uri
                            ? { uri: editableInfo.image.uri }
                            : profileInfo.profilePicture
                            ? { uri: profileInfo.profilePicture }
                            : require("../../assets/Profile/dp.png")
                        }
                      />
                      <TouchableOpacity
                        style={styles.editProfileImage}
                        onPress={pickImage}
                      >
                        <Icon name="edit" size={20} color="white" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={editableInfo.name}
                    onChangeText={(text) =>
                      setEditableInfo({ ...editableInfo, name: text })
                    }
                    mode="outlined"
                    outlineColor="transparent"
                    activeOutlineColor="#68C2FF"
                    autoCapitalize="words"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Bio"
                    value={editableInfo.bio}
                    onChangeText={(text) =>
                      setEditableInfo({ ...editableInfo, bio: text })
                    }
                    mode="outlined"
                    outlineColor="transparent"
                    activeOutlineColor="#68C2FF"
                    autoCapitalize="sentences"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={editableInfo.email}
                    onChangeText={(text) =>
                      setEditableInfo({ ...editableInfo, email: text })
                    }
                    mode="outlined"
                    outlineColor="transparent"
                    activeOutlineColor="#68C2FF"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={editableInfo.phone}
                    onChangeText={(text) =>
                      setEditableInfo({ ...editableInfo, phone: text })
                    }
                    keyboardType="number-pad"
                    mode="outlined"
                    outlineColor="transparent"
                    activeOutlineColor="#68C2FF"
                    autoCapitalize="sentences"
                  />

                  <View style={styles.addressFieldContainer}>
                    <TextInput
                      style={styles.input1}
                      placeholder="Address"
                      value={editableInfo.address || ""}
                      editable={false}
                      onChangeText={(text) =>
                        setEditableInfo({ ...editableInfo, address: text })
                      }
                      mode="outlined"
                      outlineColor="transparent"
                      activeOutlineColor="#68C2FF"
                    />
                    <TouchableOpacity
                      style={styles.editAddressButton}
                      onPress={() => setAddressModalVisible(true)}
                    >
                      <Icon name="edit" size={24} color="#68C2FF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.input2}>
                    <Picker
                      selectedValue={editableInfo.houseType}
                      onValueChange={(value) =>
                        setEditableInfo((prevState) => ({
                          ...prevState,
                          houseType: value,
                        }))
                      }
                    >
                      {houseTypeOptions.map((option) => (
                        <Picker.Item
                          key={option}
                          label={option}
                          value={option}
                          style={styles.pickerItemText}
                        />
                      ))}
                    </Picker>
                  </View>
                  <View style={styles.input2}>
                    <Picker
                      selectedValue={editableInfo.hasPet}
                      onValueChange={(value) =>
                        setEditableInfo((prevState) => ({
                          ...prevState,
                          hasPet: value,
                        }))
                      }
                    >
                      {petOptions.map((option) => (
                        <Picker.Item
                          key={option}
                          label={option}
                          value={option}
                          style={styles.pickerItemText}
                        />
                      ))}
                    </Picker>
                  </View>
                </ScrollView>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                  >
                    <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Address Modal */}
          <Modal
            visible={isAddressModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setAddressModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Address</Text>

                {/* Address input field */}
                <TextInput
                  style={styles.addressInput}
                  placeholder="Search for address"
                  value={editableInfo.address}
                  onChangeText={handleAddressChange}
                  mode="outlined"
                  outlineColor="transparent"
                  activeOutlineColor="#68C2FF"
                />

                {/* Display suggestions if any */}
                {isSaving ? (
                  <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                  showSuggestions && (
                    <ScrollView
                      style={styles.suggestionsContainer}
                      keyboardShouldPersistTaps="handled"
                    >
                      {addressSuggestions.map((item) => (
                        <TouchableOpacity
                          key={item.place_id}
                          style={styles.suggestionItem}
                          onPress={() => handleAddressSelect(item.description)} // Update the address and location
                        >
                          <Text>{item.description}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )
                )}

                {/* Map displaying pinpoint location */}
                {selectedLocation && (
                  <MapView
                    style={styles.map}
                    region={{
                      latitude: selectedLocation?.latitude || 37.7749, // Default to SF
                      longitude: selectedLocation?.longitude || -122.4194,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                  >
                    {selectedLocation && (
                      <Marker
                        coordinate={selectedLocation}
                        title="Your Location"
                      />
                    )}
                  </MapView>
                )}

                {/* Select Address Button */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setAddressModalVisible(false); // Just close the modal, don't update the address
                      setEditableInfo((prevState) => ({
                        ...prevState,
                        address: profileInfo.address, // Revert to the original address if no changes are saved
                      }));
                    }}
                  >
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSelectAddressClick}
                  >
                    <Text style={styles.buttonText}>Select Address</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Edit Confirmation Modal */}
          <Modal
            visible={isEditConfirmVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleCancelEdit}
          >
            <View style={styles.logoutModalContainer}>
              <View style={styles.logoutModalContent}>
                <Text style={styles.logoutModalText}>
                  Are you sure you want to save changes?
                </Text>
                <View style={styles.logoutModalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.logoutButtonModal,
                      isSaving && { opacity: 0.5 },
                    ]} // Add opacity for visual feedback
                    onPress={handleSave}
                    disabled={isSaving} // Disable button during loading
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollViewContent: {
    paddingBottom: 5,
  },
  container: {
    width: "100%",
    flexDirection: "column",
  },
  editButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#444444",
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  editAddressButton: {
    position: "absolute",
    top: 20,
    right: 10,
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
  },
  profileName: {
    fontFamily: "Lilita",
    fontSize: 24,
    textAlign: "center",
    marginTop: 10,
  },
  profileStatus: {
    fontFamily: "Lilita",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 50,
    color: "#68C2FF",
  },
  profileDetailsContain: {
    paddingHorizontal: 20,
  },
  detailsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  detailsText: {
    fontFamily: "Lato",
    fontSize: 16,
    marginLeft: 20,
    paddingHorizontal: 20,
  },
  horizontalLine: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "gray",
    alignSelf: "center",
  },
  logoutButton: {
    width: 150,
    height: 50,
    borderRadius: 30,
    backgroundColor: "#EF5B5B",
    alignSelf: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  logoutText: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "white",
    alignSelf: "center",
  },
  scrollViewContent2: {
    flexGrow: 1,
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "100%", // Adjust the width as needed
    maxHeight: "100%", // Restrict height of the modal content
    backgroundColor: "white",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    marginTop: 20,
  },
  input: {
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: "#F5F5F5",
    width: "100%", // Ensures the input takes up full width
  },
  input1: {
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: "#F5F5F5",
    width: "100%", // Ensures the input takes up full width
    paddingRight: 40,
  },
  input2: {
    marginTop: 10,
    marginBottom: 5,
    paddingVertical: 5,
    backgroundColor: "#F5F5F5",
    fontSize: 16,
    borderRadius: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    fontSize: 14,
  },
  pickerItemText: {
    fontFamily: "Lato",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    padding: 20,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    backgroundColor: "#68C2FF",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  addressInput: {
    marginTop: 10,
    marginBottom: 5,
    marginHorizontal: 20,
    backgroundColor: "#F5F5F5",
  },
  addressDisplay: {
    flex: 1, // Take up remaining space
    fontSize: 18, // Increase font size for better readability
    paddingHorizontal: 12, // Increase padding on left and right
    paddingVertical: 10, // Increase vertical padding for larger input
    borderRadius: 8, // Rounded corners
    backgroundColor: "#f0f0f0", // Light background color for input
    marginRight: 10, // Space between input and edit button
    height: 50, // Adjust height for a bigger input field
  },
  suggestionsContainer: {
    maxHeight: 200,
    paddingHorizontal: 20,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  selectAddressButton: {
    backgroundColor: "#0047AB", // Blue background for save button
    width: "100%", // Full width button
    paddingVertical: 15, // Vertical padding for the button
    borderRadius: 8, // Rounded corners
    marginVertical: 20,
    alignSelf: "center",
  },
  selectButtonText: {
    color: "#fff", // White text
    textAlign: "center", // Center the text inside the button
    fontSize: 16, // Text size for the save button
    fontWeight: "bold", // Bold text
  },
  closeAddressButton: {
    backgroundColor: "#ccc", // Light gray background for cancel button
    width: "100%", // Full width button
    paddingVertical: 15, // Vertical padding for the button
    borderRadius: 8, // Rounded corners
  },
  closeButtonText: {
    color: "#0047AB", // Blue text for cancel button
    textAlign: "center", // Center the text inside the button
    fontSize: 16, // Text size for the cancel button
    fontWeight: "bold", // Bold text
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
  },
  logoutModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  logoutModalContent: {
    width: "80%",
    backgroundColor: "#68C2FF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  logoutModalText: {
    fontSize: 18,
    fontFamily: "Lilita",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  logoutModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  logoutButtonModal: {
    backgroundColor: "#EF5B5B",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  uploadContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  // Address Section styles
  addressFieldContainer: {
    flexDirection: "row", // Align text and button horizontally
    justifyContent: "space-between", // Ensure space between text and button
    alignItems: "center", // Vertically center the text and button
    width: "100%", // Make sure the container is the same width as other inputs
  },
  profileImageContainer: {
    width: 244,
    height: 244,
    borderRadius: 122,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -105,
  },
  profileImage: {
    width: 240,
    height: 240,
    borderRadius: 120, // Ensures the image is circular
    borderColor: "#68C2FF",
    borderWidth: 5,
  },
  editProfileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#68C2FF",
    zIndex: 1,
    marginLeft: 150,
    marginTop: -50,
  },
  coverImage: {
    width: "100%",
    height: 210, // Adjust as needed
    resizeMode: "cover",
    marginBottom: 10,
    marginTop: -20, // Space below cover photo
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 244,
    height: 244,
    borderRadius: 122,
    borderWidth: 3,
    borderColor: "#68C2FF",
    marginTop: -130, // Overlaps cover photo
  },
  profileStatus: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 5,
  },
  map: {
    width: "90%",
    height: 0.3 * Dimensions.get("window").height,
    marginTop: 20,
    borderRadius: 10,
    alignSelf: "center",
  },
  bioText: {
    fontSize: 16,
    fontFamily: "Lilita",
    color: "#68C2FF",
    textAlign: "center",
    marginVertical: 30,
    marginBottom: -5,
  },
  noBioText: {
    color: "#777",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },
  pickCoverImage: {
    width: "115%",
    height: 220, // Adjust as needed
    resizeMode: "cover",
    marginBottom: 10,
    marginTop: -20, // Space below cover photo
  },
});

export default Profile;
