import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Switch,
  SafeAreaView,
  Image,
  ImageBackground,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import { Surface, TextInput } from "react-native-paper";
import SideBar from "../components/SideBar";
import { useNavigation } from "@react-navigation/native";
import { db, auth } from "./config/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { Calendar } from "react-native-calendars";

const CommunityPost = () => {
  const navigation = useNavigation();
  const [selectedItem, setSelectedItem] = useState("CommunityPost");
  const [postContent, setPostContent] = useState({
    title: "",
    who: "",
    what: "",
    when: "",
    where: "",
    urgent: false,
  });
  const [posts, setPosts] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false); // state for calendar visibility

  useEffect(() => {
    const fetchUserRoleAndPosts = async () => {
      if (auth.currentUser) {
        try {
          const userRef = doc(db, "users", auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            Alert.alert("Error", "User role not found.");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          Alert.alert("Error", "Could not fetch user role.");
        }
      }

      // Real-time listener for Community_post collection
      const postsRef = collection(db, "Community_post");
      const unsubscribe = onSnapshot(postsRef, (querySnapshot) => {
        const fetchedPosts = [];
        querySnapshot.forEach((doc) => {
          fetchedPosts.push({ id: doc.id, ...doc.data() });
        });
        setPosts(fetchedPosts);
      });

      return unsubscribe; // Return the unsubscribe function
    };

    // Call fetchUserRoleAndPosts and capture unsubscribe
    const unsubscribe = fetchUserRoleAndPosts();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe(); // Clean up the onSnapshot listener on unmount
      }
    };
  }, []);

  const handlePostSubmit = async () => {
    if (postContent.title.trim() === "" || postContent.what.trim() === "") {
      Alert.alert("Error", "Please fill out the title and description.");
      return;
    }

    try {
      const user = auth.currentUser; // Get the current authenticated user
      const userRef = doc(db, "users", user.uid); // Reference to the Firestore document
      const userDoc = await getDoc(userRef);

      let userName = user.displayName || "Anonymous"; // Default to "Anonymous"
      if (userDoc.exists()) {
        userName = userDoc.data().name || userName; // Prefer Firestore name if available
      }

      const userEmail = user.email; // Save email regardless
      const profilePic = userDoc.exists()
        ? userDoc.data().profilePic || ""
        : "";

      const postWithUserInfo = {
        ...postContent,
        postedBy: userName, // Save the user's name
        email: userEmail, // Save the email
        profilePic, // Save the profile picture URL
        timestamp: new Date().toISOString(), // Optionally, include a timestamp
      };

      const docRef = await addDoc(
        collection(db, "Community_post"),
        postWithUserInfo
      );
      console.log("Post written with ID: ", docRef.id);

      setPosts([postWithUserInfo, ...posts]);
      setPostContent({
        title: "",
        who: "",
        what: "",
        when: "",
        where: "",
        urgent: false,
      });
      setModalVisible(false); // Close modal after submission
      Alert.alert("Success", "Your post has been submitted!");
    } catch (e) {
      console.error("Error adding document: ", e);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const sortedPosts = posts.sort((a, b) => {
    if (a.urgent !== b.urgent) return b.urgent - a.urgent;
    if (a.when && b.when) return new Date(a.when) - new Date(b.when);
    return 0;
  });

  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };

  const openPostDetails = (post) => {
    navigation.navigate("PostDetails", { post });
  };

  const handleDateSelect = (date) => {
    setPostContent({
      ...postContent,
      when: date.dateString,
    });
    setCalendarVisible(false); // Hide calendar after date selection
  };

  return (
    <ImageBackground
      source={require("../assets/post/board.png")}
      style={styles.backgroundImage}
    >
      <SideBar selectedItem={selectedItem} setSelectedItem={setSelectedItem}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {userRole === "organization" && (
              <Surface style={styles.titleContainer} elevation={3}>
                    <Text style={styles.title}>Keep the community updated!</Text>
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={() => navigateTo("PostEdit")}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              </Surface>
            )}

            {userRole !== "organization" && (
              <Surface style={styles.titleContainer} elevation={3}>
                <Text style={styles.title}>Community Events</Text>
                <Text style={styles.instruction}>
                  Stay tuned for exciting updates!
                </Text>
              </Surface>
            )}

            {userRole === "organization" && (
              <View style={styles.communityPostContainer1}>
                <TouchableOpacity
                  style={styles.rectangularButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.buttonText}>Post</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView style={styles.postsContainer}>
              <View style={styles.communityPostContainer}>
                {sortedPosts.map((post, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openPostDetails(post)}
                  >
                    <View style={styles.post}>
                      <View style={styles.postImageContainer}>
                        {post.profilePic ? (
                          <Image
                            source={{ uri: post.profilePic }}
                            style={styles.profileImage}
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name="account-circle"
                            size={40}
                            color="#ccc"
                          />
                        )}
                      </View>

                      <View style={styles.postDetails}>
                        <Text style={styles.postTitle}>{post.title}</Text>

                        <View style={styles.iconTextRowContainer}>
                          <MaterialCommunityIcons
                            name="calendar"
                            size={16}
                            color="#777"
                          />
                          <Text style={styles.postSubtitle}>
                            {post.when ? `${post.when}` : "No date specified"}
                          </Text>
                        </View>

                        {post.urgent && (
                          <View style={styles.iconTextRowContainer}>
                            <MaterialCommunityIcons
                              name="clock-fast"
                              size={16}
                              color="red"
                            />
                            <Text style={styles.urgentText}>Urgent</Text>
                          </View>
                        )}
                        <Text style={styles.postUsernameBy}>
                          {"Posted by: "}{" "}
                          <Text style={styles.postUsername}>
                            {" "}
                            {post.postedBy}
                          </Text>
                        </Text>
                      </View>
                      {/* Pin Icon */}
                      {post.urgent && (
                        <View style={styles.pinContainer}>
                          <Entypo name="pin" size={30} color="red" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Modal for creating a new post */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Create a Post</Text>

                  <ScrollView style={styles.scrollView}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Title:</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter title"
                        value={postContent.title}
                        onChangeText={(text) =>
                          setPostContent({ ...postContent, title: text })
                        }
                        mode="outlined"
                        outlineColor="transparent"
                        activeOutlineColor="#68C2FF"
                        autoCapitalize="sentences"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Who:</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Who can join or avail?"
                        value={postContent.who}
                        onChangeText={(text) =>
                          setPostContent({ ...postContent, who: text })
                        }
                        mode="outlined"
                        outlineColor="transparent"
                        activeOutlineColor="#68C2FF"
                        autoCapitalize="sentences"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>What:</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Describe what the post is about"
                        value={postContent.what}
                        onChangeText={(text) =>
                          setPostContent({ ...postContent, what: text })
                        }
                        mode="outlined"
                        outlineColor="transparent"
                        activeOutlineColor="#68C2FF"
                        autoCapitalize="sentences"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label1}>When:</Text>
                      <TouchableOpacity
                        onPress={() => setCalendarVisible(true)}
                        style={styles.dateButton}
                      >
                        <Text style={styles.dateText}>
                          {postContent.when ? postContent.when : "Select Date"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {calendarVisible && (
                      <View style={styles.calendarContainer}>
                        <Calendar
                          onDayPress={handleDateSelect}
                          markedDates={{
                            [postContent.when]: {
                              selected: true,
                              selectedColor: "#68C2FF",
                            },
                          }}
                        />
                      </View>
                    )}

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Where:</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Where is it happening?"
                        value={postContent.where}
                        onChangeText={(text) =>
                          setPostContent({ ...postContent, where: text })
                        }
                        mode="outlined"
                        outlineColor="transparent"
                        activeOutlineColor="#68C2FF"
                        autoCapitalize="sentences"
                      />
                    </View>

                    <View style={styles.inputContainer1}>
                      <Text style={styles.label}>Urgent:</Text>
                      <Switch
                        value={postContent.urgent}
                        onValueChange={(value) =>
                          setPostContent({ ...postContent, urgent: value })
                        }
                        style={styles.urgentSwitch}
                      />
                    </View>

                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.postButton}
                        onPress={handlePostSubmit}
                      >
                        <Text style={styles.buttonText}>Post</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>
        </SafeAreaView>
      </SideBar>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  profileButton: {
    position: "absolute",
    top: 30,
    right: 20,
    backgroundColor: "#444444",
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
    backgroundColor: "#68C2FF",
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
  instruction: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "#444444",
  },
  communityPostContainer1: {
    paddingHorizontal: 20,
  },
  rectangularButton: {
    backgroundColor: "#336AEA",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  postsContainer: {
    marginTop: 0,
  },
  communityPostContainer: {
    flex: 1,
    padding: 20,
  },
  post: {
    flexDirection: "row",
    marginVertical: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    elevation: 5,
  },
  postImageContainer: {
    marginRight: 20,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postDetails: {
    flex: 1,
  },
  postTitle: {
    fontSize: 18,
    fontFamily: "LatoBold",
    marginBottom: 5,
  },
  iconTextRowContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 5,
  },
  postSubtitle: {
    fontSize: 14,
    color: "#777",
    fontFamily: "Lato",
    textAlign: "center",
    alignSelf: "center",
  },
  urgentText: {
    fontSize: 14,
    color: "red",
    fontFamily: "Lato",
    textAlign: "center",
    alignSelf: "center",
  },
  postUsernameBy: {
    fontSize: 16,
    color: "black",
    fontFamily: "LatoBold",
    marginBottom: 5,
  },
  postUsername: {
    fontSize: 16,
    color: "#777",
    fontFamily: "Lato",
    marginBottom: 5,
  },
  calendarContainer: {
    width: "95%",
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    alignSelf: "center",
  },
  toggleCalendarButton: {
    backgroundColor: "#68C2FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    fontSize: 20,
    color: "#333",
    textAlign: "center",
    marginVertical: 20,
    color: "#68C2FF",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%", // Adjust width
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "LatoBold",
    textAlign: "center",
    marginBottom: 20,
  },
  scrollView: {
    maxHeight: 700, // Adjust the max height of scrollable content
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontFamily: "Lato",
    fontSize: 18,
  },
  label1: {
    fontFamily: "Lato",
    fontSize: 18,
    marginBottom: 5,
  },
  inputContainer1: {
    marginTop: -20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  urgentSwitch: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  textInput: {
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: "#F5F5F5",
  },
  dateText: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "#525252",
  },
  dateButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "gray",
    paddingVertical: 15, // Increase vertical padding
    paddingHorizontal: 30, // Increase horizontal padding
    borderRadius: 5,
    minWidth: 130, // Ensure the button has a minimum width for a larger size
    alignItems: "center", // Center text horizontally
    justifyContent: "center", // Center text vertically
  },

  postButton: {
    backgroundColor: "#68C2FF",
    paddingVertical: 15, // Increase vertical padding
    paddingHorizontal: 30, // Increase horizontal padding
    borderRadius: 5,
    minWidth: 130, // Ensure the button has a minimum width for a larger size
    alignItems: "center", // Center text horizontally
    justifyContent: "center", // Center text vertically
  },
  pinContainer: {
    alignItems: "center",
    right: -20,
    top: -20,
  },
});

export default CommunityPost;