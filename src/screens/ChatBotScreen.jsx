// ChatBotScreen.jsx
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
    Button,
    Card,
    Paragraph,
    TextInput,
    Title,
    useTheme,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { chatWithGemini } from "../utils/chatWithGemini";
export default function ChatBotScreen() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { user } = useAuth();

  const handleChat = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const answer = await chatWithGemini(query);
      setResponse(answer);
    } catch (error) {
      console.error("Error chatting with Gemini:", error);
      setResponse("Sorry, I could not process your request.");
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Chat with AI</Title>
      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Ask a question"
            value={query}
            onChangeText={setQuery}
            mode="outlined"
            style={styles.input}
            multiline
          />
          <Button
            mode="contained"
            onPress={handleChat}
            loading={loading}
            disabled={loading || !query.trim()}
            style={styles.button}
          >
            Send
          </Button>
          {response ? (
            <Paragraph style={styles.response}>{response}</Paragraph>
          ) : (
            <Paragraph style={styles.placeholder}>
              Your response will appear here...
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  response: {
    marginTop: 16,
    color: "#333",
  },
  placeholder: {
    marginTop: 16,
    color: "#888",
  },
});
