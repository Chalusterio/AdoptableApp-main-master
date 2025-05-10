import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  Modal,
  BackHandler,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { auth, signOut, clearSession, getSession } from "../app/config/firebase"; // Ensure this imports your Firebase setup

const SideBar = ({ children, selectedItem, setSelectedItem }) => {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLogoutConfirmVisible, setLogoutConfirmVisible] = useState(false); // Modal visibility state for logout confirmation
  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = screenWidth * 0.8; // Adjust the width of the drawer (80% of screen width)
  const drawerTranslateX = useState(new Animated.Value(-drawerWidth))[0]; // Start off-screen

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selectedItem !== "Main") {
        setSelectedItem("Main");
        router.push("/Main");
        return true; // Prevent default behavior (going back to the previous page)
      }
      return false; // Allow default behavior
    });

    return () => backHandler.remove();
  }, [selectedItem]);

  const toggleDrawer = () => {
    Animated.timing(drawerTranslateX, {
      toValue: drawerOpen ? -drawerWidth : 0, // Slide drawer to the left or to 0 position
      duration: 300,
      useNativeDriver: true, // Use native driver for better performance
    }).start();
    setDrawerOpen(!drawerOpen);
  };

  const closeDrawer = () => {
    Animated.timing(drawerTranslateX, {
      toValue: -drawerWidth, // Move drawer off-screen to the left
      duration: 300,
      useNativeDriver: true,
    }).start();
    setDrawerOpen(false);
  };

  const navigateTo = (screen) => {
    setSelectedItem(screen); // Update the selected item state
    router.push(screen); // Use expo-router's push method to navigate
    closeDrawer(); // Close the drawer after navigation
  };

  const handleLogout = async () => {
    try {
      const session = await getSession(); // Check session before logout
      console.log("Session before logout:", session); // Debug log
      if (!session) {
        console.error("No session found, user is not logged in.");
        return;
      }

      // Clear session in Firebase
      await signOut(auth);
      console.log("Firebase session cleared");

      // Clear custom session
      await clearSession();
      console.log("Custom session cleared");

      // Ensure session is completely cleared
      const newSession = await getSession();
      console.log("Session after logout:", newSession); // Debug log

      if (newSession) {
        console.error("Session not cleared properly");
        return;
      }

       // Close the drawer
       closeDrawer();


      // Redirect after successful logout
      console.log("User logged out");
      router.push("/Login"); // Ensure the route is correct

    } catch (error) {
      console.error("Error logging out: ", error.message);
    } finally {
      setLogoutConfirmVisible(false); // Close logout confirmation modal
    }
  };

  const handleLogoutConfirm = () => {
    setLogoutConfirmVisible(true); // Show confirmation modal
  };

  const handleCancelLogout = () => {
    setLogoutConfirmVisible(false); // Hide confirmation modal
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Menu Icon */}
      {!drawerOpen && (
        <View style={styles.menuIcon}>
          <TouchableOpacity onPress={toggleDrawer}>
            <MaterialCommunityIcons name="menu" size={28} color="black" />
          </TouchableOpacity>
        </View>
      )}

      {/* Drawer as Modal */}
      <Modal visible={drawerOpen} transparent={true} animationType="none">
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[styles.drawer, { width: drawerWidth, transform: [{ translateX: drawerTranslateX }] }]}
        >
          <View style={styles.blockPadContainer}></View>
          <View style={styles.logoImageContainer}>
            <Image source={require("../assets/logo.png")} style={styles.logoImage} />
          </View>
          {/* Drawer items */}
          <TouchableOpacity
            onPress={() => router.replace("Main")}
            style={[styles.drawerItem, selectedItem === "Main" && styles.activeDrawerItem]}
          >
            <MaterialCommunityIcons
              name={selectedItem === "Main" ? "paw" : "paw-outline"}
              size={24}
              color={selectedItem === "Main" ? "black" : "gray"}
            />
            <Text
              style={[styles.drawerItemText, selectedItem === "Main" && styles.activeDrawerItemText]}
            >
              Feed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace("Favorites")}
            style={[styles.drawerItem, selectedItem === "Favorites" && styles.activeDrawerItem]}
          >
            <FontAwesome
              name={selectedItem === "Favorites" ? "heart" : "heart-o"}
              size={24}
              color={selectedItem === "Favorites" ? "black" : "gray"}
            />
            <Text
              style={[styles.drawerItemText, selectedItem === "Favorites" && styles.activeDrawerItemText]}
            >
              Favorites
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace("Uploads")}
            style={[styles.drawerItem, selectedItem === "Uploads" && styles.activeDrawerItem]}
          >
            <MaterialCommunityIcons
              name={selectedItem === "Uploads" ? "folder-upload" : "folder-upload-outline"}
              size={24}
              color={selectedItem === "Uploads" ? "black" : "gray"}
            />
            <Text
              style={[styles.drawerItemText, selectedItem === "Uploads" && styles.activeDrawerItemText]}
            >
              Uploads
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace("Requests")}
            style={[styles.drawerItem, selectedItem === "Requests" && styles.activeDrawerItem]}
          >
            <MaterialCommunityIcons
              name={selectedItem === "Requests" ? "file-question" : "file-question-outline"}
              size={24}
              color={selectedItem === "Requests" ? "black" : "gray"}
            />
            <Text
              style={[styles.drawerItemText, selectedItem === "Requests" && styles.activeDrawerItemText]}
            >
              Requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace("Donate")}
            style={[styles.drawerItem, selectedItem === "Donate" && styles.activeDrawerItem]}
          >
            <MaterialCommunityIcons
              name={selectedItem === "Donate" ? "hand-coin" : "hand-coin-outline"}
              size={24}
              color={selectedItem === "Donate" ? "black" : "gray"}
            />
            <Text
              style={[styles.drawerItemText, selectedItem === "Donate" && styles.activeDrawerItemText]}
            >
              Donate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace("CommunityPost")}
            style={[styles.drawerItem, selectedItem === "CommunityPost" && styles.activeDrawerItem]}
          >
            <MaterialCommunityIcons
              name={selectedItem === "CommunityPost" ? "post" : "post-outline"}
              size={24}
              color={selectedItem === "CommunityPost" ? "black" : "gray"}
            />
            <Text
              style={[styles.drawerItemText, selectedItem === "CommunityPost" && styles.activeDrawerItemText]}
            >
              Community Post
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogoutConfirm} // Trigger logout confirmation
            style={[styles.drawerItemLogout, selectedItem === "Login" && styles.activeDrawerItem]}
          >
            <MaterialCommunityIcons
              name={selectedItem === "Login" ? "logout" : "logout-variant"}
              size={24}
              color={selectedItem === "Login" ? "black" : "white"}
            />
            <Text
              style={[styles.drawerItemLogoutText, selectedItem === "Login" && styles.activeDrawerItemLogoutText]}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={isLogoutConfirmVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCancelLogout}
      >
        <View style={styles.logoutModalContainer}>
          <View style={styles.logoutModalContent}>
            <Text style={styles.logoutModalText}>Are you sure you want to log out?</Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelLogout}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButtonModal}
                onPress={handleLogout}
              >
                <Text style={styles.buttonText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <View style={{ flex: 1 }}>{children}</View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  blockPadContainer: {
    width: "100%",
    height: 60,
    backgroundColor: "#68C2FF",
  },
  menuIcon: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1000,
    borderRadius: 5,
    marginTop: 25,
    marginLeft: 10,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark overlay
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    backgroundColor: "#fff",
    overflow: "hidden",
    zIndex: 999, // Ensure drawer is on top
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 10,
  },
  logoImageContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  logoImage: {
    width: "80%",
    resizeMode: "contain",
  },
  drawerItem: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white", // Default background
  },
  drawerItemText: {
    fontSize: 16,
    color: "gray", // Default text color
    fontFamily: "Lato",
    marginLeft: 30,
  },
  activeDrawerItem: {
    backgroundColor: "rgba(104, 194, 255, 0.5)", // Active background color with 50% opacity
    borderRadius: 40,
  },
  activeDrawerItemText: {
    color: "black", // Active text color
  },
  drawerItemLogout: {
    width: "90%",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF5B5B", // Default background
    justifyContent: 'center',
    marginHorizontal: 15,
    borderRadius: 30,
    position: 'absolute', //Here is the trick
    bottom: 30, //Here is the trick
  },
  drawerItemLogoutText: {
    fontSize: 16,
    color: "white", // Default text color
    fontFamily: "Lato",
    marginLeft: 30,
  },
  activeDrawerItemLogoutText: {
    color: "black", // Active text color
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
  cancelButton: {
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  logoutButtonModal: {
    backgroundColor: "#EF5B5B",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});

export default SideBar;