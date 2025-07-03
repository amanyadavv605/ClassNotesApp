import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    View
} from "react-native";
import {
    Button,
    Card,
    FAB,
    Modal,
    Paragraph,
    Portal,
    Text,
    Title,
    useTheme
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { solutionsWithGemini } from "../utils/solutionsWithGemini";

export default function ScanAnswersScreen() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [aiAnswer, setAiAnswer] = useState("");
  const theme = useTheme();
  const { user } = useAuth();

  // Load user's scans from local state or backend (if you want persistence)
  useEffect(() => {
    // Optionally, fetch scans from backend here
  }, []);

  // Add a new scan (image + AI answer)
  const handleAddScan = async () => {
    setModalVisible(true);
    setSelectedImage(null);
    setAiAnswer("");
  };

  // Pick image and analyze with Gemini
  const analyzeImage = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        setSelectedImage(selected);

        const base64 = await FileSystem.readAsStringAsync(selected.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const answer = await solutionsWithGemini(base64);
        setAiAnswer(answer);

        // Save scan to state (or backend)
        setScans((prev) => [
          ...prev,
          {
            id: Date.now(),
            userId: user.id,
            imageUri: selected.uri,
            answer,
          },
        ]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to analyze image.");
    }
    setLoading(false);
    setModalVisible(false);
  };

  // Delete a scan
  const handleDeleteScan = (id) => {
    Alert.alert("Delete", "Delete this scan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setScans((prev) => prev.filter((s) => s.id !== id)),
      },
    ]);
  };

  // Only show user's own scans
  const userScans = scans.filter((s) => s.userId === user.id);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        {userScans.length === 0 && (
          <Text style={{ textAlign: "center", marginTop: 40, color: theme.colors.onSurface }}>
            No scanned answers yet. Tap + to scan!
          </Text>
        )}
        {userScans.map((scan) => (
          <Card key={scan.id} style={styles.card}>
            <Card.Title
              title="Scanned Answer"
              right={(props) => (
                <Button
                  icon="delete"
                  textColor={theme.colors.error}
                  onPress={() => handleDeleteScan(scan.id)}
                  compact
                >
                  Delete
                </Button>
              )}
            />
            <Card.Content>
              <Image
                source={{ uri: scan.imageUri }}
                style={styles.image}
                resizeMode="contain"
              />
              <Paragraph style={styles.answerLabel}>AI Answer:</Paragraph>
              <Paragraph style={styles.answerText}>{scan.answer}</Paragraph>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddScan}
        color={theme.colors.onPrimary}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Title>Scan for Answers</Title>
          <Button
            mode="contained"
            onPress={analyzeImage}
            loading={loading}
            disabled={loading}
            style={{ marginVertical: 16 }}
          >
            {loading ? "Analyzing..." : "Analyze File"}
          </Button>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    margin: 12,
    borderRadius: 12,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 200,
    marginVertical: 10,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  answerLabel: {
    marginTop: 8,
    fontWeight: "bold",
  },
  answerText: {
    marginTop: 4,
    color: "#333",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    margin: 20,
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
});