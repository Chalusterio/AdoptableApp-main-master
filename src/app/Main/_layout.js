import React from "react";
import { Tabs } from "expo-router";
import TabBar from "../../components/TabBar";
import { useNotifications } from "../../context/NotificationContext";

const Main = () => {
  const { hasUnreadNotifications, roles, markNotificationsAsRead, userEmail } = useNotifications();  

  // Check the role of the user, and assign the appropriate unread notification state
  const isAdopter = roles.includes("adopter");
  const isLister = roles.includes("lister");

  // Determine if there are unread notifications for the user based on their role
  const hasUnreadNotificationsForRole = 
    (isAdopter && hasUnreadNotifications) || 
    (isLister && hasUnreadNotifications) || 
    false;

  return (
    <Tabs
      tabBar={(props) => (
        <TabBar
          {...props}
          hasUnreadNotifications={hasUnreadNotificationsForRole} // Passing correct unread notification status
          markNotificationsAsRead={markNotificationsAsRead}  // Passing function to mark notifications as read
          userEmail={userEmail}  // Passing user email
          roles={roles}  // Passing roles (adopter, lister)
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: "Home", headerShown: false }} />
      <Tabs.Screen name="Track" options={{ title: "Track", headerShown: false }} />
      <Tabs.Screen name="List" options={{ title: "List", headerShown: false }} />
      <Tabs.Screen name="Notification" options={{ title: "Notifications", headerShown: false }} />
      <Tabs.Screen name="Profile" options={{ title: "Profile", headerShown: false }} />
    </Tabs>
  );
};

export default Main;
