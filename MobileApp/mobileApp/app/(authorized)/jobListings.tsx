import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/ThemeProvider";
import { colors } from "@/lib/colors";
import Toast from "react-native-toast-message";

export default function JobListingPage() {
  const { theme } = useAppTheme();
  const themeColors = colors[theme];
  const [jobs, setJobs] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [payFrom, setPayFrom] = useState("");
  const [payTo, setPayTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [dynamicCityCounts, setDynamicCityCounts] = useState([]);
  const [dynamicCategoryCounts, setDynamicCategoryCounts] = useState([]);
  const scrollRef = useRef(null);

  const fetchJobs = async () => {
    try {
      let url = `http://92.49.5.242:5000/all-jobs?page=${page}`;
      const params = new URLSearchParams();

      if (selectedCities.length > 0)
        params.append("location", selectedCities.join(","));
      if (selectedCategories.length > 0)
        params.append("categories", selectedCategories.join(","));
      if (payFrom) params.append("payFrom", payFrom);
      if (payTo) params.append("payTo", payTo);

      if ([...params].length > 0) {
        url += `&${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotalPages(data.pages || 1);
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to load jobs" });
    }
  };

  const fetchDynamicFilterCounts = async () => {
    try {
      let url = "http://92.49.5.242:5000/filter-counts?";
      const params = new URLSearchParams();

      if (selectedCities.length > 0) {
        params.append("location", selectedCities.join(","));
      }

      if (selectedCategories.length > 0) {
        params.append("categories", selectedCategories.join(","));
      }
      if (payFrom) params.append("payFrom", payFrom);
      if (payTo) params.append("payTo", payTo);
      url += params.toString();

      const res = await fetch(url);
      const data = await res.json();
      setDynamicCategoryCounts(data.categoryCounts || []);
      setDynamicCityCounts(data.locationCounts || []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to load dynamic filter counts",
      });
    }
  };

  const fetchFilters = async () => {
    try {
      const res = await fetch("http://92.49.5.242:5000/filter-options");
      const data = await res.json();
      setCities(data.locations || []);
      setCategories(data.categories || []);
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to load filters" });
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchFilters();
    fetchDynamicFilterCounts();
  }, [page]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [page]);

  useEffect(() => {
    fetchDynamicFilterCounts();
  }, [selectedCities, selectedCategories, payFrom, payTo]);

  const toggle = (item, list, setList) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          Job Listings
        </Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="filter" size={24} color={themeColors.link} />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef}>
        {jobs.length === 0 ? (
          <Text
            style={{
              color: themeColors.text,
              textAlign: "center",
              marginTop: 40,
            }}
          >
            No jobs match the selected filters.
          </Text>
        ) : (
          jobs.map((job, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                if (job.url) {
                  Linking.openURL(job.url);
                }
              }}
            >
              <View
                style={[styles.card, { backgroundColor: themeColors.inputBg }]}
              >
                <Text style={{ color: themeColors.text }}>{job.title}</Text>
                <Text style={{ color: themeColors.text }}>{job.company}</Text>
                <Text style={{ color: themeColors.text }}>{job.location}</Text>
                <Text style={{ color: themeColors.text }}>{job.category}</Text>
                <Text style={{ color: themeColors.text }}>
                  {job.salary_type}: {job.salary_min} - {job.salary_max}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.pagination}>
          <Button
            title="Prev"
            disabled={page === 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          />
          <Text style={{ color: themeColors.text }}>
            {`Page ${page} of ${totalPages}`}
          </Text>
          <Button
            title="Next"
            disabled={page >= totalPages}
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: themeColors.background }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              City
            </Text>

            {dynamicCityCounts.map((city) => (
              <TouchableOpacity
                key={city.location}
                onPress={() =>
                  toggle(city.location, selectedCities, setSelectedCities)
                }
                style={styles.item}
              >
                <Text
                  style={{
                    color: selectedCities.includes(city.location)
                      ? themeColors.link
                      : themeColors.text,
                  }}
                >
                  {city.location} ({city.count})
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { color: themeColors.text }]}>
              Categories
            </Text>

            {dynamicCategoryCounts.map((cat) => (
              <TouchableOpacity
                key={cat.category}
                onPress={() =>
                  toggle(
                    cat.category,
                    selectedCategories,
                    setSelectedCategories
                  )
                }
                style={styles.item}
              >
                <Text
                  style={{
                    color: selectedCategories.includes(cat.category)
                      ? themeColors.link
                      : themeColors.text,
                  }}
                >
                  {cat.category} ({cat.count})
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { color: themeColors.text }]}>
              Pay Range
            </Text>
            <TextInput
              placeholder="From"
              keyboardType="numeric"
              value={payFrom}
              onChangeText={setPayFrom}
              style={[
                styles.input,
                { borderColor: themeColors.border, color: themeColors.text },
              ]}
              placeholderTextColor={themeColors.border}
            />
            <TextInput
              placeholder="To"
              keyboardType="numeric"
              value={payTo}
              onChangeText={setPayTo}
              style={[
                styles.input,
                { borderColor: themeColors.border, color: themeColors.text },
              ]}
              placeholderTextColor={themeColors.border}
            />

            <View style={{ marginBottom: 8 }}>
              <Button
                title="Apply Filters"
                onPress={() => {
                  setPage(1);
                  fetchJobs();
                  setModalVisible(false);
                }}
              />
            </View>

            <View style={{ marginBottom: 8 }}>
              <Button
                title="Clear All Filters"
                onPress={() => {
                  setSelectedCities([]);
                  setSelectedCategories([]);
                  setPayFrom("");
                  setPayTo("");
                  setPage(1);
                  fetchJobs();
                }}
                color="red"
              />
            </View>

            <View style={{ marginBottom: 10 }}>
              <Button
                title="Close"
                onPress={() => setModalVisible(false)}
                color="gray"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  card: {
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  item: {
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  extraPading: {
    marginBottom: 20,
  },
});
