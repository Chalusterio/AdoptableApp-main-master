import React, { createContext, useState, useEffect, useContext } from "react";
import { collection, query, where, onSnapshot, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../app/config/firebase"; // Firebase setup import
import { auth } from "../app/config/firebase"; // Assuming you have auth setup
import { onAuthStateChanged } from "firebase/auth";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false); // General unread notifications
  const [roles, setRoles] = useState([]); // Roles: ['lister', 'adopter']
  const [userEmail, setUserEmail] = useState(null); // Track user email

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email); // Save user email
        console.log("User logged in:", user.email);

        let tempRoles = [];
        let adopterUnread = false; // Flag for adopter unread
        let listerUnread = false;  // Flag for lister unread

        const qAdopter = query(
          collection(db, "pet_request"),
          where("adopterEmail", "==", user.email) // Check if user is adopter
        );

        const qLister = query(
          collection(db, "pet_request"),
          where("listedBy", "==", user.email) // Check if user is lister
        );

        const unsubscribeAdopter = onSnapshot(
          qAdopter,
          (snapshot) => {
            if (!snapshot.empty) {
              if (!tempRoles.includes("adopter")) tempRoles.push("adopter");
              snapshot.docs.forEach((doc) => {
                if (!doc.data().adopterNotificationRead) {
                  adopterUnread = true; // Flag if there's an unread notification
                }
              });
            }
            // Set state for roles and unread notification status
            setRoles([...tempRoles]);
            setHasUnreadNotifications(adopterUnread || listerUnread); // Combine both flags
          },
          (error) => {
            console.error("Error checking adopter notifications:", error);
          }
        );

        const unsubscribeLister = onSnapshot(
          qLister,
          (snapshot) => {
            if (!snapshot.empty) {
              if (!tempRoles.includes("lister")) tempRoles.push("lister");
              snapshot.docs.forEach((doc) => {
                if (!doc.data().listerNotificationRead) {
                  listerUnread = true; // Flag if there's an unread notification
                }
              });
            }
            // Set state for roles and unread notification status
            setRoles([...tempRoles]);
            setHasUnreadNotifications(adopterUnread || listerUnread); // Combine both flags
          },
          (error) => {
            console.error("Error checking lister notifications:", error);
          }
        );

        // Cleanup listeners on unmount
        return () => {
          unsubscribeAdopter();
          unsubscribeLister();
        };
      } else {
        console.log("No user is logged in.");
        setUserEmail(null);
        setRoles([]);
        setHasUnreadNotifications(false);
      }
    });

    return () => {
      unsubscribeAuth(); // Stop listening for auth state changes
    };
  }, []); // Empty dependency array so this effect runs on mount and unmount

  const markNotificationsAsRead = async (userEmail, roles) => {
    if (!userEmail || !Array.isArray(roles) || roles.length === 0) {
      console.error("Invalid userEmail or roles:", userEmail, roles);
      return;
    }
  
    try {
      let adopterUnread = false;
      let listerUnread = false;
  
      // Iterate through all roles (adopter, lister)
      for (const role of roles) {
        if (typeof role !== 'string') {
          console.error("Invalid role:", role);
          continue; // Skip invalid roles
        }
  
        let queryRef;
  
        // Build query based on role
        if (role === "adopter") {
          queryRef = query(collection(db, "pet_request"), where("adopterEmail", "==", userEmail));
        } else if (role === "lister") {
          queryRef = query(collection(db, "pet_request"), where("listedBy", "==", userEmail));
        }
  
        // Fetch notifications for this role
        const snapshot = await getDocs(queryRef);
  
        if (!snapshot.empty) {
          // Perform batch update for each notification for this role
          const updates = snapshot.docs.map((doc) => {
            const docRef = doc.ref;
            const updateData = role === "adopter"
              ? { adopterNotificationRead: true }
              : { listerNotificationRead: true };
  
            return updateDoc(docRef, updateData);
          });
  
          // Wait for all updates to finish
          await Promise.all(updates);
  
          // After batch updates, re-fetch to check for unread notifications
          const reCheckSnapshot = await getDocs(queryRef);
  
          // Check if there are still any unread notifications for the current role
          if (role === "adopter") {
            adopterUnread = reCheckSnapshot.docs.some(doc => !doc.data().adopterNotificationRead);
          }
  
          if (role === "lister") {
            listerUnread = reCheckSnapshot.docs.some(doc => !doc.data().listerNotificationRead);
          }
        }
      }
  
      // Update the overall unread notifications flag based on both roles
      const hasUnread = adopterUnread || listerUnread;
      setHasUnreadNotifications(hasUnread); // Assuming setHasUnreadNotifications updates state
  
      console.log("Notifications marked as read. Unread status:", hasUnread);
  
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };
  
  

  useEffect(() => {
    console.log("Has unread notifications:", hasUnreadNotifications);
    console.log("User roles:", roles);
  }, [hasUnreadNotifications, roles]); // Log after state update

  return (
    <NotificationContext.Provider value={{ hasUnreadNotifications, roles, markNotificationsAsRead, userEmail }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    console.error("useNotifications must be used within a NotificationProvider.");
    throw new Error("useNotifications must be used within a NotificationProvider.");
  }
  return context;
};
