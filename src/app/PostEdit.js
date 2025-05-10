import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Image, ScrollView, TextInput } from "react-native";
import { MaterialCommunityIcons } from "react-native-vector-icons";
import { useRouter } from "expo-router";
import { getDocs, collection, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "./config/firebase";
import { useFonts } from "expo-font";
import { getSession } from "./config/firebase";

const PostEdit = () => {
  const router = useRouter();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);  // New state to manage save confirmation

  const [fontsLoaded] = useFonts({
    LilitaOne: require("../assets/fonts/LilitaOne-Regular.ttf"),
  });

  useEffect(() => {
    const fetchUserSession = async () => {
      const session = await getSession();
      if (session) {
        setCurrentUser(session);
      }
    };
    fetchUserSession();
  }, []);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (currentUser) {
        setLoading(true);
        try {
          const userEmail = currentUser.email;
          const postsRef = collection(db, "Community_post");
          const q = query(postsRef, where("email", "==", userEmail));
          const querySnapshot = await getDocs(q);

          const fetchedPosts = [];
          querySnapshot.forEach((doc) => {
            fetchedPosts.push({ id: doc.id, ...doc.data() });
          });

          setUserPosts(fetchedPosts);
        } catch (error) {
          console.error("Error fetching posts:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    if (currentUser) {
      fetchUserPosts();
    }
  }, [currentUser]);

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading fonts...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#68C2FF" />
        <Text style={styles.title}>Loading your posts...</Text>
      </View>
    );
  }

  const openModal = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setSaveSuccess(false);
    setSelectedPost(null);
  };

  const handleDelete = async () => {
    if (selectedPost) {
      try {
        await deleteDoc(doc(db, "Community_post", selectedPost.id));

        setUserPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== selectedPost.id)
        );

        closeModal();
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setConfirmSave(true); // Show confirmation modal when saving
  };

  const confirmSaveChanges = async () => {
    if (selectedPost) {
      try {
        const postRef = doc(db, "Community_post", selectedPost.id);
        await updateDoc(postRef, {
          title: selectedPost.title,
          what: selectedPost.what,
          where: selectedPost.where,
          who: selectedPost.who,
          when: selectedPost.when,
          urgent: selectedPost.urgent,
        });

        setSaveSuccess(true); // Show confirmation message
        setIsEditing(false); // Disable editing after save
        setConfirmSave(false); // Close the confirmation popup
      } catch (error) {
        console.error("Error updating post:", error);
        setConfirmSave(false); // Close the confirmation popup if there was an error
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveSuccess(false);
    setSelectedPost({ ...selectedPost }); // Revert changes by resetting selectedPost to original state
    setConfirmSave(false); // Close the save confirmation
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.what}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.safeArea}>
      <MaterialCommunityIcons
        name="arrow-left-circle"
        size={30}
        color="#EF5B5B"
        style={styles.backButton}
        onPress={() => {
          if (isEditing) {
            handleCancel(); // Cancel the edit if editing is in progress
          } else {
            router.back(); // Go back if no editing is in progress
          }
        }}
      />
      <Text style={[styles.title, { fontFamily: "LilitaOne", textAlign: "center" }]}>
        Your Posts
      </Text>

      {userPosts.length === 0 ? (
        <Text style={styles.subtitle}>You have no posts yet.</Text>
      ) : (
        <FlatList
          data={userPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={1}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {selectedPost && (
        <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <ScrollView contentContainerStyle={styles.scrollView}>
                {selectedPost.image && (
                  <Image source={{ uri: selectedPost.image }} style={styles.modalImage} />
                )}

                <Text style={styles.modalTitle}>{selectedPost.title}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedPost.when ? `📅 ${selectedPost.when}` : "No date specified"}
                </Text>

                {selectedPost.urgent && <Text style={styles.modalUrgentText}>🔥 Urgent</Text>}
                {selectedPost.postedBy && (
                  <Text style={styles.modalText}>Posted by: {selectedPost.postedBy}</Text>
                )}

                {isEditing ? (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Title:</Text>
                      <TextInput
                        style={styles.input}
                        value={selectedPost.title}
                        onChangeText={(text) => setSelectedPost({ ...selectedPost, title: text })}
                        placeholder="Title"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>What:</Text>
                      <TextInput
                        style={styles.input}
                        value={selectedPost.what}
                        onChangeText={(text) => setSelectedPost({ ...selectedPost, what: text })}
                        placeholder="What"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Where:</Text>
                      <TextInput
                        style={styles.input}
                        value={selectedPost.where}
                        onChangeText={(text) => setSelectedPost({ ...selectedPost, where: text })}
                        placeholder="Where"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Who:</Text>
                      <TextInput
                        style={styles.input}
                        value={selectedPost.who}
                        onChangeText={(text) => setSelectedPost({ ...selectedPost, who: text })}
                        placeholder="Who"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>When:</Text>
                      <TextInput
                        style={styles.input}
                        value={selectedPost.when}
                        onChangeText={(text) => setSelectedPost({ ...selectedPost, when: text })}
                        placeholder="When"
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.infoContainer}>
                      <Text style={styles.infoTitle}>Who:</Text>
                      <Text style={styles.detailText}>{selectedPost.who}</Text>
                    </View>
                    <View style={styles.infoContainer}>
                      <Text style={styles.infoTitle}>What:</Text>
                      <Text style={styles.detailText}>{selectedPost.what}</Text>
                    </View>
                    <View style={styles.infoContainer}>
                      <Text style={styles.infoTitle}>Where:</Text>
                      <Text style={styles.detailText}>{selectedPost.where}</Text>
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={styles.actionsContainer}>
                {saveSuccess ? (
                  <Text style={styles.saveConfirmation}>Post saved successfully!</Text>
                ) : isEditing ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: "#68C2FF" }, styles.saveButton]} 
                      onPress={handleSave}
                    >
                      <Text style={styles.actionText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: "#EF5B5B" }, styles.cancelButton]} 
                      onPress={handleCancel}
                    >
                      <Text style={styles.actionText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: "#EF5B5B", marginRight: 10 }]}
                      onPress={handleDelete}
                    >
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                    {!isEditing && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: "#68C2FF" }]}
                        onPress={handleEdit}
                      >
                        <Text style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Save confirmation modal */}
      <Modal visible={confirmSave} transparent={true} animationType="fade">
        <View style={styles.confirmationModal}>
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationText}>Are you sure you want to save changes?</Text>
            <View style={styles.confirmationActions}>
              <TouchableOpacity style={styles.confirmationButton} onPress={confirmSaveChanges}>
                <Text style={styles.confirmationText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmationButton} onPress={() => setConfirmSave(false)}>
                <Text style={styles.confirmationText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  title: { 
    fontSize: 32, 
    fontFamily: "LilitaOne", 
    fontWeight: "bold", 
    color: "#333", 
    marginBottom: 10, 
    marginTop: 50 
  },
  subtitle: { 
    fontSize: 16, 
    color: "#666", 
    textAlign: "center", 
    marginTop: 10 
  },
  backButton: { 
    position: "absolute", 
    top: 40, 
    left: 10, 
    zIndex: 1 
  },
  listContainer: { 
    padding: 16, 
    marginTop: 50 
  },
  card: { 
    width: "100%", 
    marginBottom: 16, 
    borderRadius: 8, 
    backgroundColor: "#f9f9f9", 
    shadowOpacity: 0.1, 
    padding: 12
  },
  cardContent: { 
    paddingHorizontal: 10 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#333" 
  },
  cardDescription: { 
    fontSize: 14, 
    color: "#666", 
    marginTop: 4 
  },
  modalBackground: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#68C2FF" 
  },
  modalContainer: { 
    width: "80%", 
    padding: 20, 
    backgroundColor: "white", 
    borderRadius: 20, 
    marginHorizontal: 50, 
    alignItems: "center", 
    marginTop:50, 
    marginBottom: 50, 
  },
  scrollView: { 
    marginBottom: 20 
  },
  modalImage: { 
    width: "100%", 
    height: 200, 
    borderRadius: 10, 
    marginBottom: 15 
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 5, 
    textAlign: "center", // Added center alignment for the title
  },
  modalSubtitle: { 
    fontSize: 16, 
    color: "#EF5B5B", 
    marginBottom: 15, 
    textAlign: "center", // Center aligned the subtitle for consistency
  },
  modalUrgentText: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#EF5B5B", 
    marginBottom: 10, 
    textAlign: "center", // Center aligned the urgent text
  },
  modalText: { 
    fontSize: 16, 
    color: "#333", 
    marginBottom: 5, 
    textAlign: "center", // Center aligned the general text
  },
  inputContainer: { 
    marginBottom: 15, 
    marginRight: 20,  // Adjusted marginRight for proper alignment and space
  },
  inputLabel: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333", 
    marginBottom: 5, // Added marginBottom for space between label and input
  },
  input: {
    width: "100%",
    padding: 10,
    fontSize: 16,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: "#f9f9f9", // Add a background to make it stand out
  },
  infoContainer: { 
    flexDirection: "row", 
    marginBottom: 10 
  },
  infoTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333" 
  },
  detailText: { 
    fontSize: 16, 
    color: "#666", 
    marginLeft: 10, 
    marginRight: 45, 
    textAlign: "justify", 
    letterSpacing: 0.5, 
  },
  actionsContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 20, 
    paddingHorizontal: 10 
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  actionText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  saveButton: { 
    marginRight: 10 
  }, // Adjusted saveButton style for spacing
  cancelButton: { 
    marginLeft: 10 
  }, // Adjusted cancelButton style for spacing
  saveConfirmation: { 
    fontSize: 16, 
    color: "#68C2FF" 
  },  
  confirmationModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  confirmationContainer: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  confirmationText:{ 
    fontSize: 18, 
    fontWeight: "bold", 
    textAlign: "center" 
  },
  confirmationActions: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 20 
  },
  confirmationButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#68C2FF",
    borderRadius: 8,
    alignItems: "center",
    width: "45%",
  },
});

export default PostEdit;
