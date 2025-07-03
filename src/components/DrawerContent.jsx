// src/components/DrawerContent.js
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { StyleSheet, View } from 'react-native';
import {
  Avatar,
  Caption,
  Drawer,
  Switch,
  Text,
  Title,
  TouchableRipple,
  useTheme
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme as useAppTheme } from '../context/ThemeContext';

export default function DrawerContent(props) {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const paperTheme = useTheme();

  return (
    <View style={[styles.drawerContent, { backgroundColor: paperTheme.colors.background}]}>
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerContent}>
          <View style={styles.userInfoSection}>
            <View style={styles.userInfo}>
              <Avatar.Text
                size={50}
                label={user?.user_metadata?.full_name?.charAt(0) || 'U'}
              />
              <View style={styles.userDetails}>
                <Title style={styles.title}>
                  {user?.user_metadata?.full_name || 'User'}
                </Title>
                <Caption ellipsizeMode="tail" numberOfLines={1} style={styles.caption}>{user?.email}</Caption>
              </View>
            </View>
          </View>

          <Drawer.Section style={styles.drawerSection}>
            <DrawerItemList {...props}/>
          </Drawer.Section>

          <Drawer.Section title="Preferences">
            <TouchableRipple onPress={toggleTheme}>
              <View style={styles.preference}>
                <Text>Dark Theme</Text>
                <View pointerEvents="none">
                  <Switch value={isDarkMode} />
                </View>
              </View>
            </TouchableRipple>
          </Drawer.Section>
        </View>
      </DrawerContentScrollView>

      <Drawer.Section style={styles.bottomDrawerSection}>
        <Drawer.Item
          icon="exit-to-app"
          label="Sign Out"
          onPress={signOut}
        />
      </Drawer.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  userDetails: {
    marginLeft: 15,
    flexDirection: 'column',
  },
  title: {
    fontSize: 16,
    marginTop: 3,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 15,
    flex: 1,
    flexWrap: 'wrap',
  },
  drawerSection: {
    marginTop: 15,
  },
  bottomDrawerSection: {
    marginBottom: 15,
    borderTopColor: '#f4f4f4',
    borderTopWidth: 1,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});