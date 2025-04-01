import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAppTheme } from "@/lib/ThemeProvider";
import { colors } from "@/lib/colors";

export default function HomeScreen() {
  const [toastShown, setToastShown] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [newestJobs, setNewestJobs] = useState([]);
  const [localJobs, setLocalJobs] = useState([]);

  const { theme } = useAppTheme();
  const themeColors = colors[theme];

  React.useEffect(() => {
    const checkProfile = async () => {
      const profileString = await SecureStore.getItemAsync("userProfile");
      const profile = profileString ? JSON.parse(profileString) : null;
      if (profile && !toastShown) {
        Toast.show({
          type: "success",
          text1: `Welcome, ${profile.name || "user"}!`,
          position: "top",
          visibilityTime: 1000,
        });
        setToastShown(true);
      }
    };
    checkProfile();
  }, [toastShown]);

  const fetchData = async () => {
    try {
      const profileString = await SecureStore.getItemAsync("userProfile");
      const profile = profileString ? JSON.parse(profileString) : null;
      if (!profile) {
        return;
      }

      let categories = [];
      if (typeof profile.category === "string") {
        try {
          categories = JSON.parse(profile.category);
        } catch (e) {
          categories = profile.category
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
        }
      } else if (Array.isArray(profile.category)) {
        categories = profile.category;
      }
      const categoriesQuery = categories.join(",");
      const location = profile.location || "";

      const url = `http://92.49.5.242:5000/jobs?categories=${encodeURIComponent(
        categoriesQuery
      )}&location=${encodeURIComponent(location)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setRecommendedJobs(data.recommended || []);
      setNewestJobs(data.newest || []);
      setLocalJobs(data.local || []);
      Toast.show({
        type: "info",
        text1: "Fetched job listings",
        text2: "Recommended, newest, local",
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      Toast.show({
        type: "error",
        text1: "API Error",
        text2: error.message,
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const renderHorizontalList = (jobsArray) => (
    <ScrollView
      horizontal
      style={[
        styles.horizontalScroll,
        { backgroundColor: themeColors.background },
      ]}
    >
      {jobsArray.map((job) => (
        <TouchableOpacity
          key={job.id}
          onPress={() => {
            if (job.url) {
              Linking.openURL(job.url);
            }
          }}
          style={[styles.jobCard, { backgroundColor: themeColors.inputBg }]}
        >
          <ThemedText
            type="defaultSemiBold"
            style={{ marginBottom: 4, color: themeColors.text }}
          >
            {job.title}
          </ThemedText>
          <ThemedText style={{ color: themeColors.text }}>
            {job.company}
          </ThemedText>
          <ThemedText style={{ color: themeColors.text }}>
            {job.location}
          </ThemedText>
          <ThemedText style={{ color: themeColors.text }}>
            {job.category}
          </ThemedText>
          <ThemedText style={{ color: themeColors.text }}>
            {job.salary_type === "monthly"
              ? `Monthly: $${job.salary_min} - $${job.salary_max} (Equiv: $${job.monthly_equiv_min} - $${job.monthly_equiv_max})`
              : `Hourly: $${job.salary_min} - $${job.salary_max} (Equiv: $${job.hourly_equiv_min} - $${job.hourly_equiv_max})`}
          </ThemedText>
          {job.deadline && (
            <ThemedText style={{ fontSize: 12 }}>
              Deadline: {job.deadline}
            </ThemedText>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: themeColors.background, color: themeColors.text },
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      {recommendedJobs.length > 0 && (
        <ThemedView
          style={[
            styles.block,
            styles.container,
            {
              backgroundColor: themeColors.background,
              color: themeColors.text,
            },
          ]}
        >
          <ThemedText
            type="subtitle"
            style={[styles.topSpace, { color: themeColors.text }]}
          >
            Recommended For You
          </ThemedText>
          {renderHorizontalList(recommendedJobs)}
        </ThemedView>
      )}

      {newestJobs.length > 0 && (
        <ThemedView
          style={[
            styles.block,
            styles.container,
            {
              backgroundColor: themeColors.background,
              color: themeColors.text,
            },
          ]}
        >
          <ThemedText type="subtitle" style={[{ color: themeColors.text }]}>
            Newest Jobs
          </ThemedText>
          {renderHorizontalList(newestJobs)}
        </ThemedView>
      )}

      {localJobs.length > 0 && (
        <ThemedView
          style={[
            styles.block,
            styles.container,
            {
              backgroundColor: themeColors.background,
              color: themeColors.text,
            },
          ]}
        >
          <ThemedText type="subtitle" style={[{ color: themeColors.text }]}>
            Near You
          </ThemedText>
          {renderHorizontalList(localJobs)}
        </ThemedView>
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
    paddingBottom: 20,
  },
  block: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  horizontalScroll: {
    marginTop: 8,
  },
  jobCard: {
    width: 280,
    marginRight: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
  },
  topSpace: {
    marginTop: 20,
  },
});
