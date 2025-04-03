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
  ActivityIndicator,
} from "react-native";
import { useAppTheme } from "@/lib/ThemeProvider";
import { WebView } from "react-native-webview";
import { colors } from "@/lib/colors";

export default function ChatApp() {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { theme } = useAppTheme();
  const themeColors = colors[theme];

  const fetchWithTimeout = (url, options, timeout = 10000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeout)
      ),
    ]);
  };

  const sendMessage = async () => {
    if (!userMessage) return;
    const newMessages = [
      ...messages,
      { sender: "user", type: "text", content: userMessage },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetchWithTimeout("http://92.49.5.242:5001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      console.log("Received data:", data);
      const botMessage = {
        sender: "bot",
        type: data.responseType,
        content: data,
      };
      setMessages([...newMessages, botMessage]);
    } catch (error) {
      console.error("Error contacting backend:", error);
      setMessages([
        ...newMessages,
        { sender: "bot", type: "error", content: "Error: " + error.message },
      ]);
    } finally {
      setLoading(false);
    }
    setUserMessage("");
  };

  const renderJobItem = (job, i) => {
    if (job.title) {
      return (
        <TouchableOpacity
          key={i}
          onPress={() => {
            if (job.url) {
              Linking.openURL(job.url);
            }
          }}
        >
          <View style={[styles.card, { backgroundColor: themeColors.inputBg }]}>
            <Text style={[styles.cardText, { color: themeColors.text }]}>
              <Text style={styles.cardLabel}>Title: </Text>
              {job.title || "N/A"}
            </Text>
            <Text style={[styles.cardText, { color: themeColors.text }]}>
              <Text style={styles.cardLabel}>Company: </Text>
              {job.company || "N/A"}
            </Text>
            <Text style={[styles.cardText, { color: themeColors.text }]}>
              <Text style={styles.cardLabel}>Location: </Text>
              {job.location || "N/A"}
            </Text>
            <Text style={[styles.cardText, { color: themeColors.text }]}>
              <Text style={styles.cardLabel}>Category: </Text>
              {job.category || "N/A"}
            </Text>
            <Text style={[styles.cardText, { color: themeColors.text }]}>
              <Text style={styles.cardLabel}>Salary: </Text>
              {job.salary_type || ""}: {job.salary_min || "?"} -{" "}
              {job.salary_max || "?"}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else if (
      job.job_count !== undefined ||
      job.number_of_jobs !== undefined
    ) {
      const jobCount = job.job_count || job.number_of_jobs;
      return (
        <View
          key={i}
          style={[styles.card, { backgroundColor: themeColors.inputBg }]}
        >
          <Text style={[styles.cardText, { color: themeColors.text }]}>
            <Text style={styles.cardLabel}>Category: </Text>
            {job.category || "N/A"}
          </Text>
          <Text style={[styles.cardText, { color: themeColors.text }]}>
            <Text style={styles.cardLabel}>Job Count: </Text>
            {jobCount}
          </Text>
          {job.proportion && (
            <Text style={[styles.cardText, { color: themeColors.text }]}>
              <Text style={styles.cardLabel}>Proportion: </Text>
              {job.proportion}
            </Text>
          )}
          {job.total_jobs_in_riga && (
            <Text style={[styles.cardText, { color: themeColors.text }]}>
              <Text style={styles.cardLabel}>Total in Riga: </Text>
              {job.total_jobs_in_riga}
            </Text>
          )}
        </View>
      );
    } else {
      return (
        <Text key={i} style={[styles.botText, { color: themeColors.text }]}>
          {JSON.stringify(job, null, 2)}
        </Text>
      );
    }
  };

  const renderMessage = (message, index) => {
    if (message.sender === "user") {
      return (
        <View
          key={index}
          style={[styles.userBubble, { backgroundColor: themeColors.link }]}
        >
          <Text style={[styles.userText, { color: "white" }]}>
            {message.content}
          </Text>
        </View>
      );
    } else if (message.sender === "bot") {
      if (message.type === "graph") {
        return (
          <View
            key={index}
            style={[styles.botBubble, { backgroundColor: themeColors.inputBg }]}
          >
            <Text style={[styles.botText, { color: themeColors.text }]}>
              SQL Query: {message.content.sqlQuery}
            </Text>
            {message.content.graph ? (
              <View style={{ height: 300, marginVertical: 10 }}>
                <WebView
                  originWhitelist={["*"]}
                  source={{
                    html: `<html>
                      <head>
                        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
                      </head>
                      <body>
                        <div id="plotly-div" style="width:100%;height:100%;"></div>
                        <script>
                          var fig = ${message.content.graph};
                          Plotly.newPlot('plotly-div', fig.data, fig.layout);
                        </script>
                      </body>
                    </html>`,
                  }}
                />
              </View>
            ) : (
              <Text style={[styles.botText, { color: themeColors.text }]}>
                No graph available
              </Text>
            )}
          </View>
        );
      } else if (message.type === "job") {
        return (
          <View
            key={index}
            style={[styles.botBubble, { backgroundColor: themeColors.inputBg }]}
          >
            <Text style={[styles.botText, { color: themeColors.text }]}>
              SQL Query: {message.content.sqlQuery}
            </Text>
            {Array.isArray(message.content.reply) &&
            message.content.reply.length > 0 ? (
              message.content.reply.map((job, i) => renderJobItem(job, i))
            ) : (
              <Text style={[styles.botText, { color: themeColors.text }]}>
                No job data returned
              </Text>
            )}
          </View>
        );
      } else if (message.type === "combined") {
        return (
          <View
            key={index}
            style={[styles.botBubble, { backgroundColor: themeColors.inputBg }]}
          >
            <Text style={[styles.botText, { color: themeColors.text }]}>
              SQL Query: {message.content.sqlQuery}
            </Text>
            {Array.isArray(message.content.reply) &&
            message.content.reply.length > 0 ? (
              message.content.reply.map((job, i) => renderJobItem(job, i))
            ) : (
              <Text style={[styles.botText, { color: themeColors.text }]}>
                No job data returned
              </Text>
            )}
            {message.content.graph ? (
              <View style={{ height: 300, marginVertical: 10 }}>
                <WebView
                  originWhitelist={["*"]}
                  source={{
                    html: `<html>
                      <head>
                        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
                      </head>
                      <body>
                        <div id="plotly-div" style="width:100%;height:100%;"></div>
                        <script>
                          var fig = ${message.content.graph};
                          Plotly.newPlot('plotly-div', fig.data, fig.layout);
                        </script>
                      </body>
                    </html>`,
                  }}
                />
              </View>
            ) : (
              <Text style={[styles.botText, { color: themeColors.text }]}>
                No graph available
              </Text>
            )}
          </View>
        );
      } else if (message.type === "text" || message.type === "error") {
        return (
          <View
            key={index}
            style={[styles.botBubble, { backgroundColor: themeColors.inputBg }]}
          >
            <Text style={[styles.botText, { color: themeColors.text }]}>
              {typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content, null, 2)}
            </Text>
          </View>
        );
      }
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView
        style={[
          styles.chatContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        {messages.map((msg, index) => renderMessage(msg, index))}
      </ScrollView>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={themeColors.link} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Loading...
          </Text>
        </View>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: themeColors.inputBg,
            borderColor: themeColors.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: themeColors.text, borderColor: themeColors.border },
          ]}
          value={userMessage}
          onChangeText={setUserMessage}
          placeholder="Type your message..."
          placeholderTextColor={themeColors.text}
        />
        <Button title="Send" onPress={sendMessage} color={themeColors.link} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    padding: 10,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    marginRight: 10,
  },
  userBubble: {
    alignSelf: "flex-end",
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  botBubble: {
    alignSelf: "flex-start",
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  botText: {
    marginBottom: 5,
  },
  card: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 6,
  },
  cardText: {
    marginBottom: 2,
  },
  cardLabel: {
    fontWeight: "bold",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 70,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});
