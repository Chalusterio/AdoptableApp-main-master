import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput } from "react-native";

const RejectReasonModal = ({ visible, onClose, onProceed }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const reasons = ["Not a good match", "Incomplete Details", "Other"];

  const handleProceed = () => {
    // Capture the reason selected by the user
    const reason = selectedReason === "Other" ? otherReason : selectedReason;
    onProceed(reason); // Send the reason to the parent component (which will update Firestore)
    onClose(); // Close the modal after proceeding
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <View
          style={{
            width: "90%",
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 10,
          }}
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontFamily: "Lilita",
              color: "#68C2FF",
              marginBottom: 30,
              textAlign: 'center',
            }}
          >
            Reason for Rejection
          </Text>

          {/* Radio Buttons */}
          {reasons.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 5,
              }}
              onPress={() => setSelectedReason(reason)}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: selectedReason === reason ? "#68C2FF" : "#ccc",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 10,
                }}
              >
                {selectedReason === reason && (
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "#68C2FF",
                    }}
                  />
                )}
              </View>
              <Text style={{ fontFamily: "Lato" }}>{reason}</Text>
            </TouchableOpacity>
          ))}

          {/* Other Reason Input */}
          {selectedReason === "Other" && (
            <TextInput
              placeholder="Please specify"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 5,
                padding: 10,
                marginTop: 10,
                fontFamily: "Lato",
              }}
              value={otherReason}
              onChangeText={setOtherReason}
            />
          )}

          {/* Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center", // Center-aligns buttons horizontally
              marginTop: 20,
            }}
          >
           

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                height: 40,
                width: 120, // Set a width to keep the buttons uniform
                backgroundColor: "#EF5B5B", // Updated color
                borderRadius: 30,
                alignItems: "center",
                justifyContent: "center",
                marginHorizontal: 10, // Adds spacing between buttons
              }}
            >
              <Text style={{ color: "#fff", fontFamily: "Lato", fontWeight: "bold" }}>Cancel</Text>
            </TouchableOpacity>

             {/* Proceed Button */}
             <TouchableOpacity
              onPress={handleProceed}
              style={{
                height: 40,
                width: 120, // Set a width to keep the buttons uniform
                backgroundColor: "#68C2FF", // Updated color
                borderRadius: 30,
                alignItems: "center",
                justifyContent: "center",
                marginHorizontal: 10, // Adds spacing between buttons
              }}
            >
              <Text style={{ color: "#fff", fontFamily: "Lato", fontWeight: "bold" }}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RejectReasonModal;
