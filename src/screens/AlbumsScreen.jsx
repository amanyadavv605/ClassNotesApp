// AlbumScreen.jsx
import { useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Paragraph, Title, useTheme } from 'react-native-paper';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
export default function AlbumsScreen() {
  const route = useRoute();
  const { albumId } = route.params;
  const [album, setAlbum] = useState(null);
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const { data, error } = await supabase
          .from('albums')
          .select('*')
          .eq('id', albumId)
          .single();

        if (error) throw error;

        setAlbum(data);
      } catch (error) {
        console.error('Error fetching album:', error);
      }
    };

    fetchAlbum();
  }, [albumId]);

  if (!album) return null;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{album.title}</Title>
          <Paragraph>{album.description}</Paragraph>
        </Card.Content>
      </Card>
      <View style={styles.details}>
        <Paragraph>Created by: {user?.email || 'Unknown'}</Paragraph>
        <Paragraph>Created at: {new Date(album.created_at).toLocaleDateString()}</Paragraph>
      </View>
    </ScrollView>
  );
}