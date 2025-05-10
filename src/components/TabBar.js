import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

const TabBar = ({
  state,
  descriptors,
  navigation,
  hasUnreadNotifications,
  markNotificationsAsRead,
  userEmail,
  roles,
}) => {
  const activeColor = "#68C2FF"; // Color for active tab
  const inactiveColor = "#FFF"; // Color for inactive tab

  console.log("Has unread notifications:", hasUnreadNotifications); // Log here

  const [fontsLoaded] = useFonts({
    Lilita: require("../assets/fonts/LilitaOne-Regular.ttf"), // Custom font
  });

  if (!fontsLoaded) {
    return null; // Return null while fonts are loading
  }

  const icons = {
    index: "paw",
    Track: "truck",
    List: "plus-circle-outline",
    Notification: "bell",
    Profile: "account",
  };

  useEffect(() => {
    console.log("Notification state changed:", hasUnreadNotifications);
  }, [hasUnreadNotifications]);

  return (
    <View style={styles.tabbar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        if (["_sitemap", "+not-found"].includes(route.name)) return null;

        const isFocused = state.index === index;

        // Define onPress handler
        const onPress = () => {
          console.log(`Tab pressed: ${route.name}`); // Log which tab was pressed
          // If the Notification tab is clicked and there are unread notifications, mark them as read

          if (route.name === "Notification" && hasUnreadNotifications) {
            console.log(
              "Unread notifications detected, calling markNotificationsAsRead"
            ); // Log when marking notifications as read
            markNotificationsAsRead(userEmail, roles);
            console.log(
              "Notifications marked as read. Triggered by user:",
              userEmail
            );
          }

          // Emit tab press event
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          // If the event isn't prevented, navigate to the route
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        return (
          <TouchableOpacity
            key={`${route.name}-${route.key}`}
            onPress={onPress}
            style={[styles.tabbarItem, isFocused && styles.tabbarItemActive]}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={icons[route.name]}
                size={30}
                color={isFocused ? activeColor : inactiveColor}
              />
              {/* Show badge only when there are notifications */}
              {route.name === "Notification" && hasUnreadNotifications && (
                <View
                  style={[
                    styles.badge,
                    isFocused && styles.badgeFocused, // Add conditional styling for focused state
                  ]}
                />
              )}
              {isFocused && route.name !== "List" && (
                <Text
                  style={[
                    styles.activeText,
                    { fontFamily: "Lilita", fontSize: 15 },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// TabBar styles (same as before)
const styles = StyleSheet.create({
  tabbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#68C2FF",
    borderTopWidth: 1,
    borderColor: "transparent",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingLeft: 25,
    paddingRight: 25,
  },
  tabbarItem: {
    alignItems: "center",
    alignSelf: "center",
  },
  tabbarItemActive: {
    backgroundColor: "#FFF",
    borderRadius: 25,
    paddingVertical: 8,
    flexDirection: "row",
    alignSelf: "center",
    paddingHorizontal: 10,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  activeText: {
    marginLeft: 5,
    color: "#68C2FF",
  },
  badge: {
    position: "absolute",
    top: 0,
    left: 17,
    backgroundColor: "#FF0000",
    borderRadius: 10,
    width: 10,
    height: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeFocused: {
    top: 0, // Move the badge higher
    left: 17,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default TabBar;
