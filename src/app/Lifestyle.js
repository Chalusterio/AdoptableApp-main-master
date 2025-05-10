import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider'; // paste sa terminal: npm install @react-native-community/slider
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from "react-native-vector-icons/Ionicons";
import { getFirestore, collection, query, where, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';  // Import Firestore methods

export default function Lifestyle() {
  const router = useRouter();
  const { userName, userEmail, userContactNumber } = useLocalSearchParams();
  const [livingSpace, setLivingSpace] = useState(null);
  const [ownedPets, setOwnedPets] = useState(null);
  const [dailyActivity, setDailyActivity] = useState(0.5);
  const [dedicationHours, setDedicationHours] = useState(0.5);

  const handleProceed = async () => {
    if (livingSpace && ownedPets !== null) {
      const getLabel = (value, labels) => {
        if (value <= 0.2) return labels[0];
        if (value <= 0.5) return labels[1];
        return labels[2];
      };

      const activityLabel = getLabel(dailyActivity, ["Relaxed", "Moderately Active", "Very Active"]);
      const dedicationLabel = getLabel(dedicationHours, ["1–2 Hours", "3–4 Hours", "5+ Hours"]);

      try {
        const db = getFirestore();  // Initialize Firestore
        const lifestyleRef = collection(db, 'lifestyle');
        const q = query(lifestyleRef, where("email", "==", userEmail));

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          await setDoc(doc(db, 'lifestyle', userEmail), {
            email: userEmail,
            livingSpace: livingSpace,
            ownedPets: ownedPets,
            dailyActivity: dailyActivity,
            dailyActivityLabel: activityLabel,
            dedicationHours: dedicationHours,
            dedicationHoursLabel: dedicationLabel,
            timestamp: new Date(),
          });
          console.log('Lifestyle data saved successfully!');
        } else {
          querySnapshot.forEach((docSnapshot) => {
            updateDoc(doc(db, 'lifestyle', docSnapshot.id), {
              livingSpace: livingSpace,
              ownedPets: ownedPets,
              dailyActivity: dailyActivity,
              dailyActivityLabel: activityLabel,
              dedicationHours: dedicationHours,
              dedicationHoursLabel: dedicationLabel,
              timestamp: new Date(),
            });
          });
          console.log('Lifestyle data updated successfully!');
        }

        router.push({
          pathname: 'Preferences',
          params: { userName, userEmail, userContactNumber, livingSpace, ownedPets },
        });

      } catch (error) {
        console.error('Error saving or updating lifestyle data:', error);
        alert('Failed to save or update lifestyle data. Please try again.');
      }
    } else {
      alert('Please complete all selections.');
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
      <View
        style={styles.container}
      >
        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
          <Text style={styles.greetingText}>Hello {userName || "User"},</Text>
          <Text style={styles.titleText}>Let’s get to know each other!</Text>

          {/* Living Space Selection */}
          <Text style={styles.question}>What type of living space do you have?</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                livingSpace === 'Apartment/Condo' && styles.selectedOptionButton,
              ]}
              onPress={() => setLivingSpace('Apartment/Condo')}
            >
              <Text
                style={[
                  styles.optionText,
                  livingSpace === 'Apartment/Condo' && styles.selectedOptionText,
                ]}
              >
                Apartment/Condo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                livingSpace === 'House' && styles.selectedOptionButton,
              ]}
              onPress={() => setLivingSpace('House')}
            >
              <Text
                style={[
                  styles.optionText,
                  livingSpace === 'House' && styles.selectedOptionText,
                ]}
              >
                House
              </Text>
            </TouchableOpacity>
          </View>

          {/* Owned Pets Selection */}
          <Text style={styles.question}>Have you owned pets before?</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                ownedPets === 'Yes' && styles.selectedOptionButton,
              ]}
              onPress={() => setOwnedPets('Yes')}
            >
              <Text
                style={[
                  styles.optionText,
                  ownedPets === 'Yes' && styles.selectedText,
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                ownedPets === 'No' && styles.selectedOptionButton,
              ]}
              onPress={() => setOwnedPets('No')}
            >
              <Text
                style={[
                  styles.optionText,
                  ownedPets === 'No' && styles.selectedText,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>

          {/* Daily Activity Slider */}
          <Text style={styles.question}>How active are you on a daily basis?</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.1}
            value={dailyActivity}
            onValueChange={setDailyActivity}
            minimumTrackTintColor="#68C2FF"
            maximumTrackTintColor="gray"
            thumbTintColor="#68C2FF"
          />
          <View style={styles.sliderLabelsContainer}>
            <Text style={styles.sliderLabel}>Relaxed</Text>
            <Text style={styles.sliderLabel}>Very Active</Text>
          </View>

          {/* Dedication Hours Slider */}
          <Text style={styles.question}>
            How many hours a day can you dedicate to your pet?
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.1}
            value={dedicationHours}
            onValueChange={setDedicationHours}
            minimumTrackTintColor="#68C2FF"
            maximumTrackTintColor="gray"
            thumbTintColor="#68C2FF"
          />
          <View style={styles.sliderLabelsContainer}>
            <Text style={styles.sliderLabel}>1 - 2 Hours</Text>
            <Text style={styles.sliderLabel}>5+ Hours</Text>
          </View>

          {/* Proceed Button */}
          <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
    padding: 20,
    flexDirection: 'column',
    paddingTop: 10, 
  },
  backButtonContainer: {
    backgroundColor: "gray",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 70,
  },
  greetingText: {
    fontSize: 18,
    color: 'gray',
    marginBottom: 10,
    fontFamily: 'Lato',
  },
  titleText: {
    fontSize: 24,
    color: '#68C2FF',
    marginBottom: 20,
    fontFamily: 'Lilita',
    marginBottom: 50,
  },
  question: {
    fontSize: 16,
    marginVertical: 15,
    color: 'black',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // Default background
  },
  selectedOptionButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#68C2FF',
  },
  optionText: {
    color: 'gray',
  },
  selectedOptionText: {
    color: '#68C2FF',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  proceedButton: {
    backgroundColor: '#EF5B5B',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 10, // Adjust this for spacing
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});