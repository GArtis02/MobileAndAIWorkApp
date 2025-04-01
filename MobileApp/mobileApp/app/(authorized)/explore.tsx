import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";

export default function App() {
  const [userMessage, setUserMessage] = useState("");
  const [vannaReply, setVannaReply] = useState(null);

  // Fetch the reply from your backend
  const sendMessage = async () => {
    try {
      const response = await fetch("http://92.49.5.242:5001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      console.log("Received data:", data);
      setVannaReply(data.reply || "No reply");
    } catch (error) {
      console.error("Error contacting Vanna:", error);
      setVannaReply("Error");
    }
  };

  // Parse the vacancies: if it's an array of objects with keys, return it directly.
  const parseVacancies = () => {
    if (Array.isArray(vannaReply)) {
      // Check if the first element is an object with keys
      if (
        vannaReply.length > 0 &&
        typeof vannaReply[0] === "object" &&
        Object.keys(vannaReply[0]).length > 0
      ) {
        return vannaReply;
      } else {
        console.log("Unexpected vacancy format:", vannaReply);
        return [];
      }
    }
    return [];
  };

  const vacancies = parseVacancies();

  // Function to handle card press to open URL in default browser
  const openURL = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Failed to open URL:", err)
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Type a message:</Text>
      <TextInput
        style={styles.input}
        value={userMessage}
        onChangeText={setUserMessage}
        placeholder="Enter message..."
        placeholderTextColor="gray"
      />
      <Button title="Send to Vanna" onPress={sendMessage} />

      <Text style={[styles.label, { marginTop: 20, fontWeight: "bold" }]}>
        Vacancies:
      </Text>
      {vacancies.length > 0 ? (
        vacancies.map((vacancy, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => openURL(vacancy.url)}
          >
            <Text style={styles.cardText}>Title: {vacancy.title || "N/A"}</Text>
            <Text style={styles.cardText}>
              Company: {vacancy.company || "N/A"}
            </Text>
            <Text style={styles.cardText}>
              Location: {vacancy.location || "N/A"}
            </Text>
            <Text style={styles.cardText}>
              Deadline: {vacancy.deadline || "N/A"}
            </Text>
            <Text style={styles.cardText}>
              Category: {vacancy.category || "N/A"}
            </Text>
            <Text style={styles.cardText}>
              Salary: {vacancy.salary_min || "N/A"} -{" "}
              {vacancy.salary_max || "N/A"} {vacancy.salary_type || ""}
            </Text>
            <Text style={styles.cardText}>
              Hourly Equivalent: {vacancy.hourly_equiv_min || "N/A"} -{" "}
              {vacancy.hourly_equiv_max || "N/A"}
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.text}>No vacancies found.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  label: {
    color: "white",
    marginBottom: 10,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "white",
    color: "white",
    padding: 10,
    marginBottom: 10,
  },
  text: {
    color: "white",
    fontFamily: "monospace",
  },
  card: {
    backgroundColor: "#333",
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  cardText: {
    color: "white",
    fontFamily: "monospace",
    marginBottom: 2,
  },
});
