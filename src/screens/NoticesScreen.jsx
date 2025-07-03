import { FontAwesome } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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
import { summarizeImageWithGemini } from "../utils/summarizeImageWithGemini";

export default function NoticesScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [notices, setNotices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
  });
  const { user } = useAuth();
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
    fetchNotices();
  }, []);

  const pickImage = async () => {
    try {
      setUploading(true);
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

        const summary = await summarizeImageWithGemini(base64);
        setNewNotice((prev) => ({
          ...prev,
          content: summary,
        }));
        setUploading(false);
      } else {
        setSelectedImage(null);
      }
    } catch (err) {
      console.error("Error picking or summarizing image:", err);
    }
  };

  // const pickImage = async () => {
  //   try {
  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //       allowsEditing: true,
  //       quality: 0.8,
  //     });

  //     if (!result.canceled && result.assets && result.assets.length > 0) {
  //       setSelectedImage(result.assets[0]);
  //     } else {
  //       setSelectedImage(null);
  //     }
  //   } catch (err) {
  //     console.error("Error picking image:", err);
  //   }
  // };

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        setNotices(data || []);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotices();
    setRefreshing(false);
  };

  const deleteNotice = async (userId, id) => {
    try {
      if (user.id === userId) {
        const confirmation = await new Promise((resolve) => {
          Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to delete this notice?",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => resolve(true),
              },
            ]
          );
        });
        if (confirmation) {
          const { error } = await supabase
            .from("notices")
            .delete()
            .eq("id", id);
          if (!error) {
            fetchNotices();
          } else {
            console.error("Error deleting notice:", error);
          }
        }
      } else {
        alert("You can only delete your own notices.");
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
    }
  };

  const openImage = async (url) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error("Failed to open image:", error);
    }
  };

  const addNotice = async () => {
    if (!newNotice.title.trim()) {
      alert("Title is required.");
      return;
    }

    const hasContent = !!newNotice.content.trim();
    const hasImage = !!selectedImage;

    if (!hasContent && !hasImage) {
      alert("Please provide either content or an image.");
      return;
    }

    let imageUrl = null;
    setUploading(true);
    try {
      if (selectedImage) {
        const filename = `notice-${Date.now()}.jpg`;
        const fileToUpload = {
          uri: selectedImage.uri,
          name: filename,
          type: selectedImage.mimeType || "application/octet-stream",
        };
        const { error: uploadError } = await supabase.storage
          .from("notes")
          .upload(filename, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("notes")
          .getPublicUrl(filename);

        if (urlData && urlData.publicUrl) {
          imageUrl = urlData.publicUrl;
        }
      }

      const { error: dbError } = await supabase.from("notices").insert({
        title: newNotice.title,
        content: newNotice.content,
        image_url: imageUrl,
        posted_by: user.email,
        user_id: user.id,
      });

      if (!dbError) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🆕 ${newNotice.title}`,
            body: newNotice.content,
          },
          trigger: null,
        });

        setNewNotice({ title: "", content: "" });
        setSelectedImage(null);
        setModalVisible(false);
        fetchNotices();
      }
      setUploading(false);
    } catch (error) {
      console.error("Error adding notice:", error);
      setUploading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notices.map((notice, index) => (
          <Card key={index} style={styles.noticeCard}>
            <Card.Content>
              {notice.image_url && (
                <TouchableOpacity onPress={() => openImage(notice.image_url)}>
                  <Card.Cover
                    source={{ uri: notice.image_url }}
                    style={{ marginTop: 10, borderRadius: 8 }}
                  />
                </TouchableOpacity>
              )}
              <Title>{notice.title}</Title>
              <Paragraph style={styles.content}>{notice.content}</Paragraph>
              <Paragraph style={styles.metadata}>
                Posted by: {notice.posted_by}
              </Paragraph>
              <Paragraph style={styles.metadata}>
                {new Date(notice.created_at).toLocaleDateString()}
              </Paragraph>
              <Button
                textColor={theme.colors.error}
                onPress={() => deleteNotice(notice.user_id, notice.id)}
              >
                <FontAwesome
                  name="trash"
                  size={20}
                  color={theme.colors.error}
                />{" "}
                Delete Notice
              </Button>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

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
          <Title>Add Notice</Title>
          <TextInput
            label="Title"
            value={newNotice.title}
            onChangeText={(text) => setNewNotice({ ...newNotice, title: text })}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Content"
            value={newNotice.content}
            onChangeText={(text) =>
              setNewNotice({ ...newNotice, content: text })
            }
            multiline
            numberOfLines={4}
            style={styles.input}
            mode="outlined"
          />
          {/* <Button
            mode="outlined"
            onPress={pickImage}
            icon="image"
            style={styles.input}
          >
            {selectedImage !== null ? "Change Image" : "Pick Image"}
          </Button> */}
          <Button
            mode="outlined"
            icon="robot"
            style={styles.input}
            onPress={() => pickImage()}
          >
            Scan Image
          </Button>

          <View style={styles.modalButtons}>
            <Button
              onPress={() => {
                setModalVisible(false);
                setNewNotice({ title: "", content: "" });
                setSelectedImage(null);
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={addNotice}
              loading={uploading}
              disabled={
                uploading ||
                !newNotice.title.trim() ||
                (!newNotice.content.trim() && !selectedImage)
              }
            >
              Add
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
  },
  noticeCard: {
    margin: 12,
    borderRadius: 12,
    elevation: 2,
  },
  content: {
    marginVertical: 8,
  },
  metadata: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
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
