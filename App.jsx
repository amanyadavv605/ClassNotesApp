// App.js
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { darkTheme, lightTheme } from './src/theme/theme';

// Screens
// import AlbumsScreen from './src/screens/AlbumsScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
// import MSTScreen from './src/screens/MSTScreen';
import ChatBotScreen from './src/screens/ChatBotScreen';
import NotesScreen from './src/screens/NotesScreen';
import NoticesScreen from './src/screens/NoticesScreen';
import PreviousYearPapersScreen from './src/screens/PreviousYearPapersScreen';
import RequestsScreen from './src/screens/RequestsScreen';
import Solutions from './src/screens/SolutionsScreen';
import UploadScreen from './src/screens/UploadScreen';
// import VotingScreen from './src/screens/VotingScreen';
// Components
import DrawerContent from './src/components/DrawerContent';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerStyle: {
          width: 340,
        },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Notices" component={NoticesScreen} />
      <Drawer.Screen name="Notes" component={NotesScreen} />
      <Drawer.Screen name="Requests" component={RequestsScreen} />
      <Drawer.Screen name="Solutions" component={Solutions} />
      <Drawer.Screen name="Previous Year Papers" component={PreviousYearPapersScreen} />
      <Drawer.Screen name="Chat Bot" component={ChatBotScreen} />
      <Drawer.Screen name="Upload" component={UploadScreen} />
      {/* <Drawer.Screen name="MST Papers" component={MSTScreen} /> */}
      {/* <Drawer.Screen name="Voting" component={VotingScreen} /> */}
      {/* <Drawer.Screen name="Albums" component={AlbumsScreen} /> */}
    </Drawer.Navigator>
  );
}

function AppContent() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  
  return (
    <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <NavigationContainer>
        {user ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <StatusBar style="dark" />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}