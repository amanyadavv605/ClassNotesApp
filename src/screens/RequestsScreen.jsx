import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  FAB,
  Modal,
  Paragraph,
  Portal,
  TextInput,
  Title,
  useTheme,
} from "react-native-paper";
import { supabase } from "../config/supabase";
import { useAuth } from "../context/AuthContext";

export default function RequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: "", description: "" });
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleAddRequest = async () => {
    if (!newRequest.title.trim()) {
      alert("Title is required");
      return;
    }

    try {
      const { error } = await supabase.from("requests").insert({
        title: newRequest.title,
        description: newRequest.description,
        user_id: user.id,
      });

      if (error) throw error;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📥 New Request: ${newRequest.title}`,
          body: newRequest.description || "No description",
        },
        trigger: null,
      });

      setNewRequest({ title: "", description: "" });
      setModalVisible(false);
      fetchRequests();
    } catch (err) {
      console.error("Error adding request:", err);
    }
  };

  const deleteRequest = async (requestUserId, requestId) => {
    if (user.id !== requestUserId) {
      Alert.alert("Unauthorized", "You can only delete your own requests.");
      return;
    }

    Alert.alert("Confirm Delete", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("requests")
              .delete()
              .eq("id", requestId);

            if (error) throw error;
            fetchRequests();
          } catch (err) {
            console.error("Error deleting request:", err);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {requests.map((request) => (
          <Card key={request.id} style={styles.card}>
            <Card.Content>
              <Title>{request.title}</Title>
              <Paragraph>{request.description}</Paragraph>
              {request.user_id === user.id && (
                <Button
                  textColor={theme.colors.error}
                  onPress={() => deleteRequest(request.user_id, request.id)}
                >
                  Delete
                </Button>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* FAB for making request */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setModalVisible(true)}
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
          <Title>Make a Request</Title>
          <TextInput
            label="Title"
            value={newRequest.title}
            onChangeText={(text) =>
              setNewRequest((prev) => ({ ...prev, title: text }))
            }
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Description"
            value={newRequest.description}
            onChangeText={(text) =>
              setNewRequest((prev) => ({ ...prev, description: text }))
            }
            multiline
            mode="outlined"
            style={styles.input}
          />
          <View style={styles.modalButtons}>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAddRequest}>
              Submit
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  modal: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
});
