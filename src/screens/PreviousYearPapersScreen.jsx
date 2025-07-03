// src/screens/PreviousYearPapersScreen.js
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
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

export default function PreviousYearPapersScreen() {
  const [papers, setPapers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYears, setSelectedYears] = useState([]);
  const [menuVisible, setMenuVisible] = useState({});
  const theme = useTheme();

  const years = ['2024', '2023', '2022', '2021', '2020'];

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .contains('tags', ['Previous Papers'])
        .order('created_at', { ascending: false });

      if (!error) {
        setPapers(data || []);
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPapers();
    setRefreshing(false);
  };

  const toggleYear = (year) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const downloadFile = async (file) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(file.file_path);

      if (error) throw error;

      const fileUri = FileSystem.documentDirectory + file.original_name;
      await FileSystem.writeAsStringAsync(fileUri, data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const shareFile = async (file) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .createSignedUrl(file.file_path, 3600);

      if (error) throw error;

      await Sharing.shareAsync(data.signedUrl);
    } catch (error) {
      console.error('Error sharing file:', error);
    }
  };

  const filteredPapers = papers.filter(paper => {
    const matchesSearch = paper.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         paper.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = selectedYears.length === 0 || selectedYears.some(year => 
      paper.original_name.includes(year) || paper.description?.includes(year)
    );
    return matchesSearch && matchesYear;
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
        placeholder="Search previous year papers..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.yearsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {years.map((year) => (
            <Chip
              key={year}
              selected={selectedYears.includes(year)}
              onPress={() => toggleYear(year)}
              style={styles.chip}
            >
              {year}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredPapers.map((paper, index) => (
          <Card key={index} style={styles.paperCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={styles.paperTitle} numberOfLines={1}>
                  {paper.original_name}
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
                      downloadFile(paper);
                      closeMenu(index);
                    }}
                    title="Download"
                    leadingIcon="download"
                  />
                  <Menu.Item
                    onPress={() => {
                      shareFile(paper);
                      closeMenu(index);
                    }}
                    title="Share"
                    leadingIcon="share"
                  />
                </Menu>
              </View>
              
              {paper.description && (
                <Paragraph style={styles.description}>{paper.description}</Paragraph>
              )}
              
              <Paragraph style={styles.metadata}>
                Uploaded by: {paper.uploaded_by}
              </Paragraph>
              <Paragraph style={styles.metadata}>
                {new Date(paper.created_at).toLocaleDateString()}
              </Paragraph>
              
              {paper.tags && (
                <View style={styles.fileTagsContainer}>
                  {paper.tags.map((tag, tagIndex) => (
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
  yearsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
  },
  paperCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paperTitle: {
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