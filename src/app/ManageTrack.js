import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal, Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { RadioButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

const TransactionCard = ({ adoptionId, trackingStatus, petName, address, onUpdateStatus }) => {
  const statusStyles = {
    Preparing: { backgroundColor: "#FFB366", text: "Preparing" },
    "In-transit": { backgroundColor: "#FF8C00", text: "In Transit" },
    "On-the-way": { backgroundColor: "#ADD8E6", text: "On the Way" },
    Arrived: { backgroundColor: "#5DB075", text: "Arrived" },
  };

  const currentStatusStyle = statusStyles[trackingStatus] || statusStyles.Preparing;

  return (
    <View style={styles.transactionCard}>
      <Text style={styles.cardText}>
        <Text style={styles.cardLabel}>Current Status: </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: currentStatusStyle.backgroundColor },
          ]}
        >
          <Text style={styles.statusText}>{currentStatusStyle.text}</Text>
        </View>
      </Text>
      <Text style={styles.cardText}>
        <Text style={styles.cardLabel}>Pet Name: </Text>
        {petName}
      </Text>
      <Text style={styles.cardText}>
        <Text style={styles.cardLabel}>Adopter Address: </Text>
        {address}
      </Text>
      <Text style={styles.adoptionIdText}>ID: {adoptionId}</Text>
      <TouchableOpacity style={styles.updateButton} onPress={onUpdateStatus}>
        <Text style={styles.updateButtonText}>Update Status</Text>
      </TouchableOpacity>
      
    </View>
  );
};

export default function ManageTrack() {
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Preparing");
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [isMenuModalVisible, setMenuModalVisible] = useState(false); // State for menu modal
  const navigation = useNavigation();

  useEffect(() => {
    const fetchTransactions = async () => {
      const db = getFirestore();
      const collectionRef = collection(db, "finalized_adoption");
      const querySnapshot = await getDocs(collectionRef);

      const fetchedTransactions = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          adoptionId: doc.id, // Set adoption ID as the UID
          trackingStatus: data.tracking_status || "Preparing",
          petName: data.petRequestDetails?.petName || "Unknown",
          address: data.petRequestDetails?.address || "No Address Provided",
        };
      });

      setTransactions(fetchedTransactions);
    };

    fetchTransactions();
  }, []);

  const handleUpdateStatus = (id) => {
    setCurrentTransactionId(id);
    setModalVisible(true);
    const currentTransaction = transactions.find((item) => item.id === id);
    setSelectedStatus(currentTransaction?.trackingStatus || "Preparing");
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
  };

  const handleSaveStatusUpdate = async () => {
    const db = getFirestore();
    const transactionRef = doc(db, "finalized_adoption", currentTransactionId);

    const validStatuses = ["Preparing", "In-transit", "On-the-way", "Arrived"];

    if (!validStatuses.includes(selectedStatus)) {
      alert("Invalid status selected!");
      return;
    }

    try {
      await updateDoc(transactionRef, { tracking_status: selectedStatus });
      setModalVisible(false);
      alert("Status updated successfully!");
      setTransactions((prevTransactions) =>
        prevTransactions.map((transaction) =>
          transaction.id === currentTransactionId
            ? { ...transaction, trackingStatus: selectedStatus }
            : transaction
        )
      );
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("Failed to update status");
    }
  };

  const handleOpenMenuModal = () => {
    setMenuModalVisible(true);
  };

  const handleCloseMenuModal = () => {
    setMenuModalVisible(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const auth = getAuth();
              await signOut(auth);
              setMenuModalVisible(false);
              navigation.navigate("Login"); // Navigate to Login screen
            } catch (error) {
              console.error("Error signing out: ", error);
              alert("Failed to log out. Please try again.");
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Icon name="search" size={24} color="#444" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#C2C2C2"
          onChangeText={setSearchQuery}
          value={searchQuery}
        />
        <TouchableOpacity onPress={handleOpenMenuModal}>
          <Icon name="more-vert" size={30} color="#444" style={styles.moreIcon} />
        </TouchableOpacity>
      </View>

      {/* Three-dot Menu */}
      <Modal
        transparent
        visible={isMenuModalVisible}
        animationType="fade"
        onRequestClose={handleCloseMenuModal}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={handleCloseMenuModal} // Close modal when clicking outside
        />
        <View style={styles.menuModalContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Title */}
      <Text style={styles.transactionListTitle}>Manage Tracking</Text>

      {/* Transaction Cards */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {transactions.map((item, index) => (
          <TransactionCard
            key={index}
            adoptionId={item.adoptionId}
            trackingStatus={item.trackingStatus}
            petName={item.petName}
            address={item.address}
            onUpdateStatus={() => handleUpdateStatus(item.id)}
          />
        ))}
      </ScrollView>

      {/* Modal for Update Status */}
      <Modal
        transparent
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay} />
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Update Status</Text>
          <RadioButton.Group onValueChange={handleStatusChange} value={selectedStatus}>
            {["Preparing", "In-transit", "On-the-way", "Arrived"].map((status, index) => (
              <View key={index} style={styles.radioContainer}>
                <RadioButton value={status} color="#68C2FF" />
                <Text style={styles.statusOptionText}>{status}</Text>
              </View>
            ))}
          </RadioButton.Group>
          <TouchableOpacity style={styles.proceedButton} onPress={handleSaveStatusUpdate}>
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: "88%",
    alignSelf: "center",
    marginTop: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#444",
  },
  moreIcon: {
    marginLeft: 10,
  },
  menuContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
    width: 150,
  },
  menuItem: {
    padding: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#444",
  },
  transactionListTitle: {
    fontSize: 24,
    fontFamily: "Lilita",
    color: "#68C2FF",
    marginTop: 40,
    marginBottom: 10,
    textAlign: "center",
  },
  scrollContainer: {
    paddingBottom: 16,
  },
  transactionCard: {
    marginTop: 20,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
  },
  adoptionIdText: {
    fontSize: 12, // Smaller text size
    color: "#888", // Grey color
    textAlign: "right", // Align to the right
    marginTop: 10, // Add some spacing from other elements
  },
  cardText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  cardLabel: {
    fontWeight: "bold",
    color: "#000",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    paddingLeft: 20,
    paddingRight: 20,
  },
  updateButton: {
    backgroundColor: "#68C2FF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 25,
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Lilita",
  },
  modalContainer: {
    position: "absolute",
    top: "25%",
    left: "10%",
    width: "80%",
    backgroundColor: "white",
    borderRadius: 25,
    padding: 20,
    elevation: 5,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Lilita",
    color: "#68C2FF",
    marginBottom: 20,
    textAlign: "center",
  },
  statusOptions: {
    marginBottom: 30,
    flexGrow: 1,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  statusOptionText: {
    fontSize: 16,
    color: "#444",
    marginLeft: 10,
  },
  proceedButton: {
    backgroundColor: "#EF5B5B",
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 20,
    alignSelf: "center",
    marginTop: 20,
  },
  proceedButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  menuModalContainer: {
    flex: 0.3,
    backgroundColor: "white",
    padding: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  logoutButton: {
    backgroundColor: "#EF5B5B",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "center",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuItemLogout: {
    padding: 12,
    backgroundColor: "#FF5C5C", // Bright red for logout
    borderRadius: 15,
    marginHorizontal: 2,
  },
  menuItemLogoutText: {
    fontSize: 16,
    color: "#FFFFFF", // White for readability
    textAlign: "center",
    fontWeight: "bold",
  },
  
});