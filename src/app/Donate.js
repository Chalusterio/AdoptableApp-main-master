import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import SideBar from "../components/SideBar";

const Donate = () => {
  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [suppliesModalVisible, setSuppliesModalVisible] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [activeMethod, setActiveMethod] = useState(null);
  const [selectedItem, setSelectedItem] = useState("Donate");

  const handlePaymentMethod = (method) => {
    setActiveMethod(method);
  };

  const handleSuppliesDonation = () => {
    setSuppliesModalVisible(true);
    setTimeout(() => {
      setSuppliesModalVisible(false);
      setCashModalVisible(false);
    }, 3000);
  };

  return (
    <SideBar selectedItem={selectedItem} setSelectedItem={setSelectedItem}>
      <ScrollView>
        <View style={styles.container}>
          {/* Header Section */}
          <Text style={styles.headerText}>Your Kindness, Their Care</Text>
          <Text style={styles.description}>
            Every donation you make provides nutritious meals, life-saving medical care, and cozy, safe spaces for them.
          </Text>
          <Image
            source={require("../assets/Donate/CatDog.png")}
            style={styles.image}
          />

          {/* Support Section */}
          <View style={styles.supportContainer}>
            <Text style={styles.supportHeader}>We’d love your support!</Text>
            <Text style={styles.supportDescription}>
              Together, we can ensure every animal gets the love and care they deserve.
            </Text>

            {/* Button Container */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setCashModalVisible(true)}
              >
                <Text style={styles.buttonText}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={handleSuppliesDonation}
              >
                <Text style={styles.buttonText}>Supplies</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal for Cash Donation */}
          <Modal
            visible={cashModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setCashModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setCashModalVisible(false);
                  setActiveMethod(null);
                }}
              >
                <Icon name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.modalContent}>
                <Text style={styles.modalHeader}>Enter your desired amount</Text>
                <TextInput
                  placeholder="e.g., 1000"
                  value={donationAmount}
                  onChangeText={setDonationAmount}
                  style={styles.input}
                  keyboardType="numeric"
                />

                <Text style={styles.modalText}>Choose your payment method</Text>
                <View style={styles.paymentButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      activeMethod === "G-Cash" && styles.activeButton,
                    ]}
                    onPress={() => handlePaymentMethod("G-Cash")}
                  >
                    <Text
                      style={[
                        styles.paymentButtonText,
                        activeMethod === "G-Cash" && styles.activeButtonText,
                      ]}
                    >
                      G-Cash
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      activeMethod === "Debit Card" && styles.activeButton,
                    ]}
                    onPress={() => handlePaymentMethod("Debit Card")}
                  >
                    <Text
                      style={[
                        styles.paymentButtonText,
                        activeMethod === "Debit Card" && styles.activeButtonText,
                      ]}
                    >
                      Debit Card
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.proceedButton}  onPress={handleSuppliesDonation}>
                  <Text style={styles.proceedButtonText}>Proceed</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Modal for Supplies Donation */}
          <Modal
            visible={suppliesModalVisible}
            animationType="fade"
            transparent={true}
          >
            <View style={styles.suppliesModalContainer}>
              <Text style={styles.suppliesModalHeader}>
                Thank You for Your Generosity!
              </Text>
              <Text style={styles.suppliesModalText}>
                We’ll let the recipients know and send you a confirmation via email shortly!
                {"\n\n"}
                Your kindness keeps them cared for and loved.
              </Text>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SideBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Lilita',
    color: '#68C2FF',
    textAlign: 'center',
    marginTop: 80,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Lato',
    color: '#68C2FF',
    textAlign: 'center',
    marginVertical: 5,
    marginBottom: 50,
    marginHorizontal: 20,
  },
  image: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    marginBottom: 30,
  },
  supportContainer: {
    backgroundColor: '#68C2FF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 10,
    alignItems: 'center',
    paddingVertical: 100,
  },
  supportHeader: {
    fontSize: 24,
    fontFamily: 'Lilita',
    color: '#FFF',
    marginBottom: 15,
  },
  supportDescription: {
    fontSize: 16,
    fontFamily: 'Lato',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  button: {
    borderColor: '#FFF',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    width: 120,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Lato',
    color: '#FFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  modalHeader: {
    fontSize: 24,
    fontFamily: 'Lilita',
    color: '#68C2FF',
    marginTop: 15,
    marginBottom: 15,
  },
  input: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 20,
    marginBottom: 50,
  },
  modalText: {
    fontSize: 24,
    fontFamily: 'Lilita',
    color: '#68C2FF',
    marginBottom: 20,
  },
  paymentButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  paymentButton: {
    flex: 1,
    borderColor: '#D3D3D3',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#68C2FF',
    borderColor: '#68C2FF',
  },
  paymentButtonText: {
    fontSize: 16,
    fontFamily: 'Lato',
    color: '#D3D3D3',
  },
  activeButtonText: {
    color: '#FFF',
  },
  proceedButton: {
    backgroundColor: '#EF5B5B',
    borderRadius: 30,
    paddingVertical: 15,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  proceedButtonText: {
    fontSize: 16,
    fontFamily: 'Lilita',
    color: '#FFF',
  },
  suppliesModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#68C2FF', // Updated background color
    paddingHorizontal: 20, // To ensure proper spacing for text
  },
  suppliesModalHeader: {
    fontSize: 24, // Header font size
    fontFamily: 'Lilita', // Header font family
    color: '#FFF', // Header font color
    textAlign: 'center',
    marginBottom: 15, // Space between header and text
  },
  suppliesModalText: {
    fontSize: 16, // Text font size
    fontFamily: 'Lato', // Text font family
    color: '#FFF', // Text font color
    textAlign: 'center', // Center-align text
    lineHeight: 22, // Improve readability
  },
});

export default Donate;
