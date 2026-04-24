import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Users, CalendarDays, MessageSquare, User } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import {
  ParentTabParamList,
  ParentHomeStackParamList,
  ParentChildrenStackParamList,
  ParentCalendarStackParamList,
  ParentMessagesStackParamList,
  ParentProfileStackParamList,
} from './types';

import { ParentDashboardScreen } from '../screens/parent/DashboardScreen';
import { ChildOverviewScreen } from '../screens/parent/ChildOverviewScreen';
import { ChildrenListScreen } from '../screens/parent/ChildrenListScreen';
import { LinkChildScreen } from '../screens/parent/LinkChildScreen';
import { ParentProfileScreen } from '../screens/parent/ProfileScreen';
import { CalendarScreen } from '../screens/shared/CalendarScreen';
import { ChatListScreen } from '../screens/shared/ChatListScreen';
import { ChatConversationScreen } from '../screens/shared/ChatConversationScreen';
import { VideoCallScreen } from '../screens/shared/VideoCallScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();
const HomeStack = createNativeStackNavigator<ParentHomeStackParamList>();
const ChildrenStack = createNativeStackNavigator<ParentChildrenStackParamList>();
const CalendarStack = createNativeStackNavigator<ParentCalendarStackParamList>();
const MessagesStack = createNativeStackNavigator<ParentMessagesStackParamList>();
const ProfileStack = createNativeStackNavigator<ParentProfileStackParamList>();

const stackScreenOptions = { headerShown: false, animation: 'slide_from_right' as const };

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
      <HomeStack.Screen name="ChildOverview" component={ChildOverviewScreen} />
    </HomeStack.Navigator>
  );
}

function ChildrenStackScreen() {
  return (
    <ChildrenStack.Navigator screenOptions={stackScreenOptions}>
      <ChildrenStack.Screen name="ChildrenList" component={ChildrenListScreen} />
      <ChildrenStack.Screen name="ChildOverview" component={ChildOverviewScreen} />
      <ChildrenStack.Screen name="LinkChild" component={LinkChildScreen} />
    </ChildrenStack.Navigator>
  );
}

function CalendarStackScreen() {
  return (
    <CalendarStack.Navigator screenOptions={stackScreenOptions}>
      <CalendarStack.Screen name="Calendar" component={CalendarScreen} />
    </CalendarStack.Navigator>
  );
}

function MessagesStackScreen() {
  return (
    <MessagesStack.Navigator screenOptions={stackScreenOptions}>
      <MessagesStack.Screen name="ChatList" component={ChatListScreen} />
      <MessagesStack.Screen name="ChatConversation" component={ChatConversationScreen} />
      <MessagesStack.Screen name="VideoCall" component={VideoCallScreen} />
    </MessagesStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="Profile" component={ParentProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    </ProfileStack.Navigator>
  );
}

export function ParentTabNavigator() {
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
        name="ChildrenTab"
        component={ChildrenStackScreen}
        options={{
          tabBarLabel: 'Children',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} strokeWidth={1.5} />,
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
