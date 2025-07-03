// src/screens/UploadScreen.js
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  Paragraph,
  Snackbar,
  TextInput,
  Title,
  useTheme
} from 'react-native-paper';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export default function UploadScreen() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const theme = useTheme();

  const availableTags = [
    'Notes', 'Previous Papers', 'MST', 'Assignments'
  ];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
        setFileName(result.assets[0].name);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
        setFileName(result.assets[0].fileName || 'image.jpg');
      }
    } catch (err) {
      console.error('Error picking image:', err);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
        setFileName(`photo_${Date.now()}.jpg`);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const uploadFile = async () => {
    if (!selectedFile || !fileName.trim()) {
      setMessage('Please select a file and provide a name');
      return;
    }

    setUploading(true);
    try {
      // Upload file to Supabase storage
      const fileExt = selectedFile.name?.split('.').pop() || 'file';
      // const fileName = ``;
      
     
      const fileToUpload = {
        uri: selectedFile.uri,
        name: fileName,
        type: selectedFile.mimeType || 'application/octet-stream',
      };

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('notes')
        .upload(fileName, fileToUpload);


      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          name: fileName,
          original_name: selectedFile.name,
          description,
          tags: selectedTags,
          file_path: selectedFile.name,
          uploaded_by: user.full_name,
          user_id: user.id,
          file_type: selectedFile.mimeType,
          file_size: selectedFile.size,
        });

      if (dbError) throw dbError;

      setMessage('File uploaded successfully!');
      // Reset form
      setSelectedFile(null);
      setFileName('');
      setDescription('');
      setSelectedTags([]);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Failed to upload file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Upload Files</Title>
            
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={pickDocument}
                style={styles.button}
                icon="file-document"
              >
                Pick Document
              </Button>
              
              <Button
                mode="outlined"
                onPress={pickImage}
                style={styles.button}
                icon="image"
              >
                Pick Image
              </Button>
              
              <Button
                mode="outlined"
                onPress={takePhoto}
                style={styles.button}
                icon="camera"
              >
                Take Photo
              </Button>
            </View>

            {selectedFile && (
              <Card style={styles.selectedFileCard}>
                <Card.Content>
                  <Title>Selected File</Title>
                  <Paragraph>{selectedFile.name}</Paragraph>
                  <Paragraph>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Paragraph>
                </Card.Content>
              </Card>
            )}

            <TextInput
              label="File Name"
              value={fileName}
              onChangeText={setFileName}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
              mode="outlined"
            />

            <Title style={styles.tagsTitle}>Tags</Title>
            <View style={styles.tagsContainer}>
              {availableTags.map((tag) => (
                <Chip
                  key={tag}
                  selected={selectedTags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                  style={styles.chip}
                >
                  {tag}
                </Chip>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={uploadFile}
              loading={uploading}
              disabled={uploading || !selectedFile}
              style={styles.uploadButton}
            >
              Upload File
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={!!message}
        onDismiss={() => setMessage('')}
        duration={4000}
      >
        {message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  button: {
    marginBottom: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  selectedFileCard: {
    marginVertical: 16,
    backgroundColor: '#E8F5E8',
  },
  input: {
    marginBottom: 16,
  },
  tagsTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  uploadButton: {
    marginTop: 16,
  },
});