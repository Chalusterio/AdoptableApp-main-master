import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "./config/firebase"; // Adjust the path to your firebase config

const ViewOtherUsers = () => {
  const router = useRouter();
  const { userName } = useLocalSearchParams(); // Access route params
  const [userData, setUserData] = useState(null);
  const [lifestyleData, setLifestyleData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (userName) {
        try {
          // Fetch user details
          const usersCollectionRef = collection(db, "users");
          const q = query(usersCollectionRef, where("name", "==", userName));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const user = querySnapshot.docs[0].data();
            setUserData(user);

            // Fetch lifestyle details
            const lifestyleCollectionRef = collection(db, "lifestyle");
            const lifestyleQuery = query(
              lifestyleCollectionRef,
              where("email", "==", user.email)
            );
            const lifestyleSnapshot = await getDocs(lifestyleQuery);

            if (!lifestyleSnapshot.empty) {
              const lifestyle = lifestyleSnapshot.docs[0].data();
              setLifestyleData(lifestyle);
            }
          } else {
            console.log("No user found with this username!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [userName]);

  if (!userData) {
    return <Text style={styles.loading}>Loading...</Text>; // Display while fetching
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          {/* Back Button */}
          <View style={styles.backButtonContainer}>
            <TouchableOpacity onPress={() => router.back()}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Profile Image and Name */}
          <View style={styles.header}>
            
            <Image
              style={styles.coverImage}
              source={
                userData.coverPhoto
                  ? { uri: userData.coverPhoto }
                  : require("../assets/Profile/defaultcover.jpg")
              }
            />
            <View style={styles.imageContainer}>
            <Image
              style={styles.profileImage}
              source={
                userData.profilePicture
                  ? { uri: userData.profilePicture } // Firebase Storage URL
                  : require("../assets/Profile/dp.png") // Default image
              }
            />
            </View>

            <Text style={styles.profileName}>{userData.name}</Text>
            <Text style={styles.profileStatus}>
              {userData.bio || "No bio set"}
            </Text>
          </View>

          {/* Profile Details */}
          <View style={styles.detailsContainer}>
            <Icon name="email" size={24} color="#444444" />
            <Text style={styles.detailsText}>
              {userData.email || "Not Provided"}
            </Text>
          </View>
          <View style={styles.horizontalLine}></View>

          <View style={styles.detailsContainer}>
            <Icon name="phone" size={24} color="#444444" />
            <Text style={styles.detailsText}>
              {userData.contactNumber || "Not Provided"}
            </Text>
          </View>
          <View style={styles.horizontalLine}></View>

          <View style={styles.detailsContainer}>
            <Icon name="location-on" size={24} color="#444444" />
            <Text style={styles.detailsText}>
              {userData.address || "No Address Provided"}
            </Text>
          </View>
          <View style={styles.horizontalLine}></View>

          <View style={styles.detailsContainer}>
            <Icon name="home" size={24} color="#444444" />
            <Text style={styles.detailsText}>
              House Type: {lifestyleData?.livingSpace}
            </Text>
          </View>
          <View style={styles.horizontalLine}></View>

          <View style={styles.detailsContainer}>
            <Icon name="pets" size={24} color="#444444" />
            <Text style={styles.detailsText}>
              Pet Owner: {lifestyleData?.ownedPets ? "Has a pet" : "No pet"}
            </Text>
          </View>
          <View style={styles.horizontalLine}></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backButtonContainer: {
    backgroundColor: "gray",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 70,
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: "center",
  },
  coverImage: {
    width: "100%",
    height: 200, // Adjust the height to suit your layout
    resizeMode: "cover",
    backgroundColor: "#ccc", // Default background
  },
  imageContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderColor: "#68C2FF",
    borderWidth: 5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginTop: -120,
  },
  profileImage: {
    width: 230,
    height: 230,
    borderRadius: 115,
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
  loading: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginTop: 50,
  },
  detailsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  detailsText: {
    fontFamily: "Lato",
    fontSize: 16,
    marginLeft: 20,
  },
  horizontalLine: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "gray",
    alignSelf: "center",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollViewContent: {
    paddingBottom: 0,
  },
});

export default ViewOtherUsers;
