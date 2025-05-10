import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { TextInput } from "react-native-paper";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import PetProvider, { usePets } from "../context/PetContext"; // Import the context
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";

const FeedHeader = ({}) => {
  // State for dropdown and filter options

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedAge, setSelectedAge] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState([]);
  const [vaccinated, setVaccinated] = useState(null);
  const [selectedAdoptionFee, setSelectedAdoptionFee] = useState(""); // Updated state for adoption fee
  const [selectedPetType, setSelectedPetType] = useState(""); // Pet type filter (cat, dog)
  const [location, setLocation] = useState(null);
  const [noResults, setNoResults] = useState(false);

  // Animation values
  const slideAnim = useState(new Animated.Value(300))[0]; // Start position is off-screen (300px to the right)

  // Get pet context values
  const { pets, setFilteredPets, applyFilters } = usePets();

  /// Function to fetch the user's current location
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }

      // Get coordinates
      let locationData = await Location.getCurrentPositionAsync({});
      setLocation(locationData);

      // Reverse geocode to get human-readable address
      let address = await Location.reverseGeocodeAsync({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      });

      if (address.length > 0) {
        setLocation({
          city: address[0].city,
          region: address[0].region,
          country: address[0].country,
        });
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    const filterPets = () => {
      if (searchQuery.trim() === "") {
        setFilteredPets(pets);
        setNoResults(false); // Reset no results state
      } else {
        const searchWords = searchQuery.toLowerCase().split(" "); // Split the query into words
  
        const filtered = pets.filter((pet) => {
          // Check if all the search words appear in any of the pet's relevant fields
          return searchWords.every((word) =>
            pet.petName.toLowerCase().includes(word) ||
            pet.petGender.toLowerCase().includes(word) ||
            pet.petPersonality.toLowerCase().includes(word) ||
            pet.petType.toLowerCase().includes(word)
          );
        });
  
        setFilteredPets(filtered);
        setNoResults(filtered.length === 0); // Set no results state
      }
    };
  
    const timeoutId = setTimeout(filterPets, 300); // Debounce
    return () => clearTimeout(timeoutId); // Cleanup timeout
  }, [searchQuery, pets, setFilteredPets]);
  
  // Handle filter button click
  const handleFilterClick = () => {
    if (isLoading) return; // Prevent further clicks if already loading

    setIsLoading(true); // Start loading

    // Animate the modal sliding in from the right
    Animated.timing(slideAnim, {
      toValue: 0, // End position (visible on screen)
      duration: 300,
      useNativeDriver: true, // Use native driver for better performance
    }).start(() => {
      setIsLoading(false); // Stop loading once animation is done
      setModalVisible(true); // Show the modal
    });
  };

  // Handle modal close
  const closeModal = () => {
    // Animate the modal sliding out to the right
    Animated.timing(slideAnim, {
      toValue: 300, // Start position (off the screen)
      duration: 300,
      useNativeDriver: true,
    }).start(() => setModalVisible(false)); // After the animation completes, hide the modal
  };

  // Apply filters using the context function
  const applyFiltersToPets = () => {
    const filters = {
      gender: selectedGender,
      age: selectedAge,
      weight: selectedWeight,
      personality: selectedPersonality,
      petType: selectedPetType, // Add pet type filter
      vaccinated: vaccinated,
      adoptionFee: selectedAdoptionFee, // Updated filter for adoption fee
      petType: selectedPetType, // Add pet type filter
    };

    applyFilters(filters); // Call applyFilters from context

    // Reset all the filter states after applying the filters
    setSelectedGender(""); // Reset gender filter
    setSelectedAge(""); // Reset age filter
    setSelectedWeight(""); // Reset weight filter
    setSelectedPersonality([]); // Reset personality filter
    setSelectedPetType(""); // Reset pet type filter
    setVaccinated(null); // Reset vaccinated filter
    setSelectedAdoptionFee(""); // Reset adoption fee filter
    setSelectedPetType(""); // Reset pet type filter

    setModalVisible(false); // Close modal after applying filters
  };

  return (
    <PetProvider>
      <ScrollView>
        <View style={styles.headerContainer}>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Icon
              name="search"
              size={24}
              color="#444444"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#C2C2C2"
              onChangeText={setSearchQuery}
              value={searchQuery}
              mode="outlined"
              outlineColor="transparent"
              activeOutlineColor="#68C2FF"
            />
            <TouchableOpacity
              onPress={handleFilterClick}
              style={styles.filterButton}
            >
              <FontAwesome name="filter" size={24} color="#444444" />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Discover Pets Looking for Homes</Text>
          </View>

          {/* Location Info */}
          <View style={styles.locationHeader}>
            <View style={styles.locationContainer}>
              <Icon name="location-on" size={20} color="#EF5B5B" />
              <Text style={styles.locationText}>
                {location
                  ? `${location.city}, ${location.region}, ${location.country}`
                  : "Loading location..."}
              </Text>
            </View>
          </View>

          {/* Modal for Filter Options */}
          <Modal visible={modalVisible} transparent={true} animationType="fade">
            <View style={styles.modalOverlay}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  { transform: [{ translateX: slideAnim }] }, // Apply sliding animation
                ]}
              >
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                  <View style={styles.modalHeaderContainer}>
                    <Text style={styles.modalTitle}>Filter Pets</Text>
                    <TouchableOpacity
                      style={styles.buttonStyle2}
                      onPress={closeModal}
                    >
                      <Feather name="x" size={24} color="white" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.horizontalLine}></View>

                  {/* Gender Filter */}
                  <Text style={styles.modalText}>Gender</Text>
                  <View style={styles.input2}>
                    <Picker
                      selectedValue={selectedGender}
                      onValueChange={(itemValue) =>
                        setSelectedGender(itemValue)
                      }
                      style={styles.picker}
                    >
                      <Picker.Item
                        label="Select Gender"
                        value=""
                        color="gray"
                      />
                      <Picker.Item label="Male" value="Male" />
                      <Picker.Item label="Female" value="Female" />
                    </Picker>
                  </View>

                  {/* Other Filters (Age, Weight, Personality, Vaccinated) */}
                  <Text style={styles.modalText}>Age (years)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Age"
                    placeholderTextColor={"gray"}
                    fontFamily={"Lato"}
                    keyboardType="numeric"
                    value={selectedAge}
                    onChangeText={(text) => setSelectedAge(text)}
                    mode="outlined"
                    outlineColor="transparent"
                    activeOutlineColor="#68C2FF"
                    autoCapitalize="sentences"
                  />

                  <Text style={styles.modalText}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Weight"
                    placeholderTextColor={"gray"}
                    fontFamily={"Lato"}
                    keyboardType="number-pad"
                    value={selectedWeight}
                    onChangeText={(text) => setSelectedWeight(text)}
                    mode="outlined"
                    outlineColor="transparent"
                    activeOutlineColor="#68C2FF"
                    autoCapitalize="sentences"
                  />

                  <Text style={styles.modalText}>Personality</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Personality Traits"
                    placeholderTextColor={"gray"}
                    fontFamily={"Lato"}
                    value={selectedPersonality.join(", ")}
                    onChangeText={(text) =>
                      setSelectedPersonality(
                        text.split(",").map((item) => item.trim())
                      )
                    }
                    mode="outlined"
                    outlineColor="transparent"
                    activeOutlineColor="#68C2FF"
                    autoCapitalize="sentences"
                  />

                  <Text style={styles.modalText}>Vaccinated</Text>
                  <View style={styles.input2}>
                    <Picker
                      selectedValue={vaccinated}
                      onValueChange={(itemValue) => setVaccinated(itemValue)}
                      style={[styles.picker, { fontFamily: "Lato" }]}
                    >
                      <Picker.Item
                        label="Select Vaccinated Status"
                        value={null}
                        color="gray"
                        style={{ fontFamily: "Lato" }}
                      />
                      <Picker.Item
                        label="Yes"
                        value="Yes"
                        style={{ fontFamily: "Lato" }}
                      />
                      <Picker.Item
                        label="No"
                        value="No"
                        style={{ fontFamily: "Lato" }}
                      />
                    </Picker>
                  </View>

                  {/* Pet Type Filter */}
                  <Text style={styles.modalText}>Pet Type</Text>
                  <View style={styles.input2}>
                    <Picker
                      selectedValue={selectedPetType}
                      onValueChange={(itemValue) =>
                        setSelectedPetType(itemValue)
                      }
                      style={styles.picker}
                    >
                      <Picker.Item
                        label="Select Pet Type"
                        value=""
                        color="gray"
                      />
                      <Picker.Item label="Cat" value="Cat" />
                      <Picker.Item label="Dog" value="Dog" />
                    </Picker>
                  </View>

                  {/* Price Range Filter */}
                  <Text style={styles.modalText}>Adoption Fee Range (₱)</Text>
                  <View style={styles.input2}>
                    <Picker
                      selectedValue={selectedAdoptionFee}
                      onValueChange={setSelectedAdoptionFee}
                      style={styles.picker}
                    >
                      <Picker.Item
                        label="Select Adoption Fee Range"
                        value=""
                        color="gray"
                      />
                      <Picker.Item label="₱0 - ₱200" value="0-200" />
                      <Picker.Item label="₱201 - ₱400" value="201-400" />
                      <Picker.Item label="₱401 - ₱600" value="401-600" />
                      <Picker.Item label="₱601 - ₱800" value="601-800" />
                      <Picker.Item label="₱801 - ₱1000" value="801-1000" />
                      <Picker.Item label="₱1000+" value="1001-1200" />
                    </Picker>
                  </View>

                  {/* Apply and Close Buttons */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.buttonStyle,
                        isLoading && { opacity: 0.5 },
                      ]}
                      onPress={applyFiltersToPets}
                      disabled={isLoading} // Disable button while loading
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Apply Filters</Text>
                      )}
                    </TouchableOpacity>

                    {/* Edit Preferences Button */}
                    <TouchableOpacity
                      style={styles.preferencesButton}
                      onPress={() => router.push("Preferences")}
                    >
                      <Text style={styles.preferencesText}>
                        Edit Preferences
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </Animated.View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </PetProvider>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    padding: 20,
    paddingTop: 0,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    elevation: 10,
    paddingBottom: 10,
  },
  locationHeader: {
    width: "100%",
    paddingLeft: -10,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  locationText: {
    fontSize: 16,
    fontFamily: "Lato",
    marginLeft: 3,
    color: "#C2C2C2",
  },
  titleContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Lilita",
    color: "#68C2FF",
    marginTop: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-end", // Center the search bar
    width: "88%", // Adjust the width of the search bar to 90% of its parent container
    marginTop: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#444",
    paddingHorizontal: 10,
    backgroundColor: "#F3F3F3",
  },
  filterButton: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Dim the background
    justifyContent: "flex-start",
    alignItems: "flex-end", // Align the modal to the right
  },
  modalContainer: {
    width: "70%", // Width of the modal
    height: "100%", // Full height
    backgroundColor: "#fff",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 10,
  },
  modalHeaderContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: "Lilita",
    color: "#68C2FF",
    marginTop: 5,
  },
  buttonStyle2: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EF5B5B",
  },
  modalText: {
    fontFamily: "LatoBold",
    marginVertical: 10,
  },
  horizontalLine: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "gray",
    alignSelf: "center",
  },
  input: {
    marginBottom: 5,
    backgroundColor: "#F5F5F5",
  },
  input2: {
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
  buttonContainer: {
    flexDirection: "row", // Arrange buttons in a row
    justifyContent: "space-between", // Space between buttons
    alignItems: "center", // Center vertically
    marginTop: 20,
  },
  buttonStyle: {
    justifyContent: "center", // Center vertically
    alignItems: "center", // Center horizontally
    width: "48%", // Half width
    borderWidth: 1,
    borderRadius: 30,
    borderColor: "white",
    height: 50,
    backgroundColor: "#68C2FF",
  },
  buttonText: {
    textAlign: "center",
    color: "white",
    fontFamily: "LatoBold",
    fontSize: 16,
  },
  preferencesButton: {
    justifyContent: "center", // Center vertically
    alignItems: "center", // Center horizontally
    width: "48%", // Half width
    borderWidth: 1,
    borderRadius: 30,
    borderColor: "white",
    height: 50,
    backgroundColor: "#68C2FF",
  },
  preferencesText: {
    textAlign: "center",
    color: "white",
    fontFamily: "LatoBold",
    fontSize: 16,
  },
});

export default FeedHeader;