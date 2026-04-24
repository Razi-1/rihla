import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, BookOpen, CalendarDays, MessageSquare, User } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import {
  TutorTabParamList,
  TutorHomeStackParamList,
  TutorClassesStackParamList,
  TutorCalendarStackParamList,
  TutorMessagesStackParamList,
  TutorProfileStackParamList,
} from './types';

import { TutorDashboardScreen } from '../screens/tutor/DashboardScreen';
import { MyClassesScreen } from '../screens/tutor/MyClassesScreen';
import { CreateClassScreen } from '../screens/tutor/CreateClassScreen';
import { ClassSpaceScreen } from '../screens/tutor/ClassSpaceScreen';
import { EditProfileScreen } from '../screens/tutor/EditProfileScreen';
import { ProfilePreviewScreen } from '../screens/tutor/ProfilePreviewScreen';
import { QRDisplayScreen } from '../screens/tutor/QRDisplayScreen';
import { CalendarScreen } from '../screens/shared/CalendarScreen';
import { ChatListScreen } from '../screens/shared/ChatListScreen';
import { ChatConversationScreen } from '../screens/shared/ChatConversationScreen';
import { AIAssistantScreen } from '../screens/shared/AIAssistantScreen';
import { VideoCallScreen } from '../screens/shared/VideoCallScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';

const Tab = createBottomTabNavigator<TutorTabParamList>();
const HomeStack = createNativeStackNavigator<TutorHomeStackParamList>();
const ClassesStack = createNativeStackNavigator<TutorClassesStackParamList>();
const CalendarStack = createNativeStackNavigator<TutorCalendarStackParamList>();
const MessagesStack = createNativeStackNavigator<TutorMessagesStackParamList>();
const ProfileStack = createNativeStackNavigator<TutorProfileStackParamList>();

const stackScreenOptions = { headerShown: false, animation: 'slide_from_right' as const };

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="TutorDashboard" component={TutorDashboardScreen} />
      <HomeStack.Screen name="ClassSpace" component={ClassSpaceScreen} />
      <HomeStack.Screen name="QRDisplay" component={QRDisplayScreen} />
    </HomeStack.Navigator>
  );
}

function ClassesStackScreen() {
  return (
    <ClassesStack.Navigator screenOptions={stackScreenOptions}>
      <ClassesStack.Screen name="MyClasses" component={MyClassesScreen} />
      <ClassesStack.Screen name="CreateClass" component={CreateClassScreen} />
      <ClassesStack.Screen name="ClassSpace" component={ClassSpaceScreen} />
      <ClassesStack.Screen name="QRDisplay" component={QRDisplayScreen} />
    </ClassesStack.Navigator>
  );
}

function CalendarStackScreen() {
  return (
    <CalendarStack.Navigator screenOptions={stackScreenOptions}>
      <CalendarStack.Screen name="Calendar" component={CalendarScreen} />
      <CalendarStack.Screen name="ClassSpace" component={ClassSpaceScreen} />
      <CalendarStack.Screen name="CreateClass" component={CreateClassScreen} />
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
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="ProfilePreview" component={ProfilePreviewScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    </ProfileStack.Navigator>
  );
}

export function TutorTabNavigator() {
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
        name="ClassesTab"
        component={ClassesStackScreen}
        options={{
          tabBarLabel: 'Classes',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} strokeWidth={1.5} />
          ),
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
