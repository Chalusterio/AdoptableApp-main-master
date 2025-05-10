import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Foundation } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SideBar from "../components/SideBar";
import { Surface } from "react-native-paper";
import { usePets } from "../context/PetContext"; // Adjust the path as needed
import { db, auth } from "./config/firebase"; // Ensure `auth` and `db` are imported from Firebase
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore"; // Import Firestore functions

const Requests = () => {
  const { favoritedPets, cancelRequest, pets, toggleFavorite } = usePets();
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState("Requests");
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [requestedPets, setRequestedPets] = useState([]); // State to hold filtered requested pets
  const [longPressedPetId, setLongPressedPetId] = useState(null);
  const [adoptedPets, setAdoptedPets] = useState([]);

  // Fetch the current user's pending requests
  useEffect(() => {
    const fetchUserRequests = async () => {
      setIsLoading(true);
      const user = auth.currentUser;

      if (user) {
        try {
          const requestsRef = collection(db, "pet_request");
          const q = query(
            requestsRef,
            where("adopterEmail", "==", user.email),
            where("status", "==", "Pending") // Only fetch "Pending" requests
          );

          const querySnapshot = await getDocs(q);
          const requestedPetNames = querySnapshot.docs.map(
            (doc) => doc.data().petName
          );

          // Filter the `pets` array to show only those that match the requested pet names
          const pendingPets = pets.filter((pet) =>
            requestedPetNames.includes(pet.petName)
          );

          setRequestedPets(pendingPets); // Update the state with the filtered pets
        } catch (error) {
          console.error("Error fetching user requests:", error);
        }
      }
      setIsLoading(false);
    };

    const fetchAdoptedPets = async () => {
      const adoptedList = [];
      for (const pet of favoritedPets) {
        const petRef = doc(db, "listed_pets", pet.id);
        const petDoc = await getDoc(petRef);
        if (petDoc.exists() && petDoc.data().status === "finalized") {
          adoptedList.push(pet.id);
        }
      }
      setAdoptedPets(adoptedList);
    };

    fetchUserRequests();
    fetchAdoptedPets();
  }, [pets]); // Re-run only when `pets` changes

  const handleLongPress = (petName) => {
    setLongPressedPetId(petName);
  };

  const handleCancelRequest = () => {
    if (longPressedPetId) {
      cancelRequest(longPressedPetId); // Perform the cancel operation

      // Optimistically update the requestedPets state
      setRequestedPets((prevRequestedPets) =>
        prevRequestedPets.filter((pet) => pet.petName !== longPressedPetId)
      );

      setLongPressedPetId(null); // Reset the long-press state
    }
  };

  // Render pet item
  const renderItem = ({ item }) => {
    const isFavorited = favoritedPets.some((favPet) => favPet.id === item.id);
    const isLongPressed = longPressedPetId === item.petName; // Check petName for long-press
    const isAdopted = adoptedPets.includes(item.id);
    const petAge = parseInt(item.petAge, 10); // Ensure petAge is treated as a number

    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={[styles.card, { opacity: isLongPressed ? 0.5 : 1 }]}
          activeOpacity={0.7}
          onPress={() => {
            router.push({
              pathname: "/PetDetails",
              params: {
                ...item,
                images: JSON.stringify(item.images),
              },
            });
          }}
          onLongPress={() => handleLongPress(item.petName)} // Pass petName
        >
          <View style={styles.imageContainer}>
            <TouchableOpacity
              style={styles.favoriteIconButton}
              onPress={() => toggleFavorite(item.id, item)}
            >
              <FontAwesome
                name={isFavorited ? "heart" : "heart-o"}
                size={20}
                color={isFavorited ? "#FF6B6B" : "#FFFFFF"}
              />
            </TouchableOpacity>
            <Image source={{ uri: item.images[0] }} style={styles.image} />
            {isAdopted && <Text style={styles.adoptedBadge}>Adopted</Text>}
          </View>

          <View style={styles.petDetailsContainer}>
            <View style={styles.nameGenderContainer}>
              <Text style={styles.name}>{item.petName}</Text>
              <View style={styles.genderContainer}>
                {item.petGender === "Female" ? (
                  <Foundation name="female-symbol" size={24} color="#EF5B5B" />
                ) : (
                  <Foundation name="male-symbol" size={24} color="#68C2FF" />
                )}
              </View>
            </View>
            <Text style={styles.age}>
              {petAge} {petAge === 1 ? "year old" : "years old"}
            </Text>
          </View>
        </TouchableOpacity>
        {isLongPressed && (
          <View style={styles.cancelRequestContainer}>
            <TouchableOpacity onPress={handleCancelRequest}>
              <Text style={styles.cancelRequestText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Return JSX
  return (
    <SideBar selectedItem={selectedItem} setSelectedItem={setSelectedItem}>
      <SafeAreaView style={styles.safeArea}>
        <Surface style={styles.titleContainer} elevation={3}>
          <Text style={styles.title}>Your Requested Pets</Text>
          <Text style={styles.instruction}>
            Press and hold the pet card to cancel your request.
          </Text>
        </Surface>

        {isLoading ? ( // Display loading spinner while fetching data
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#68C2FF" />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : requestedPets.length > 0 ? (
          <FlatList
            data={requestedPets} // Display only requested pets that are pending
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            onLongPress={() => handleLongPress(item.id)}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.container}
          />
        ) : (
          <View style={styles.noPetsContainer}>
            <Text style={styles.noPetsText}>
              No pending pet requests available.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </SideBar>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  titleContainer: {
    width: "100%",
    height: 95,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderBottomEndRadius: 30,
    borderBottomLeftRadius: 30,
  },
  title: {
    fontFamily: "Lilita",
    fontSize: 24,
    color: "#68C2FF",
    marginBottom: 5,
  },
  instruction: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "#444444",
  },
  container: {
    padding: 16,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardContainer: {
    position: "relative", // Allows positioning of the Cancel Request button
    width: "47%",
    marginBottom: 16,
  },
  card: {
    width: "100%",
    marginBottom: 16,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 230,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  favoriteIconButton: {
    width: 30,
    height: 30,
    backgroundColor: "rgba(128, 128, 128, 0.7)",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    position: "absolute",
    marginLeft: 140,
    marginTop: 10,
  },
  image: {
    width: "100%",
    height: 160,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cancelRequestContainer: {
    position: "absolute", // Ensures it overlays the card
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2, // Ensures it's above the semi-transparent card
    backgroundColor: "rgba(255, 255, 255, 0.3)", // Optional semi-transparent overlay
  },
  cancelRequestText: {
    textAlign: "center",
    color: "white",
    fontFamily: "LatoBold",
    fontSize: 20,
    backgroundColor: "#EF5B5B",
    padding: 10,
    borderRadius: 5,
    elevation: 5, // Adds a slight shadow for better visibility
  },
  petDetailsContainer: {
    flex: 1,
    alignItems: "center",
    marginVertical: 15,
  },
  nameGenderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontFamily: "LatoBold",
    color: "black",
    marginRight: 8,
  },
  age: {
    fontSize: 16,
    fontFamily: "Lato",
    color: "#C2C2C2",
  },
  noPetsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPetsText: {
    textAlign: "center",
    fontFamily: "Lato",
    fontSize: 16,
    color: "#999",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Lato",
    color: "#68C2FF",
  },
  adoptedBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#68C2FF",
    color: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontFamily: "LatoBold",
    overflow: "hidden",
  },
});

export default Requests;
