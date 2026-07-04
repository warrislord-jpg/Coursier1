import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

import { StoreProvider } from './lib/store';
import { AuthProvider, useAuth } from './lib/auth';
import { colors, radius, shadow } from './lib/theme';

import CourierHomeScreen from './screens/courier/CourierHomeScreen';
import CourierOrderScreen from './screens/courier/CourierOrderScreen';

const Stack = createNativeStackNavigator();
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary },
};

function CourierLoginScreen() {
  const { loginCourier } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    setError('');
    const res = loginCourier(username.trim(), pin);
    if (!res.ok) setError(res.error ?? 'Connexion refusée');
  };

  return (
    <SafeAreaView style={st.loginRoot}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={st.loginCard}>
          <View style={[st.loginBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="bicycle" size={28} color="#fff" />
          </View>
          <Text style={st.loginTitle}>Espace Livreur</Text>
          <Text style={st.loginSub}>Connectez-vous avec votre identifiant et votre PIN.</Text>

          <Text style={st.label}>Identifiant</Text>
          <TextInput
            value={username} onChangeText={setUsername}
            autoCapitalize="none" autoCorrect={false}
            placeholder="ex. jeanbosco" placeholderTextColor={colors.textMuted}
            style={st.input}
          />
          <Text style={st.label}>PIN</Text>
          <TextInput
            value={pin} onChangeText={setPin}
            keyboardType="number-pad" secureTextEntry maxLength={6}
            placeholder="••••" placeholderTextColor={colors.textMuted}
            style={st.input}
          />
          {error ? <Text style={st.error}>{error}</Text> : null}
          <Pressable onPress={submit} style={[st.submit, { backgroundColor: colors.accent }]}>
            <Text style={st.submitTxt}>Se connecter</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CourierRoot() {
  const { role, ready } = useAuth();
  if (!ready) return null;
  if (role !== 'courier') return <CourierLoginScreen />;
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

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StoreProvider>
          <CourierRoot />
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  loginRoot: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loginCard: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: radius.lg, padding: 24, ...shadow },
  loginBadge: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16,
  },
  loginTitle: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  loginSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, backgroundColor: '#FAFAFA',
  },
  error: { color: colors.danger, fontSize: 12.5, marginTop: 10 },
  submit: { borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  submitTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
