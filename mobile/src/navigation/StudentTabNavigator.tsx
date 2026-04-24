import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, CalendarDays, MessageSquare, User } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import {
  StudentTabParamList,
  StudentHomeStackParamList,
  StudentSearchStackParamList,
  StudentCalendarStackParamList,
  StudentMessagesStackParamList,
  StudentProfileStackParamList,
} from './types';

import { StudentDashboardScreen } from '../screens/student/DashboardScreen';
import { TutorSearchScreen } from '../screens/student/TutorSearchScreen';
import { TutorProfileScreen } from '../screens/student/TutorProfileScreen';
import { ClassDetailScreen } from '../screens/student/ClassDetailScreen';
import { ClassInviteScreen } from '../screens/student/ClassInviteScreen';
import { StudentProfileScreen } from '../screens/student/ProfileScreen';
import { CalendarScreen } from '../screens/shared/CalendarScreen';
import { ChatListScreen } from '../screens/shared/ChatListScreen';
import { ChatConversationScreen } from '../screens/shared/ChatConversationScreen';
import { AIAssistantScreen } from '../screens/shared/AIAssistantScreen';
import { VideoCallScreen } from '../screens/shared/VideoCallScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { QRScannerScreen } from '../screens/student/QRScannerScreen';

const Tab = createBottomTabNavigator<StudentTabParamList>();
const HomeStack = createNativeStackNavigator<StudentHomeStackParamList>();
const SearchStack = createNativeStackNavigator<StudentSearchStackParamList>();
const CalendarStack = createNativeStackNavigator<StudentCalendarStackParamList>();
const MessagesStack = createNativeStackNavigator<StudentMessagesStackParamList>();
const ProfileStack = createNativeStackNavigator<StudentProfileStackParamList>();

const stackScreenOptions = { headerShown: false, animation: 'slide_from_right' as const };

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
      <HomeStack.Screen name="ClassDetail" component={ClassDetailScreen} />
      <HomeStack.Screen name="ClassInvite" component={ClassInviteScreen} />
      <HomeStack.Screen name="TutorProfile" component={TutorProfileScreen} />
    </HomeStack.Navigator>
  );
}

function SearchStackScreen() {
  return (
    <SearchStack.Navigator screenOptions={stackScreenOptions}>
      <SearchStack.Screen name="TutorSearch" component={TutorSearchScreen} />
      <SearchStack.Screen name="TutorProfile" component={TutorProfileScreen} />
    </SearchStack.Navigator>
  );
}

function CalendarStackScreen() {
  return (
    <CalendarStack.Navigator screenOptions={stackScreenOptions}>
      <CalendarStack.Screen name="Calendar" component={CalendarScreen} />
      <CalendarStack.Screen name="ClassDetail" component={ClassDetailScreen} />
    </CalendarStack.Navigator>
  );
}

function MessagesStackScreen() {
  return (
    <MessagesStack.Navigator screenOptions={stackScreenOptions}>
      <MessagesStack.Screen name="ChatList" component={ChatListScreen} />
      <MessagesStack.Screen name="ChatConversation" component={ChatConversationScreen} />
      <MessagesStack.Screen name="AIAssistant" component={AIAssistantScreen} />
      <MessagesStack.Screen name="VideoCall" component={VideoCallScreen} />
    </MessagesStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="Profile" component={StudentProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="QRScanner" component={QRScannerScreen} />
    </ProfileStack.Navigator>
  );
}

export function StudentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.blue,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.surface.card,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: colors.shadow.color,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          ...typography.labelSm,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarStackScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStackScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={1.5} />,
        }}
      />
    </Tab.Navigator>
  );
}
