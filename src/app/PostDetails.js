import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"; // Import icons
import { useFonts } from "expo-font"; // For custom fonts

const PostDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { post } = route.params; // Get the post data from the route parameters

  const [fontsLoaded] = useFonts({
    "Lilita-One": require("../assets/fonts/LilitaOne-Regular.ttf"), // Adjust path as needed
  });

  if (!fontsLoaded) {
    return null; // Show nothing until the font is loaded
  }

  return (
    <View style={styles.outerContainer}>
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Centered Post Details */}
      <View style={styles.postDetails}>
        {/* Post Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Date */}
        <View style={styles.iconTextRowContainer}>
          <MaterialCommunityIcons name="calendar" size={24} color="#777" />
          <Text style={styles.subtitle}>
            {post.when ? `${post.when}` : "No date specified"}
          </Text>
        </View>

        {/* Urgency */}
        {post.urgent && (
          <View style={styles.iconTextRowContainer}>
            <MaterialCommunityIcons name="clock-fast" size={24} color="red" />
            <Text style={styles.urgentText}>Urgent</Text>
          </View>
        )}

        {/* Posted By */}
        {post.postedBy && (
          <Text style={styles.postUsernameBy}>
            {"Posted by: "}
            <Text style={styles.postUsername}> {post.postedBy}</Text>
          </Text>
        )}
      </View>

      {/* Modal with full image background */}
      <View style={styles.modalWrapper}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Post Details */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Who:</Text>
              <Text style={styles.detailText}>{post.who}</Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>What:</Text>
              <Text style={styles.detailText}>{post.what}</Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Where:</Text>
              <Text style={styles.detailText}>{post.where}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#68C2FF",
    backgroundColor: "white",
    textAlign: "center",
    justifyContent: "center",
  },
  modalWrapper: {
    width: "100%", // Modal width
    height: "70%", // Modal height
    justifyContent: "center", // Center modal content vertically
    alignItems: "center", // Center modal content horizontally
    borderRadius: 10, // Reduced border radius
    overflow: "hidden", // Ensure the content inside is clipped properly
  },
  modalContainer: {
    flex: 1,
    width: "100%", // Full width
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally
    borderTopRightRadius: 50, // Reduced border radius
    borderTopLeftRadius: 50, // Reduced border radius
    backgroundColor: "#68C2FF", // White with slight opacity
    overflow: "hidden", // Ensure content is clipped inside the rounded corners
    padding: 20,
  },
  content: {
    paddingBottom: 20,
    marginTop: 20,
  },
  postDetails: {
    flex: 1, // Allows the view to expand to fill available space
    alignItems: "center", // Centers content horizontally
    justifyContent: "center", // Centers content vertically
  },
  title: {
    fontSize: 30,
    fontFamily: "LatoBold",
    marginBottom: 15,
    textAlign: "center", // Center the title
  },
  iconTextRowContainer: {
    flexDirection: "row", // Horizontal layout
    alignItems: "center", // Center items vertically
    justifyContent: "center", // Center items horizontally
    gap: 8, // Space between items
    marginBottom: 10, // Spacing below the row
  },
  subtitle: {
    fontSize: 20,
    color: "#777",
    fontFamily: "Lato",
    textAlign: "center", // Ensure the text is centered
  },
  urgentText: {
    fontSize: 20,
    color: "red",
    fontFamily: "Lato",
    textAlign: "center",
  },
  postUsernameBy: {
    fontSize: 25,
    color: "black",
    fontFamily: "LatoBold",
    marginBottom: 5,
  },
  postUsername: {
    fontSize: 25,
    color: "#777",
    fontFamily: "Lato",
    marginBottom: 5,
  },
  infoContainer: {
    marginBottom: 15,
    justifyContent: "center",  // Centers vertically in its container
    alignItems: "center",      // Centers horizontally in its container
    width: "100%",             // Ensure the container takes full width
  },
  infoTitle: {
    fontSize: 25,
    color: "white",
    fontFamily: "LatoBold",
    marginBottom: 5,
    textAlign: "center",
  },
  detailText: {
    fontSize: 16,
    color: "white",
    marginBottom: 5,
    textAlign: "justify", // This centers the text horizontally
    justifyContent: "center", // This ensures the text is vertically centered
    alignItems: "center", // This ensures the text is vertically centered
  },
  backButtonContainer: {
    alignSelf: "flex-start", // Align to the start of the container horizontally
    marginTop: 20, // Add some space at the top
    marginLeft: 20, // Add space from the left
    backgroundColor: "gray",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PostDetails;
