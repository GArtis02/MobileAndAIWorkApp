import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons"; // for the dropdown chevron
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useAppTheme } from "@/lib/ThemeProvider";
import { colors } from "@/lib/colors";

export const CATEGORIES = [
  "Pārdošana, Tirdzniecība, Klientu apkalpošana",
  "Ražošana, Rūpniecība",
  "Būvniecība, Nekustamais īpašums, Ceļu būve",
  "Veselības aprūpe, Farmācija",
  "Pakalpojumi",
  "Izglītība, Zinātne",
  "Informāciju tehnoloģijas, Datori",
  "Transports, Loģistika, Piegāde",
  "Administrēšana, Asistēšana",
  "Vadība",
  "Inženiertehnika",
  "Tūrisms, Viesnīcas, Ēdināšana",
  "Bankas, Apdrošināšana, Finanses, Grāmatvedība",
  "Valsts un pašvaldību pārvalde",
  "Elektronika, Telekomunikācijas, Enerģētika",
  "Prakse, Brīvprātīgais darbs",
  "Mārketings, Reklāma, PR, Mediji",
  "Lauksaimniecība, Mežsaimniecība, Vide",
  "Personāla vadība",
  "Jurisprudence, Tieslietas",
  "Apsardze, Drošība",
  "Kultūra, Māksla, Izklaide",
  "Mājsaimniecība, Apkope",
];

export default function LoginRegisterScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [location, setLocation] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { theme } = useAppTheme();
  const themeColors = colors[theme];

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    Toast.show({
      type,
      text1: message,
      position: "top",
      visibilityTime: 1500,
    });
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories((prev) => prev.filter((c) => c !== category));
    } else {
      setSelectedCategories((prev) => [...prev, category]);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);

    setDropdownOpen(false);
  };

  const handleSubmit = async () => {
    setDropdownOpen(false);
    if (isRegistering) {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, surname } },
        });
      if (signUpError || !signUpData?.user?.id) {
        showToast(signUpError?.message || "Signup failed", "error");
        return;
      }
      const userId = signUpData.user.id;
      const { error: profileError, data: profileData } = await supabase
        .from("profiles")
        .insert([
          {
            id: userId,
            name,
            surname,
            location,
            category: selectedCategories,
            email,
          },
        ])
        .select();
      if (profileError) {
        showToast(profileError.message || "Profile save failed", "error");
        return;
      }
      await SecureStore.setItemAsync(
        "userProfile",
        JSON.stringify(profileData[0])
      );
      showToast("Registered successfully!");
      router.replace("/");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data?.user?.id) {
        showToast(error?.message || "Login failed", "error");
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      if (profileError) {
        console.log("Profile fetch error:", profileError);
      } else {
        await SecureStore.setItemAsync("userProfile", JSON.stringify(profile));
      }
      showToast("Logged in!");
      router.replace("/");
    }
  };

  const containerStyles = [
    styles.container,
    { backgroundColor: themeColors.background },
    !isRegistering && styles.centerContainer,
  ];

  const inputStyle = {
    backgroundColor: themeColors.inputBg,
    color: themeColors.text,
    borderColor: themeColors.border,
  };

  return (
    <ScrollView contentContainerStyle={containerStyles}>
      {!isRegistering && (
        <Text style={[styles.jobSearch, { color: "#9b59b6" }]}>Job Search</Text>
      )}

      <TextInput
        placeholder="Email"
        placeholderTextColor={theme === "dark" ? "#999" : "#666"}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={[styles.input, inputStyle]}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor={theme === "dark" ? "#999" : "#666"}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={[styles.input, inputStyle]}
      />

      {isRegistering && (
        <>
          <TextInput
            placeholder="Name"
            placeholderTextColor={theme === "dark" ? "#999" : "#666"}
            value={name}
            onChangeText={setName}
            style={[styles.input, inputStyle]}
          />
          <TextInput
            placeholder="Surname"
            placeholderTextColor={theme === "dark" ? "#999" : "#666"}
            value={surname}
            onChangeText={setSurname}
            style={[styles.input, inputStyle]}
          />
          <TextInput
            placeholder="Location"
            placeholderTextColor={theme === "dark" ? "#999" : "#666"}
            value={location}
            onChangeText={setLocation}
            style={[styles.input, inputStyle]}
          />

          <Text style={[styles.label, { color: themeColors.text }]}>
            Job Categories
          </Text>
          <TouchableOpacity
            onPress={() => setDropdownOpen((prev) => !prev)}
            style={[
              styles.dropdownToggle,
              {
                backgroundColor: themeColors.inputBg,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text style={{ color: themeColors.text, flex: 1 }}>
              {selectedCategories.length === 0
                ? "Select Job Categories"
                : selectedCategories.join(", ")}
            </Text>
            <Ionicons
              name={dropdownOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color={themeColors.text}
            />
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownContainer}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={[
                      styles.categoryItem,
                      {
                        borderColor: isSelected
                          ? themeColors.link
                          : themeColors.border,
                        backgroundColor: themeColors.inputBg,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected ? themeColors.link : themeColors.text,
                      }}
                    >
                      {cat}
                    </Text>
                    {isSelected && (
                      <Text style={{ color: themeColors.link }}> ✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      )}

      <View style={{ marginTop: 10, width: "90%", alignSelf: "center" }}>
        <Button title="Login" onPress={handleSubmit} />
      </View>

      <TouchableOpacity onPress={toggleMode}>
        <Text style={[styles.toggle, { color: themeColors.link }]}>
          {isRegistering
            ? "Already have an account? Log in"
            : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>

      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: "100%",
    padding: 20,
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  jobSearch: {
    fontSize: 80,
    fontWeight: "bold",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    fontSize: 16,
    width: "90%",
    alignSelf: "center",
  },
  label: {
    marginTop: 10,
    fontWeight: "bold",
    width: "90%",
    alignSelf: "center",
  },
  dropdownToggle: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    width: "90%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownContainer: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 10,
  },
  categoryItem: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  toggle: {
    marginTop: 20,
    textAlign: "center",
  },
});
