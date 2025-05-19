import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from "react-native";
import FastImage from "react-native-fast-image";
import { FontAwesome } from "@expo/vector-icons";
import { Foundation } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import FeedHeader from "../../components/FeedHeader";
import SideBar from "../../components/SideBar";
import { usePets } from "../../context/PetContext";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { groqConfig } from "../config/groqconfig";
import { adoptableInfo } from "../config/adoptableData";

const Feed = () => {
  const params = useLocalSearchParams();
  const { pets } = usePets();
  const router = useRouter();
  const { filteredPets, setFilteredPets } = usePets();
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState("Main");
  const [favoritedPets, setFavoritedPets] = useState({});
  const [userFavorites, setUserFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const flatListRef = useRef(null);
  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = { sender: "user", text: currentMessage };
    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsBotTyping(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqConfig.apiKey}`,
      };

      const requestBody = {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: adoptableInfo, // ← use your info here
          },
          {
            role: "user",
            content: currentMessage,
          },
        ],
      };

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Groq API error");
      }

      const botResponse = {
        sender: "bot",
        text:
          data?.choices?.[0]?.message?.content?.trim() || "Sorry, no response.",
      };

      setChatMessages((prev) => [...prev, botResponse]);
    } catch (err) {
      console.error("Groq error:", err);
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const selectedImages = params.selectedImages
    ? JSON.parse(params.selectedImages)
    : [];

  const isPetDataValid =
    params.petName &&
    params.petGender &&
    params.petAge &&
    params.petWeight &&
    params.petPersonality &&
    params.petDescription &&
    params.petIllnessHistory &&
    typeof params.petVaccinated !== "undefined" &&
    selectedImages.length > 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPreferencesAndRankPets(true);
    setRefreshing(false);
  };

  useEffect(() => {
    const fetchUserFavorites = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = collection(db, "users");
          const userQuery = query(userRef, where("email", "==", user.email));
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();
            setUserFavorites(userData.favorites || []);
            const userFavoritesIds =
              userData.favorites?.map((pet) => pet.id) || [];
            setFavoritedPets((prevState) => {
              const newState = { ...prevState };
              userFavoritesIds.forEach((id) => (newState[id] = true));
              return newState;
            });
          }
        } catch (error) {
          console.error("Error fetching user favorites:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserFavorites();
  }, []);

  const toggleFavorite = async (petId, petData) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userFavoritesRef = doc(db, "users", userId);
    setFavoritedPets((prevState) => {
      const newState = { ...prevState };
      if (newState[petId]) {
        delete newState[petId];
        setDoc(
          userFavoritesRef,
          { favorites: arrayRemove(petData) },
          { merge: true }
        );
      } else {
        newState[petId] = true;
        setDoc(
          userFavoritesRef,
          { favorites: arrayUnion(petData) },
          { merge: true }
        );
      }
      return newState;
    });
  };

  const fetchPreferencesAndRankPets = async (isRefresh = false) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const preferencesQuery = query(
        collection(db, "preferences"),
        where("userEmail", "==", user.email)
      );
      const preferencesSnapshot = await getDocs(preferencesQuery);

      let rankedPets = pets
        .filter((pet) => pet.status !== "finalized")
        .map((pet) => {
          let score = 0;

          if (preferencesSnapshot.empty) return { ...pet, score: 0 };
          const userPreferences = preferencesSnapshot.docs[0].data();

          if (
            pet.petPersonality &&
            pet.petPersonality.includes(userPreferences.personalityLabel)
          ) {
            score += 1;
          }

          const petWeight = parseInt(pet.petWeight, 10);
          let matchesSizeLabel = false;
          const sizeRangeMatch =
            userPreferences.petSizeLabel.match(/(\d+)-(\d+)/);
          if (sizeRangeMatch) {
            const minSize = parseInt(sizeRangeMatch[1], 10);
            const maxSize = parseInt(sizeRangeMatch[2], 10);
            matchesSizeLabel = petWeight >= minSize && petWeight <= maxSize;
            if (matchesSizeLabel) score += 1;
          }

          const matchesGender =
            userPreferences.selectedGender === "any" ||
            (pet.petGender &&
              pet.petGender.toLowerCase() ===
                userPreferences.selectedGender.toLowerCase());
          if (matchesGender) score += 1;

          const matchesPetType =
            userPreferences.selectedPet === "any" ||
            (pet.petType &&
              pet.petType.toLowerCase() ===
                userPreferences.selectedPet.toLowerCase());
          if (matchesPetType) score += 1;

          return { ...pet, score };
        });

      if (preferencesSnapshot.empty) {
        rankedPets = pets.map((pet) => ({ ...pet, score: 0 }));
      }

      rankedPets = rankedPets.sort((a, b) => b.score - a.score);
      const shuffledPets = isRefresh ? shuffleArray(rankedPets) : rankedPets;
      setFilteredPets(shuffledPets);
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const shuffleArray = (array) => {
    let shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  };

  useEffect(() => {
    fetchPreferencesAndRankPets();
  }, [pets]);

  const renderItem = ({ item }) => {
    const isFavorited = favoritedPets[item.id];
    const petAge = parseInt(item.petAge, 10);

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
            onPress={() => toggleFavorite(item.id, item)}
          >
            <FontAwesome
              name={isFavorited ? "heart" : "heart-o"}
              size={20}
              color={isFavorited ? "#FF6B6B" : "#FFFFFF"}
            />
          </TouchableOpacity>
          <Image source={{ uri: item.images[0] }} style={styles.image} />
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
      <FeedHeader setFilteredPets={setFilteredPets} />
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#68C2FF" />
            <Text style={styles.loadingText}>Loading pets...</Text>
          </View>
        ) : filteredPets.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No results found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPets.filter((pet) => pet.status !== "finalized")}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            initialNumToRender={10}
            windowSize={21}
            removeClippedSubviews={true}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.container}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </SafeAreaView>

      {isChatVisible && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
          style={styles.chatContainer}
        >
          <View style={{ flex: 1 }}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <Text style={styles.botTitle}>AdoptaBot</Text>
                <View style={styles.botStatusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.botStatus}>Online</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsChatVisible(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <FlatList
              ref={flatListRef}
              data={chatMessages}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ paddingBottom: 10 }}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageRow,
                    item.sender === "user"
                      ? { justifyContent: "flex-end" }
                      : { justifyContent: "flex-start" },
                  ]}
                >
                  {item.sender === "bot" && (
                    <View style={styles.botIconBubble}>
                      <Text style={styles.botIcon}>🐾</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      item.sender === "user"
                        ? styles.userBubble
                        : styles.botBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        item.sender === "user"
                          ? { color: "#fff" }
                          : { color: "#333" },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              )}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              onLayout={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />

            {/* Typing */}
            {isBotTyping && (
              <View style={[styles.messageBubble, styles.botBubble]}>
                <View style={styles.typingContainer}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </View>
            )}

            {/* Input Field */}
            <View style={styles.fixedInputBar}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Type a message..."
                  value={currentMessage}
                  onChangeText={setCurrentMessage}
                  onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={sendMessage}
                >
                  <Text style={{ color: "#fff" }}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <TouchableOpacity
        style={styles.chatbotButton}
        onPress={() => {
          setIsChatVisible((prev) => {
            const next = !prev;
            if (next && !hasGreeted) {
              setChatMessages((msgs) => [
                ...msgs,
                { sender: "bot", text: "How may I help you?" },
              ]);
              setHasGreeted(true);
            }
            return next;
          });
        }}
      >
        <FontAwesome name="commenting" size={24} color="#fff" />
      </TouchableOpacity>
    </SideBar>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 999,
    backgroundColor: "#FAFAFA",
  },
  container: {
    padding: 16,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    width: "47%",
    marginBottom: 20,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 230,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  favoriteIconButton: {
    width: 30,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    position: "absolute",
    right: 10,
    top: 10,
  },
  image: {
    width: "100%",
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  petDetailsContainer: {
    flex: 1,
    marginTop: 10,
    alignItems: "center",
  },
  nameGenderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: "LatoBold",
    color: "#333",
    marginRight: 8,
  },
  genderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  age: {
    fontSize: 14,
    fontFamily: "Lato",
    color: "#888",
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
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  noResultsText: {
    fontSize: 18,
    color: "#555",
    fontFamily: "Lato",
  },
  chatbotButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#4da6ff",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 8,
    zIndex: 999,
  },
  chatContainer: {
    position: "absolute",
    bottom: 100,
    right: 16,
    width: "90%",
    height: "70%",
    backgroundColor: "#F9FBFF",
    borderRadius: 20,
    paddingTop: 60,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 12,
    zIndex: 998,
    overflow: "hidden",
  },

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#377DFF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -60,
    marginHorizontal: -16,
  },

  botTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  botStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CE69E",
    marginRight: 6,
  },

  botStatus: {
    fontSize: 12,
    color: "#E4F6F0",
  },

  closeIcon: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },

  messageBubble: {
    padding: 14,
    borderRadius: 18,
    marginVertical: 6,
    marginHorizontal: 8,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  userBubble: {
    backgroundColor: "#377DFF",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },

  botBubble: {
    backgroundColor: "#E6F0FF",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },

  messageText: {
    fontSize: 15,
    fontFamily: "Lato",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  input: {
    flex: 1,
    height: 42,
    fontSize: 14,
    fontFamily: "Lato",
    paddingHorizontal: 12,
  },

  sendButton: {
    backgroundColor: "#377DFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    height: 24,
    paddingLeft: 16,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#AAA",
    marginHorizontal: 3,
  },

  fixedInputBar: {
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
    paddingTop: 6,
    backgroundColor: "#F9FBFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#4da6ff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -60,
    marginHorizontal: -16,
  },

  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  botTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  botStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3BEA81",
    marginRight: 6,
  },

  botStatus: {
    fontSize: 12,
    color: "#ccc",
  },

  closeIcon: {
    fontSize: 18,
    color: "#fff",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
    paddingHorizontal: 8,
  },

  botIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  botIcon: {
    fontSize: 18,
  },
});

export default Feed;
