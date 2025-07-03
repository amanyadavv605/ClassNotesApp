// src/screens/NotesScreen.js
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import {
  Card,
  Chip,
  IconButton,
  Menu,
  Paragraph,
  Searchbar,
  Title,
  useTheme,
} from 'react-native-paper';
import { supabase } from '../config/supabase';

export default function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [menuVisible, setMenuVisible] = useState({});
  const theme = useTheme();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .contains('tags', ['Notes'])
        .order('created_at', { ascending: false });

      if (!error) {
        setNotes(data || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  
  const downloadFile = async (file) => {
    try {
      const { data, error } = await supabase.storage
        .from('notes')
        .download(file.file_path);
  
      if (error) throw error;
  
      // Convert data (Blob) to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];
        const fileUri = FileSystem.documentDirectory + file.original_name;
        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Sharing.shareAsync(fileUri);
      };
      reader.readAsDataURL(data);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
};

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => 
      note.tags?.includes(tag)
    );
    return matchesSearch && matchesTags;
  });

  const openMenu = (index) => {
    setMenuVisible({ ...menuVisible, [index]: true });
  };

  const closeMenu = (index) => {
    setMenuVisible({ ...menuVisible, [index]: false });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search notes..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredNotes.map((note, index) => (
          <Card key={index} style={styles.noteCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={styles.noteTitle} numberOfLines={1}>
                  {note.original_name}
                </Title>
                <Menu
                  visible={menuVisible[index]}
                  onDismiss={() => closeMenu(index)}
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      onPress={() => openMenu(index)}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      downloadFile(note);
                      closeMenu(index);
                    }}
                    title="Download"
                    leadingIcon="download"
                  />
                </Menu>
              </View>
              
              {note.description && (
                <Paragraph style={styles.description}>{note.description}</Paragraph>
              )}
              
              <Paragraph style={styles.metadata}>
                Uploaded by: {note.uploaded_by}
              </Paragraph>
              <Paragraph style={styles.metadata}>
                {new Date(note.created_at).toLocaleDateString()}
              </Paragraph>
              
              {note.tags && (
                <View style={styles.fileTagsContainer}>
                  {note.tags.map((tag, tagIndex) => (
                    <Chip key={tagIndex} compact style={styles.fileTag}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
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
  noteCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteTitle: {
    flex: 1,
  },
  description: {
    marginVertical: 8,
  },
  metadata: {
    fontSize: 12,
    opacity: 0.7,
  },
  fileTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  fileTag: {
    marginRight: 4,
    marginBottom: 4,
  },
});