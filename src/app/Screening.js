import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  query,
  where,
  getDocs,
  collection,
  updateDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "./config/firebase"; // Ensure db is initialized
import Icon from "react-native-vector-icons/MaterialIcons";
import RejectReasonModal from "./RejectReasonModal";

export default function Screening() {
  const navigation = useNavigation();
  const route = useRoute(); // Use useRoute to get the params
  const { adopterEmail, petRequestId, petName } = route.params; // Get parameters from route params
  const [adopter, setAdopter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchAdopterDetails = async () => {
      try {
        const adopterQuery = query(
          collection(db, "users"),
          where("email", "==", adopterEmail)
        );
        const querySnapshot = await getDocs(adopterQuery);
        if (!querySnapshot.empty) {
          const adopterData = querySnapshot.docs[0].data();
          console.log("Fetched adopter data: ", adopterData); // Log adopter data
          setAdopter(adopterData);
        } else {
          console.log("Adopter not found!");
        }
      } catch (error) {
        console.error("Error fetching adopter details: ", error); // Ensure errors are logged
      } finally {
        setLoading(false);
      }
    };

    fetchAdopterDetails();
  }, [adopterEmail]);

  // Function to update the pet request status and store the respective date field
  const updatePetRequestStatus = async (status, reason = null) => {
    try {
      const petRequestRef = doc(db, "pet_request", petRequestId);
      const actionDate = new Date();

      const updateData = {
        status,
        adopterNotificationRead: false,
        listerNotificationRead: true, // Reset lister notificationRead to false
      };

      if (status === "Accepted") {
        updateData.acceptDate = actionDate;
      } else if (status === "Rejected") {
        updateData.rejectDate = actionDate;
        updateData.rejectReason = reason;
      }

      console.log("Updating pet request with:", updateData);
      await updateDoc(petRequestRef, updateData); // Firestore update
      console.log("Pet request updated successfully!");
    } catch (error) {
      console.error("Error updating pet request:", error);
    }
  };


  const handleAcceptAdoption = async () => {
    await updatePetRequestStatus("Accepted"); // Update the status to 'accepted'
    navigation.navigate("AcceptAdoption", {
      adopterEmail,
      petRequestId,
      petName, // Pass petName to RejectAdoption
    });
  };

  const handleRejectAdoption = () => {
    setIsModalVisible(true); // Show the modal instead of navigating immediately
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handleProceedWithRejection = async (reason) => {
    setIsModalVisible(false);
    await updatePetRequestStatus("Rejected");

    // Assuming you have a 'pet_request' Firestore collection
    const petRequestRef = doc(db, "pet_request", petRequestId);

    // Update the pet request document with the rejection reason and rejection date
    await setDoc(petRequestRef, {
      rejectReason: reason, // Add the rejection reason
      rejectDate: new Date(), // Store the date of rejection
    }, { merge: true }); // Use merge to avoid overwriting other fields

    // Navigate to RejectAdoption screen with the rejection reason
    navigation.navigate("RejectAdoption", {
      adopterEmail,
      petRequestId,
      petName, // Pass petName to RejectAdoption
      rejectionReason: reason,
    });
  };

  useEffect(() => {
    if (adopter) {
      console.log(adopter.coverPhoto ? "Custom Cover" : "Default Cover");
      console.log("Cover Photo URL:", adopter.coverPhoto);
    }
  }, [adopter]); // Log when the adopter is fetched or changes

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator
          size="large"
          color="#68C2FF"
          style={styles.loadingIndicator}
        />
      </SafeAreaView>
    );
  }

  if (!adopter) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text>Adopter details not found.</Text>
      </SafeAreaView>
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
          <View style={styles.buttonImageContainer}>
            <View style={styles.backButtonContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()} // Go back to previous screen
              >
                <Icon name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.header}>
              <Image
                style={styles.coverImage}
                source={
                  adopter.coverPhoto
                    ? { uri: adopter.coverPhoto }
                    : require("../assets/Profile/defaultcover.jpg")
                }
              />

              <Image
                source={
                  adopter.profilePicture
                    ? { uri: adopter.profilePicture }
                    : require("../assets/Profile/dp.png")
                }
                style={styles.adopterImage}
              />

              <Text style={styles.adopterName}>{adopter.name}</Text>
              <Text style={styles.profileStatus}>
                {adopter.bio || "No bio set"}
              </Text>
            </View>

            <View style={styles.detailsContainer}>
              <Icon
                name="email"
                size={24}
                color="#444444"
                style={styles.icon}
              />
              <Text style={styles.detailsText}>{adopter.email}</Text>
            </View>

            {/* Horizontal Line */}
            <View style={styles.horizontalLine}></View>

            <View style={styles.detailsContainer}>
              <Icon
                name="phone"
                size={24}
                color="#444444"
                style={styles.icon}
              />
              <Text style={styles.detailsText}>
                {adopter.contactNumber || "Not provided"}
              </Text>
            </View>

            {/* Horizontal Line */}
            <View style={styles.horizontalLine}></View>

            <View style={styles.detailsContainer}>
              <Icon
                name="location-on"
                size={24}
                color="#444444"
                style={styles.icon}
              />
              <Text style={styles.detailsText}>
                {adopter.address || "Not provided"}
              </Text>
            </View>

            {/* Horizontal Line */}
            <View style={styles.horizontalLine}></View>

            <View style={styles.detailsContainer}>
              <Icon name="home" size={24} color="#444444" style={styles.icon} />
              <Text style={styles.detailsText}>
                {adopter.houseType || "Not Indicated"}
              </Text>
            </View>

            {/* Horizontal Line */}
            <View style={styles.horizontalLine}></View>

            <View style={styles.detailsContainer}>
              <Icon name="pets" size={24} color="#444444" style={styles.icon} />
              <Text style={styles.detailsText}>
                {adopter.hasPet || "Not Indicated"}
              </Text>
            </View>

            {/* Horizontal Line */}
            <View style={styles.horizontalLine}></View>

            <View style={styles.buttonContainer}>
              {/* Accept Button */}
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptAdoption}
              >
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>

              {/* Reject Button */}
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={handleRejectAdoption}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
              <RejectReasonModal
                visible={isModalVisible}
                onClose={handleModalClose}
                onProceed={handleProceedWithRejection}
              />
            </View>
          </View>
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
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    paddingBottom: 0,
  },
  container: {
    width: "100%",
    flexDirection: "column",
  },
  buttonImageContainer: {
    flex: 1,
    padding: 0, // Remove extra padding for better layout control
  },
  backButtonContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    backgroundColor: "gray",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: 200, // Adjust the height to suit your layout
    resizeMode: "cover",
    backgroundColor: "#ccc", // Default background
  },
  adopterImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    borderColor: "#fff",
    position: "absolute",
    top: 125, // Adjust overlap with the cover image
    alignSelf: "center",
    backgroundColor: "#eee",
  },
  adopterName: {
    fontFamily: "Lilita",
    fontSize: 24,
    textAlign: "center",
    marginTop: 80, // Space below the adopter image
  },
  profileStatus: {
    fontFamily: "Lilita",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
    color: "#68C2FF",
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  detailsText: {
    fontFamily: "Lato",
    fontSize: 16,
    marginLeft: 10,
  },
  horizontalLine: {
    width: "90%",
    height: 1,
    backgroundColor: "#ddd",
    alignSelf: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  acceptButton: {
    flex: 1,
    height: 40,
    borderRadius: 30,
    backgroundColor: "#68C2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rejectButton: {
    flex: 1,
    height: 40,
    borderRadius: 30,
    backgroundColor: "#EF5B5B",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  acceptText: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "white",
  },
  rejectText: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "white",
  },
});