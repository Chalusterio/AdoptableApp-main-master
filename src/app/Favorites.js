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
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions

const Favorites = () => {
  const { favoritedPets, setFilteredPets, pets, toggleFavorite } = usePets(); // Use favoritedPets from context
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState("Favorites");
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [adoptedPets, setAdoptedPets] = useState([]);

  // Fetch the current user's favorites
  useEffect(() => {
    const fetchUserFavorites = async () => {
      setIsLoading(true); // Start loading
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userFavorites = userData.favorites || [];

            // Filter the pets based on the user’s favorites
            const favoritePets = pets.filter((pet) =>
              userFavorites.includes(pet.id)
            );

            // Set the filtered pets as favorited pets for the current user
            setFilteredPets(favoritePets);
          }
        } catch (error) {
          console.error("Error fetching user favorites:", error);
        }
      }
      setIsLoading(false); // Stop loading
    };

    const fetchAdoptedPets = async () => {
      const adoptedList = [];

      // Check each favorited pet's status
      for (const pet of favoritedPets) {
        const petRef = doc(db, "listed_pets", pet.id);
        const petDoc = await getDoc(petRef);

        if (petDoc.exists() && petDoc.data().status === "finalized") {
          adoptedList.push(pet.id);
        }
      }
      setAdoptedPets(adoptedList);
    };

    if (favoritedPets.length > 0) {
      fetchAdoptedPets();
    }

    fetchUserFavorites();
  }, [pets, setFilteredPets]);

  // Render pet item
  const renderItem = ({ item }) => {
    const isFavorited = favoritedPets.some((favPet) => favPet.id === item.id);
    const isAdopted = adoptedPets.includes(item.id);
    const petAge = parseInt(item.petAge, 10); // Ensure petAge is treated as a number

    return (
      <TouchableOpacity
        style={styles.card}
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
      >
        <View style={styles.imageContainer}>
          <TouchableOpacity
            style={styles.favoriteIconButton}
            onPress={() => toggleFavorite(item.id, item)} // Pass pet data to toggleFavorite
          >
            <FontAwesome
              name={isFavorited ? "heart" : "heart-o"}
              size={20}
              color={isFavorited ? "#FF6B6B" : "#FFFFFF"} // Red for heart, white for heart-o
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
    );
  };

  return (
    <SideBar selectedItem={selectedItem} setSelectedItem={setSelectedItem}>
      <SafeAreaView style={styles.safeArea}>
        <Surface style={styles.titleContainer} elevation={3}>
          <Text style={styles.title}>Your Favorite Pets</Text>
        </Surface>

        {isLoading ? ( // Display loading text while fetching data
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#68C2FF" />
            <Text style={styles.loadingText}>Loading favorites...</Text>
          </View>
        ) : favoritedPets.length > 0 ? (
          <FlatList
            data={favoritedPets} // Display only favorited pets
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.container}
          />
        ) : (
          <View style={styles.noPetsContainer}>
            <Text style={styles.noPetsText}>No favorite pets available.</Text>
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
  },
  container: {
    padding: 16,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  card: {
    width: "47%",
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
  petDetailsContainer: {
    flex: 1,
    margin: 13,
    alignItems: "center",
  },
  nameGenderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
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

export default Favorites;
