import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator, 
} from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "./config/firebase";
import { getStorage, ref, getDownloadURL } from "firebase/storage"; // Firebase storage import
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GOOGLE_API_KEY } from "./config/googleconfig"; // Import the Google API key
import Geolocation from "react-native-geocoding";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const screenWidth = Dimensions.get("window").width; // Full screen width
const adjustedWidth = screenWidth - 40; // Subtract 20 padding on both sides

export default function ApproveAdoption() {
  const router = useRouter();
  const { petRequestId } = useLocalSearchParams();
  const [isFinalized, setIsFinalized] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]); // Store autocomplete suggestions
  const [selectedAddress, setSelectedAddress] = useState(""); // Store the selected address
  const [isAddressModalVisible, setAddressModalVisible] = useState(false); // Correct initialization
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // State for adopter and pet details
  const [petRequestDetails, setPetRequestDetails] = useState({});
  const [petDetails, setPetDetails] = useState({});
  const [deliveryDetails, setDeliveryDetails] = useState({
    type: "Motor Delivery", // Default to Motor Delivery
    expectedDate: "20 - 23 Dec",
    cost: 200, // Default to Motorcycle Delivery cost
  });
  const [paymentMethod, setPaymentMethod] = useState("Cash On Delivery");
  const [transactionSummary, setTransactionSummary] = useState([
    { title: "Adoption Fee", amount: 0 },
    { title: "Transportation Cost", amount: 200 }, // Default transportation cost for motor delivery
    { title: "Convenience Fee", amount: 0 },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDeliveryType, setSelectedDeliveryType] =
    useState("Motor Delivery");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState(petRequestDetails.address || "");
  const [newPhoneNumber, setNewPhoneNumber] = useState(
    petRequestDetails.contactNumber || ""
  );
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const scrollViewRef = useRef(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  // State for image URLs and scroll functionality
  const [imageURLs, setImageURLs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Function to calculate the estimated delivery date (5-8 days from current date)
  const getEstimatedDeliveryDate = () => {
    const today = new Date();

    // Calculate minimum and maximum delivery dates
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 5);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 8);

    // Get day and month names
    const dayMin = minDate.getDate();
    const monthMin = minDate.toLocaleString("default", { month: "long" });

    const dayMax = maxDate.getDate();
    const monthMax = maxDate.toLocaleString("default", { month: "long" });

    // Check if months are different
    if (monthMin === monthMax) {
      return `${monthMin} ${dayMin} - ${dayMax}`;
    } else {
      return `${monthMin} ${dayMin} - ${monthMax} ${dayMax}`;
    }
  };

  const expectedDate = getEstimatedDeliveryDate();

  const fetchImageURLs = async (imagePaths) => {
    console.log("Fetching image URLs..."); // Log before fetching
    const storage = getStorage();

    try {
      const imageURLs = await Promise.all(
        imagePaths.map(async (imagePath) => {
          console.log(`Fetching URL for image path: ${imagePath}`); // Log the path being fetched
          const imageRef = ref(storage, imagePath);
          const url = await getDownloadURL(imageRef);
          console.log(`Image URL fetched: ${url}`); // Log the URL once fetched
          return url;
        })
      );
      setImageURLs(imageURLs); // Save URLs to state
    } catch (error) {
      console.error("Error fetching image URLs: ", error); // Log any error encountered
      setImageURLs([]); // Handle error gracefully
    }
  };

  useEffect(() => {
    const fetchPetDetails = async () => {
      if (petRequestId) {
        console.log(`Fetching pet details for petRequestId: ${petRequestId}`);
  
        const petDocRef = doc(db, "pet_request", petRequestId);
        const docSnap = await getDoc(petDocRef);
  
        if (docSnap.exists()) {
          const petData = docSnap.data();
          if (petData.petDetail) {
            setPetDetails(petData.petDetail);
            if (petData.petDetail.images) {
              fetchImageURLs(petData.petDetail.images); // Fetch image URLs
            }
          }
        }
      }
    };
  
    const fetchPetRequestDetails = async () => {
      if (petRequestId) {
        const requestDocRef = doc(db, "pet_request", petRequestId);
        const docSnap = await getDoc(requestDocRef);
  
        if (docSnap.exists()) {
          const petRequestData = docSnap.data();
          const adopterEmail = petRequestData.adopterEmail;
          setPetRequestDetails(petRequestData);
          fetchUserDetails(adopterEmail);
        }
      }
    };
  
    const fetchUserDetails = async (adopterEmail) => {
      if (adopterEmail) {
        const userRef = collection(db, "users");
        const q = query(userRef, where("email", "==", adopterEmail));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          setPetRequestDetails((prevDetails) => ({
            ...prevDetails,
            ...doc.data(),
          }));
          setNewAddress(doc.data().address || "");  // Initialize address
          setNewPhoneNumber(doc.data().contactNumber || "");  // Initialize phone
        });
      }
    };
  
    const checkPermissionsAndFetch = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission denied');
        setSelectedLocation({ latitude: 0, longitude: 0 });
        return;
      }
      fetchPetDetails();  // Only fetch if permission is granted
    };
  
    checkPermissionsAndFetch();
    fetchPetRequestDetails();
  
    // Set estimated delivery date
    const estimatedDate = getEstimatedDeliveryDate();
    setDeliveryDetails((prevDetails) => ({
      ...prevDetails,
      expectedDate: estimatedDate,
    }));
  }, [petRequestId]);
  
  
  let debounceTimeout;  // Define this outside the function to persist between calls

  // Update address directly as a string, not an object
  const handleAddressChange = async (text) => {
    setNewAddress(text); // Set newAddress as a string directly
    setShowSuggestions(true); // Show the suggestions dropdown when typing

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
  
    if (text.length > 2) {
      debounceTimeout = setTimeout(() => {
        fetchAddressSuggestions(text);
      }, 500);  // 500ms delay before triggering API call
    }
  };

  // Fetch address suggestions from Google API
  const fetchAddressSuggestions = async (query) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${GOOGLE_API_KEY}`
      );
      console.log("Google API Key:", GOOGLE_API_KEY);

      const data = await response.json();
      setAddressSuggestions(data.predictions);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleAddressSelect = async (address) => {
    console.log("Selected address from suggestions:", address); // Debugging log
    setNewAddress(address); // Update the new address state
    setShowSuggestions(false); // Close the suggestions list
  
    try {
      const response = await Location.geocodeAsync(address);
  
      if (response && response.length > 0) {
        const { latitude, longitude } = response[0];
        setSelectedLocation({ latitude, longitude });
        console.log("Geocoding successful. Location:", { latitude, longitude });
      } else {
        console.log("Geocoding failed. No response or incorrect data.");
        alert("Could not find the location. Please verify the address.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Failed to fetch location. Please check your internet connection.");
    }
  };
  
  const handleSelectAddressClick = () => {
    const address = newAddress; // Get the address from the state

    console.log('Address on "Select Address" button click:', address); // Debugging log

    // Remove the check for the same address
    console.log("Updating selected address and geocoding it..."); // Debugging log
    setSelectedAddress(address); // Set the selected address in state
    setNewAddress(address); // Update the new address state

    // Close the modal after selecting the address
    setAddressModalVisible(false);
    console.log("Modal closed after address selection."); // Debugging log
  };

  // Update transaction summary when delivery or adoption fee changes
  useEffect(() => {
    const adoptionFee = parseFloat(petDetails.adoptionFee) || 0; // Adoption fee from pet details
    const convenienceFee = adoptionFee <= 1000 ? 200 : adoptionFee * 0.2;

    const updatedTransactionSummary = [
      { title: "Adoption Fee", amount: adoptionFee },
      { title: "Transportation Cost", amount: deliveryDetails.cost },
      { title: "Convenience Fee", amount: convenienceFee },
    ];

    setTransactionSummary(updatedTransactionSummary);
  }, [deliveryDetails, petDetails]);

  const calculateTotal = () => {
    return transactionSummary.reduce((total, item) => total + item.amount, 0);
  };

  const handleEditDetails = async () => {
    console.log("Saving details:", newAddress, newPhoneNumber); // Debug log

    try {
      // Query Firestore to get the adopter document based on the email
      const userRef = collection(db, "users");
      const q = query(
        userRef,
        where("email", "==", petRequestDetails.adopterEmail)
      ); // Use adopter email for querying

      const querySnapshot = await getDocs(q);

      // If the adopter exists in Firestore
      if (!querySnapshot.empty) {
        // Get the document reference from the query result
        const userDoc = querySnapshot.docs[0]; // Assuming there's only one document with the given email
        const userDocRef = userDoc.ref;

        // Update the adopter's address and phone number
        await updateDoc(userDocRef, {
          address: newAddress,
          contactNumber: newPhoneNumber,
        });

        // Update the local state with the new details
        setPetRequestDetails((prevDetails) => ({
          ...prevDetails,
          address: newAddress,
          contactNumber: newPhoneNumber,
        }));

        // Close the edit modal
        setEditModalVisible(false);
      } else {
        console.log(
          "Adopter not found with email:",
          petRequestDetails.adopterEmail
        );
        alert("Adopter not found.");
      }
    } catch (error) {
      console.error("Error updating adopter details:", error);
      alert("Error updating details. Please try again.");
    }
  };

  const handleDeliveryOptionSelect = (option) => {
    let cost = 0;
    if (option === "Car Delivery") {
      cost = 300;
    } else if (option === "Motor Delivery") {
      cost = 200;
    }
    setSelectedDeliveryType(option);
    setDeliveryDetails({ ...deliveryDetails, type: option, cost });
    setModalVisible(false);
  };

  const handleShowConfirmationModal = () => {
    setConfirmationModalVisible(true);
  };

  const handleCancelAdoption = async () => {
    try {
      if (!petRequestId) {
        alert("No pet request found.");
        return;
      }

      // Reference to the specific pet request document
      const petRequestRef = doc(db, "pet_request", petRequestId);

      // Get the current date to store as cancelDate
      const cancelDate = new Date();

      // Update the status field to 'Cancelled' and add cancelDate
      await updateDoc(petRequestRef, {
        status: "Cancelled",
        cancelDate: cancelDate, // Add cancelDate to the document
        adopterNotificationRead: false, // Reset adopter notificationRead to false
        listerNotificationRead: false, // Reset lister notificationRead to false
      });

      alert("Adoption request cancelled successfully.");

      // Optionally, navigate to another page or refresh the current screen
      router.push("/Main/Notification");
    } catch (error) {
      console.error("Error cancelling adoption:", error);
      alert("Failed to cancel adoption. Please try again.");
    }
  };

  const handleShowCancelModal = () => {
    setCancelModalVisible(true);
  };

  const handleConfirmFinalization = async () => {
    if (!petRequestDetails.address) {
      alert("Can't proceed without an address");
      return;
    }

    console.log("Pet Request Details:", petRequestDetails); // Debugging log

    setIsProcessing(true);
    try {
      const { petName, listedBy, petDetail } = petRequestDetails;

      // Ensure petName and listedBy email are present
      if (!petName || !listedBy) {
        throw new Error(
          "Missing petName or listedBy email. Cannot finalize adoption."
        );
      }

      // Fetch the pet document using petName and listedBy email
      const petQuery = query(
        collection(db, "listed_pets"),
        where("petName", "==", petName),
        where("listedBy", "==", listedBy)
      );

      const petQuerySnapshot = await getDocs(petQuery);

      if (petQuerySnapshot.empty) {
        throw new Error(
          `No pet found with name ${petName} listed by ${listedBy}`
        );
      }

      // Get the pet document ID from the query result
      const petDoc = petQuerySnapshot.docs[0]; // Assuming the first result is correct
      const petId = petDoc.id;

      // Fetch the pet request document using petRequestId
      const petRequestRef = doc(db, "pet_request", petRequestId);
      const petRequestDoc = await getDoc(petRequestRef);
      if (!petRequestDoc.exists()) {
        throw new Error(`Pet request with ID ${petRequestId} not found`);
      }

      // Add finalized adoption data to Firestore
      const finalizedAdoptionData = {
        petRequestId,
        petRequestDetails,
        deliveryDetails,
        paymentMethod,
        transactionSummary,
        totalAmount: calculateTotal(),
        status: "finalized",
        tracking_status: "Preparing",
        dateFinalized: new Date().toISOString(),
      };

      // Add finalized adoption data to the 'finalized_adoption' collection
      const finalizedCollectionRef = collection(db, "finalized_adoption");
      await addDoc(finalizedCollectionRef, finalizedAdoptionData);

      // Update the status of the listed pet using the petId
      const listedPetRef = doc(db, "listed_pets", petId);
      await updateDoc(listedPetRef, { status: "finalized" });

      // Now update the original pet_request document with notification read status
      console.log(
        `Updating pet request document with adopterNotificationRead and listerNotificationRead for petRequestId: ${petRequestId}`
      );
      await updateDoc(petRequestRef, {
        adopterNotificationRead: false,
        listerNotificationRead: false,
      });

      // Update local state and persist finalized state
      setIsFinalized(true);
      await AsyncStorage.setItem(`finalized-${petRequestId}`, "true");

      router.push("/FinalizedAdoption");
    } catch (error) {
      console.error("Error finalizing adoption:", error);
      alert(`Failed to finalize adoption. Reason: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const checkFinalizedState = async () => {
      const savedState = await AsyncStorage.getItem(
        `finalized-${petRequestId}`
      );
      if (savedState === "true") {
        setIsFinalized(true);
      }
    };

    if (petRequestId) {
      checkFinalizedState();
    }
  }, [petRequestId]);

  // Handle scroll event for pagination dots
  const onScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageWidth = event.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(contentOffsetX / pageWidth);
    setCurrentIndex(index);
  };

  if (
    !petDetails ||
    !petRequestDetails ||
    !petDetails.petName ||
    !petRequestDetails.name
  ) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#68C2FF" />
        <Text style={styles.loadingText}>Loading pet details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Back Button */}
          <View style={styles.buttonTitleImageContainer}>
            <View style={styles.backButtonContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Icon name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.titleText}>
              Ready to adopt {petDetails.petName}?
            </Text>

            {/* Horizontal Image Scroll with Pagination */}
            {imageURLs.length > 0 && (
              <View>
                <ScrollView
                  horizontal={true}
                  style={styles.imageScrollContainer}
                  ref={scrollViewRef}
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled={true}
                >
                  {imageURLs.map((imageURL, index) => (
                    <View key={index} style={styles.petImageContainer}>
                      <Image
                        source={{ uri: imageURL }}
                        style={styles.petImage}
                      />
                    </View>
                  ))}
                </ScrollView>

                {/* Pagination Dots */}
                <View style={styles.paginationContainer}>
                  {imageURLs.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === currentIndex && styles.activeDot,
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Horizontal Line */}
          <View style={styles.horizontalLine}></View>

          {/* Adopter Details */}
          <View style={styles.petRequestDetailsButton}>
            <View style={styles.petRequestDetailsContainer}>
              <View style={styles.row}>
                <Text style={styles.adopterName}>{petRequestDetails.name}</Text>
                <Text style={styles.adopterContactNumber}>
                  {petRequestDetails.contactNumber}
                </Text>
              </View>
              <Text style={styles.adopterAddress}>
                {petRequestDetails.address || "Address not provided"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
            >
              <MaterialIcons name="edit" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {/* Horizontal Line */}
          <View style={styles.horizontalLine}></View>

          {/* Delivery Option */}
          <View style={styles.deliveryPaymentContainer}>
            <View style={styles.deliveryContainer}>
              <Text style={styles.deliveryText}>Delivery Option</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.optionsText}>View all options {">"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.deliveryInfoMainContainer}>
              <View style={styles.deliveryInfoContainer}>
                <Text style={styles.deliveryTypeText}>
                  {selectedDeliveryType}
                </Text>
                <View style={styles.truckDateContainer}>
                  {selectedDeliveryType === "Motor Delivery" ? (
                    <FontAwesome5 name="motorcycle" size={16} color="black" />
                  ) : (
                    <FontAwesome5 name="truck" size={16} color="black" />
                  )}
                  <Text style={styles.expectedDeliveryDateText}>
                    Receive By {expectedDate}
                  </Text>
                </View>
              </View>
              <Text style={styles.deliveryAmountText}>
                ₱{deliveryDetails.cost.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.paymentMainContainer}>
            <View style={styles.paymentContainer}>
              <Text style={styles.paymentText}>Payment Method</Text>
            </View>
            <View style={styles.paymentInfoMainContainer}>
              <Text style={styles.paymentTypeText}>{paymentMethod}</Text>
            </View>
          </View>

          {/* Horizontal Line */}
          <View style={styles.horizontalLine}></View>

          {/* Transaction Summary */}
          <View style={styles.transactionSummaryMainContainer}>
            <View style={styles.transactionSummaryContainer}>
              {transactionSummary.map((item, index) => (
                <View style={styles.transactionTextContainer} key={index}>
                  <Text style={styles.titleSummaryText}>{item.title}</Text>
                  <Text style={styles.amountSummaryText}>
                    ₱{item.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
              <View style={styles.transactionTextContainer}>
                <Text style={styles.titleSummaryText}>Total Cost</Text>
                <Text style={styles.paymentTotalText}>
                  ₱{calculateTotal().toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Horizontal Line */}
          <View style={styles.horizontalLine}></View>

          {/* Payment Section */}
          <View style={styles.paymentSectionContainer}>
            <TouchableOpacity
              style={[
                styles.finalizeCancelButton,
                isFinalized && styles.cancelDisabledButton,
              ]} // Apply disabled style
              onPress={isFinalized ? null : handleShowCancelModal} // Prevent action if finalized
              disabled={isFinalized} // Disable button if finalized
            >
              <Text
                style={[
                  styles.finalizeCancelButtonText,
                  isFinalized && styles.disabledButtonText,
                ]} // Apply disabled text style
              >
                {isFinalized ? "Cannot Cancel" : "Cancel Adoption"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.finalizeButton,
                isFinalized && styles.disabledButton, // Disabled style
              ]}
              onPress={isFinalized ? null : handleShowConfirmationModal} // Prevent further action if finalized
              disabled={isFinalized} // Disable button if finalized
            >
              <Text
                style={[
                  styles.finalizeButtonText,
                  isFinalized && styles.disabledButtonText,
                ]}
              >
                {isFinalized ? "Adoption Finalized" : "Finalize Adoption"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent={true}
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}></View>
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Address and Phone Number</Text>

          {/* Address Field */}
          <View style={styles.addressFieldContainer}>
            <TextInput
              style={styles.input1}
              placeholder="Enter new address"
              value={newAddress || ""}
              editable={false} // Make it read-only until edit is triggered
              onChangeText={handleAddressChange}
              mode="outlined"
              outlineColor="transparent"
              activeOutlineColor="#68C2FF"
            />
            <TouchableOpacity
              style={styles.editAddressButton}
              onPress={() => setAddressModalVisible(true)} // Open the address modal
            >
              <MaterialIcons name="edit" size={24} color="#68C2FF" />
            </TouchableOpacity>
          </View>

          {/* Phone Number Input */}
          <Text style={styles.question}>Phone Number:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new phone number"
            value={newPhoneNumber}
            onChangeText={setNewPhoneNumber}
            keyboardType="number-pad"
            mode="outlined"
            outlineColor="transparent"
            activeOutlineColor="#68C2FF"
            autoCapitalize="words"
          />

          <View style={styles.editAdopterContainer}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleEditDetails} // Save the changes
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
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
        <View style={styles.modalAddressContainer}>
          <View style={styles.modalAddressContent}>
            <Text style={styles.modalAddressTitle}>Edit Address</Text>

            {/* Address input field */}
            <TextInput
              style={styles.addressInput}
              placeholder="Search for address"
              value={newAddress} // Set the value of the input field to newAddress
              onChangeText={handleAddressChange} // Handle the input change
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
               latitude: selectedLocation?.latitude || 37.7749,  // Default to SF
               longitude: selectedLocation?.longitude || -122.4194,
               latitudeDelta: 0.0922,
               longitudeDelta: 0.0421,
             }}
           >
             {selectedLocation && (
               <Marker coordinate={selectedLocation} title="Your Location" />
             )}
           </MapView>           
            )}


            {/* Select Address Button */}
            <View style={styles.modalButtons}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeAddressButton}
                onPress={() => {
                  setAddressModalVisible(false); // Just close the modal, don't update the address
                  setNewAddress(petRequestDetails.address || ""); // Revert to the original address
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.selectAddressButton}
                onPress={handleSelectAddressClick}
              >
                <Text style={styles.selectButtonText}>Select Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Adoption Modal */}
      <Modal
        transparent={true}
        visible={cancelModalVisible}
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCancelModalVisible(false)}>
          <View style={styles.modalOverlay}></View>
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Cancel Adoption</Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to cancel adoption for {petDetails.petName}?
            You will need to request adoption again if you change your mind.
          </Text>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCancelModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>No, Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleCancelAdoption}
            >
              <Text style={styles.confirmButtonText}>Yes, Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for Delivery Options */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}></View>
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Delivery Option</Text>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => handleDeliveryOptionSelect("Car Delivery")}
          >
            <Text style={styles.modalOptionText}>Car</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => handleDeliveryOptionSelect("Motor Delivery")}
          >
            <Text style={styles.modalOptionText}>Motorcycle</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={confirmationModalVisible}
        animationType="fade"
        onRequestClose={() => setConfirmationModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setConfirmationModalVisible(false)}
        >
          <View style={styles.modalOverlay}></View>
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Confirm Finalization</Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to finalize the adoption process?
          </Text>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setConfirmationModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, isProcessing && { opacity: 0.5 }]}
              onPress={handleConfirmFinalization}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Lato",
    color: "#68C2FF",
  },
  scrollViewContent: {
    paddingBottom: 0,
  },
  container: {
    width: "100%",
    flexDirection: "column",
  },
  buttonTitleImageContainer: {
    flex: 1,
    padding: 20,
  },
  backButtonContainer: {
    backgroundColor: "gray",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
  },
  titleText: {
    fontSize: 24,
    color: "#68C2FF",
    marginBottom: 20,
    fontFamily: "Lilita",
    marginBottom: 30,
  },
  petImage: {
    width: adjustedWidth,
    height: 400,
    borderRadius: 20,
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  imageScrollContainer: {
    flex: 1,
  },
  imageContentContainer: {
    flexDirection: "row", // Ensure images are laid out horizontally in a row
    alignItems: "flex-start", // Align items to the start of the container (no space on left)
  },
  petImageContainer: {
    flexDirection: "row",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -40,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    margin: 4,
  },
  activeDot: {
    backgroundColor: "#68C2FF",
  },
  horizontalLine: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "gray",
    alignSelf: "center",
  },
  // Modal Styles
  question: {
    marginTop: 10,
    fontFamily: "Lato",
    fontSize: 16,
  },
  input: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: "#F5F5F5",
  },
  input1: {
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: "#F5F5F5",
    width: "100%", // Ensures the input takes up full width
    paddingRight: 40,
  },
  editAdopterContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#68C2FF",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginLeft: 5,
  },
  saveButtonText: {
    fontSize: 18,
    fontFamily: "LatoBold",
    color: "#fff",
    textAlign: "center",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#444",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginRight: 5,
  },
  cancelButtonText: {
    fontSize: 18,
    fontFamily: "LatoBold",
    color: "#fff",
    textAlign: "center",
  },
  modalMessage: {
    fontFamily: "Lato",
    fontSize: 16,
  },
  modalButtonContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#444",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginRight: 5,
  },
  cancelButtonText: {
    fontSize: 18,
    fontFamily: "LatoBold",
    color: "#fff",
    textAlign: "center",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#68C2FF",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginLeft: 5,
  },
  confirmButtonText: {
    fontSize: 18,
    fontFamily: "LatoBold",
    color: "#fff",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    flex: 0.3,
    backgroundColor: "white",
    padding: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontFamily: "LatoBold",
    fontSize: 18,
  },
  addressFieldContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  editAddressButton: {
    position: "absolute",
    top: 20,
    right: 10,
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  modalOptionText: {
    fontFamily: "Lato",
    fontSize: 16,
  },
  petRequestDetailsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
  },
  petRequestDetailsContainer: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  adopterName: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#000",
  },
  adopterContactNumber: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "#888",
    marginLeft: 20,
  },
  adopterAddress: {
    fontFamily: "Lato",
    fontSize: 16,
  },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "white",
    alignItems: "center", // Centers horizontally
    justifyContent: "center", // Centers vertically
    elevation: 3,
  },
  deliveryPaymentContainer: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
  },
  deliveryContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  deliveryText: {
    fontFamily: "LatoBold",
    fontSize: 16,
  },
  optionsText: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "#68C2FF",
  },
  deliveryInfoMainContainer: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#F3F3F3",
    padding: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  deliveryInfoContainer: {
    flex: 1,
  },
  deliveryTypeText: {
    fontFamily: "LatoBold",
    fontSize: 16,
  },
  truckDateContainer: {
    flex: 1,
    flexDirection: "row",
  },
  expectedDeliveryDateText: {
    fontFamily: "Lato",
    fontSize: 16,
    marginLeft: 10,
  },
  deliveryAmountText: {
    fontFamily: "LatoBold",
    fontSize: 16,
  },
  paymentMainContainer: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
  },
  paymentContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  paymentText: {
    fontFamily: "LatoBold",
    fontSize: 16,
  },
  optionsText: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "#68C2FF",
  },
  paymentInfoMainContainer: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#F3F3F3",
    padding: 20,
    borderRadius: 10,
  },
  paymentTypeText: {
    fontFamily: "Lato",
    fontSize: 16,
  },
  transactionSummaryMainContainer: {
    width: "100%",
    flexDirection: "column",
  },
  transactionSummaryContainer: {
    flex: 1,
    padding: 20,
  },
  transactionTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  titleSummaryText: {
    fontFamily: "Lato",
    fontSize: 16,
  },
  amountSummaryText: {
    fontFamily: "LatoBold",
    fontSize: 16,
  },
  paymentSectionContainer: {
    flex: 1,
    marginTop: 70,
    backgroundColor: "#68C2FF",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  paymentTotalText: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "red",
  },
  finalizeButton: {
    width: 160,
    height: 50,
    backgroundColor: "#444",
    borderRadius: 30,
    justifyContent: "center",
    marginLeft: 10,
  },
  finalizeButtonText: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
  finalizeCancelButton: {
    width: 160,
    height: 50,
    backgroundColor: "#EF5B5B",
    borderRadius: 30,
    justifyContent: "center",
    marginRight: 10,
  },
  finalizeCancelButtonText: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
  disabledButton: {
    backgroundColor: "#D3D3D3", // Gray background for disabled state
  },
  cancelDisabledButton: {
    backgroundColor: "#f8baba", // Gray background for disabled state
  },
  disabledButtonText: {
    color: "#fff", // White text for disabled button
  },
  modalAddressContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalAddressContent: {
    width: "90%", // Adjust the width as needed
    maxHeight: "100%", // Restrict height of the modal content
    backgroundColor: "white",
    borderRadius: 10,
  },
  modalAddressTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    marginTop: 20,
  },
  addressInput: {
    marginTop: 10,
    marginBottom: 5,
    marginHorizontal: 20,
    backgroundColor: "#F5F5F5",
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
  map: {
    width: "90%",
    height: 0.3 * Dimensions.get('window').height, 
    marginTop: 20,
    borderRadius: 10,
    alignSelf: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    padding: 20,
    gap: 10,
  },
  selectAddressButton: {
    flex: 1,
    backgroundColor: "#68C2FF",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  selectButtonText: {
    fontSize: 18,
    fontFamily: "LatoBold",
    color: "#fff",
    textAlign: "center",
  },
  closeAddressButton: {
    flex: 1,
    backgroundColor: "#444",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  closeButtonText: {
    fontSize: 18,
    fontFamily: "LatoBold",
    color: "#fff",
    textAlign: "center",
  },

  // Display of selected address, larger field
  addressDisplay: {
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginBottom: 10,
    height: 50,
  },
});