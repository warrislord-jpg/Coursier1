import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

import { StoreProvider, useStore, statusLabel } from './lib/store';
import { AuthProvider, useAuth } from './lib/auth';
import { colors } from './lib/theme';

// Rôle client
import HomeScreen from './screens/HomeScreen';
import RestaurantsScreen from './screens/RestaurantsScreen';
import RestaurantDetailScreen from './screens/RestaurantDetailScreen';
import CartScreen from './screens/CartScreen';
import ColisScreen from './screens/ColisScreen';
import CourseScreen from './screens/CourseScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import OrdersScreen from './screens/OrdersScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PrivacyScreen from './screens/PrivacyScreen';

// Portail et rôles pro
import RoleGateScreen from './screens/RoleGateScreen';
import CourierHomeScreen from './screens/courier/CourierHomeScreen';
import CourierOrderScreen from './screens/courier/CourierOrderScreen';
import RestaurantDashScreen from './screens/restaurant/RestaurantDashScreen';
import RestaurantMenuScreen from './screens/restaurant/RestaurantMenuScreen';
import AdminDashScreen from './screens/admin/AdminDashScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  Accueil: { on: 'home', off: 'home-outline' },
  RestosTab: { on: 'restaurant', off: 'restaurant-outline' },
  Colis: { on: 'cube', off: 'cube-outline' },
  Course: { on: 'walk', off: 'walk-outline' },
  Commandes: { on: 'receipt', off: 'receipt-outline' },
  Profil: { on: 'person', off: 'person-outline' },
};

function OrdersBadge() {
  const { orders } = useStore();
  const active = orders.filter((o) => !statusLabel(o).done).length;
  if (active === 0) return null;
  return (
    <View style={st.badge}>
      <Text style={st.badgeText}>{active > 9 ? '9+' : active}</Text>
    </View>
  );
}

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => (
          <View>
            <Ionicons
              name={focused ? ICONS[route.name].on : ICONS[route.name].off}
              size={size - 2}
              color={color}
            />
            {route.name === 'Commandes' && <OrdersBadge />}
          </View>
        ),
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="RestosTab" component={RestaurantsScreen} options={{ title: 'Restos' }} />
      <Tab.Screen name="Colis" component={ColisScreen} />
      <Tab.Screen name="Course" component={CourseScreen} options={{ title: 'Missions' }} />
      <Tab.Screen name="Commandes" component={OrdersScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary },
};

function ClientApp() {
  const { onboarded } = useStore();
  if (!onboarded) return <OnboardingScreen />;
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={ClientTabs} />
        <Stack.Screen name="Restaurant" component={RestaurantDetailScreen} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function CourierApp() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CourierHome" component={CourierHomeScreen} />
        <Stack.Screen name="CourierOrder" component={CourierOrderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function RestaurantApp() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RestaurantDash" component={RestaurantDashScreen} />
        <Stack.Screen name="RestaurantMenu" component={RestaurantMenuScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AdminApp() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminDash" component={AdminDashScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Routage strict par rôle : chaque espace est isolé.
// Un rôle ne peut JAMAIS atteindre les écrans d'un autre rôle.
function Root() {
  const { role, ready } = useAuth();
  if (!ready) return null;
  if (!role) return <RoleGateScreen />;
  if (role === 'courier') return <CourierApp />;
  if (role === 'restaurant') return <RestaurantApp />;
  if (role === 'admin') return <AdminApp />;
  return <ClientApp />;
}

export default function App() {
  // Preload icon fonts for web - required for icons to display correctly
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StoreProvider>
          <Root />
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '800' },
});
