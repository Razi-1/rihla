import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { StudentTabNavigator } from './StudentTabNavigator';
import { TutorTabNavigator } from './TutorTabNavigator';
import { ParentTabNavigator } from './ParentTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading, accountType } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary.blue} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : accountType === 'tutor' ? (
        <Stack.Screen name="TutorMain" component={TutorTabNavigator} />
      ) : accountType === 'parent' ? (
        <Stack.Screen name="ParentMain" component={ParentTabNavigator} />
      ) : (
        <Stack.Screen name="StudentMain" component={StudentTabNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface.base,
  },
});
