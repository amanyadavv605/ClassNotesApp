// src/screens/HomeScreen.js
import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  FAB,
  Paragraph,
  Searchbar,
  Title,
  useTheme,
} from "react-native-paper";
import { supabase } from "../config/supabase";
import { darkTheme as theme } from "../theme/theme";

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentFiles, setRecentFiles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const theme = useTheme();

  const tags = [
    "Notes",
    "Previous Papers",
    "MST",
    "Assignments",
    "Lab Reports",
  ];

  useEffect(() => {
    fetchRecentFiles();
  }, []);

  const fetchRecentFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error) {
        setRecentFiles(data || []);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const viewFile = async (filePath) => {
    const { data, error } = await supabase.storage
      .from("notes")
      .getPublicUrl(filePath);

    if (error) {
      console.error("Error downloading file:", error);
    } else {
      Linking.openURL(data.publicUrl);
    }
  };

  const downloadFile = async (filePath) => {
    const { data, error } = await supabase.storage
      .from("notes")
      .getPublicUrl(filePath);

    if (error) {
      console.error("Error downloading file:", error);
    } else {
      Linking.openURL(data.publicUrl + `?download=${filePath}`);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentFiles();
    setRefreshing(false);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredFiles = recentFiles.filter((file) => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => file.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Searchbar
          placeholder="Search files..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.tagsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                selected={selectedTags.includes(tag)}
                onPress={() => toggleTag(tag)}
                style={styles.chip}
              >
                {tag}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <Title style={styles.sectionTitle}>Recent Files</Title>

        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Title>Quick Actions</Title>
            <View style={styles.quickActions}>
              <Card
                style={styles.actionCard}
                onPress={() => navigation.navigate("Upload")}
              >
                <Card.Content>
                  <Paragraph>Upload Files</Paragraph>
                </Card.Content>
              </Card>
              <Card
                style={styles.actionCard}
                onPress={() => navigation.navigate("Notices")}
              >
                <Card.Content>
                  <Paragraph>View Notices</Paragraph>
                </Card.Content>
              </Card>
            </View>
          </Card.Content>
        </Card>

        {filteredFiles.map((file, index) => (
          <Card key={index} style={styles.fileCard}>
            <Card.Content>
              <Title numberOfLines={1}>{file.name}</Title>
              <Paragraph>Uploaded by: {file.uploaded_by}</Paragraph>
              <Paragraph>
                {new Date(file.created_at).toLocaleDateString()}
              </Paragraph>
              {file.tags && (
                <View style={styles.fileTagsContainer}>
                  {file.tags.map((tag, tagIndex) => (
                    <Chip key={tagIndex} compact style={styles.fileTag}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}
              <View style={styles.buttonWrapper}>
              <Button
                style={styles.view}
                onPress={() =>
                  file.file_path
                    ? viewFile(file.file_path)
                    : error("File path is not available")
                }
              >
                <FontAwesome
                  name="eye"
                  size={12}
                  color={theme.colors.primary}
                />
                {" View"}
              </Button>
              <Button
                style={styles.download}
                onPress={() =>
                  file.file_path
                    ? downloadFile(file.file_path)
                    : error("File path is not available")
                }
              >
                <FontAwesome
                  name="download"
                  size={12}
                  color={theme.colors.primary}
                />
                {" Download"}
              </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("Upload")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchbar: {
    margin: 16,
  },
  tagsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  fileCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  fileTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  fileTag: {
    marginRight: 4,
    marginBottom: 4,
  },
  quickActionsCard: {
    margin: 16,
    backgroundColor: theme.colors.primary,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  download: {
    fontSize: 14,
    diplay: "flex",
  },
  view: {
    fontSize: 14,
    diplay: "flex",
  },
  buttonWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
});
