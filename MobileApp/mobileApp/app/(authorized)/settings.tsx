import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Button,
} from "react-native";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
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

export default function SettingsScreen() {
  // Added toggleTheme from the custom hook
  const { theme, toggleTheme } = useAppTheme();
  const themeColors = colors[theme];

  const [profile, setProfile] = useState<any>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const profileString = await SecureStore.getItemAsync("userProfile");
      if (profileString) {
        const saved = JSON.parse(profileString);
        setProfile(saved);

        let categoriesFromDB = saved.category;
        if (typeof categoriesFromDB === "string") {
          try {
            categoriesFromDB = JSON.parse(categoriesFromDB);
          } catch {
            categoriesFromDB = [];
          }
        }
        if (!Array.isArray(categoriesFromDB)) {
          categoriesFromDB = [];
        }
        setSelectedCategories(categoriesFromDB);
      }
    })();
  }, []);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories((prev) => prev.filter((c) => c !== category));
    } else {
      setSelectedCategories((prev) => [...prev, category]);
    }
  };

  const handleUpdate = async () => {
    if (!profile?.id) return;

    setDropdownOpen(false);

    const { data, error } = await supabase
      .from("profiles")
      .update({
        name: profile.name || "",
        surname: profile.surname || "",
        location: profile.location || "",
        category: selectedCategories,
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (error) {
      Toast.show({ type: "error", text1: error.message });
      return;
    }
    if (data) {
      setProfile(data);
      await SecureStore.setItemAsync("userProfile", JSON.stringify(data));
      Toast.show({ type: "success", text1: "Profile updated!" });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {profile && (
        <>
          <Text style={[styles.label, { color: themeColors.text }]}>Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themeColors.inputBg,
                color: themeColors.text,
                borderColor: themeColors.border,
              },
            ]}
            value={profile.name || ""}
            onChangeText={(val) => setProfile({ ...profile, name: val })}
            placeholder="Name"
            placeholderTextColor={themeColors.border}
          />

          <Text style={[styles.label, { color: themeColors.text }]}>
            Surname
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themeColors.inputBg,
                color: themeColors.text,
                borderColor: themeColors.border,
              },
            ]}
            value={profile.surname || ""}
            onChangeText={(val) => setProfile({ ...profile, surname: val })}
            placeholder="Surname"
            placeholderTextColor={themeColors.border}
          />

          <Text style={[styles.label, { color: themeColors.text }]}>
            Location
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themeColors.inputBg,
                color: themeColors.text,
                borderColor: themeColors.border,
              },
            ]}
            value={profile.location || ""}
            onChangeText={(val) => setProfile({ ...profile, location: val })}
            placeholder="Location"
            placeholderTextColor={themeColors.border}
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

          <View style={styles.buttonWrapper}>
            <Button
              title="Update"
              onPress={handleUpdate}
              color={themeColors.link}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="Toggle Theme"
              onPress={toggleTheme}
              color={themeColors.link}
            />
          </View>
        </>
      )}
      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  dropdownToggle: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownContainer: {
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
  buttonWrapper: {
    marginTop: 20,
  },
});
