import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PasswordRecovery: undefined;
  VerifyEmail: { token?: string };
};

// Student Stack (per tab)
export type StudentHomeStackParamList = {
  StudentDashboard: undefined;
  ClassDetail: { sessionId: string };
  ClassInvite: { inviteId: string };
  TutorProfile: { tutorId: string };
};

export type StudentSearchStackParamList = {
  TutorSearch: undefined;
  TutorProfile: { tutorId: string };
};

export type StudentCalendarStackParamList = {
  Calendar: undefined;
  ClassDetail: { sessionId: string };
};

export type StudentMessagesStackParamList = {
  ChatList: undefined;
  ChatConversation: { roomId: string; roomName: string };
  AIAssistant: undefined;
  VideoCall: { roomName: string; displayName: string };
};

export type StudentProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
  QRScanner: { sessionId: string };
};

// Student Tabs
export type StudentTabParamList = {
  HomeTab: NavigatorScreenParams<StudentHomeStackParamList>;
  SearchTab: NavigatorScreenParams<StudentSearchStackParamList>;
  CalendarTab: NavigatorScreenParams<StudentCalendarStackParamList>;
  MessagesTab: NavigatorScreenParams<StudentMessagesStackParamList>;
  ProfileTab: NavigatorScreenParams<StudentProfileStackParamList>;
};

// Tutor Stack (per tab)
export type TutorHomeStackParamList = {
  TutorDashboard: undefined;
  ClassSpace: { sessionId: string };
  QRDisplay: { sessionId: string };
};

export type TutorClassesStackParamList = {
  MyClasses: undefined;
  CreateClass: undefined;
  ClassSpace: { sessionId: string };
  QRDisplay: { sessionId: string };
};

export type TutorCalendarStackParamList = {
  Calendar: undefined;
  ClassSpace: { sessionId: string };
  CreateClass: undefined;
};

export type TutorMessagesStackParamList = {
  ChatList: undefined;
  ChatConversation: { roomId: string; roomName: string };
  AIAssistant: undefined;
  VideoCall: { roomName: string; displayName: string };
};

export type TutorProfileStackParamList = {
  EditProfile: undefined;
  ProfilePreview: undefined;
  Settings: undefined;
  Notifications: undefined;
};

// Tutor Tabs
export type TutorTabParamList = {
  HomeTab: NavigatorScreenParams<TutorHomeStackParamList>;
  ClassesTab: NavigatorScreenParams<TutorClassesStackParamList>;
  CalendarTab: NavigatorScreenParams<TutorCalendarStackParamList>;
  MessagesTab: NavigatorScreenParams<TutorMessagesStackParamList>;
  ProfileTab: NavigatorScreenParams<TutorProfileStackParamList>;
};

// Parent Stack (per tab)
export type ParentHomeStackParamList = {
  ParentDashboard: undefined;
  ChildOverview: { studentId: string };
};

export type ParentChildrenStackParamList = {
  ChildrenList: undefined;
  ChildOverview: { studentId: string };
  LinkChild: undefined;
};

export type ParentCalendarStackParamList = {
  Calendar: undefined;
};

export type ParentMessagesStackParamList = {
  ChatList: undefined;
  ChatConversation: { roomId: string; roomName: string };
  VideoCall: { roomName: string; displayName: string };
};

export type ParentProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
};

// Parent Tabs
export type ParentTabParamList = {
  HomeTab: NavigatorScreenParams<ParentHomeStackParamList>;
  ChildrenTab: NavigatorScreenParams<ParentChildrenStackParamList>;
  CalendarTab: NavigatorScreenParams<ParentCalendarStackParamList>;
  MessagesTab: NavigatorScreenParams<ParentMessagesStackParamList>;
  ProfileTab: NavigatorScreenParams<ParentProfileStackParamList>;
};

// Root
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  StudentMain: NavigatorScreenParams<StudentTabParamList>;
  TutorMain: NavigatorScreenParams<TutorTabParamList>;
  ParentMain: NavigatorScreenParams<ParentTabParamList>;
};

// Helper types for screen props
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type StudentHomeScreenProps<T extends keyof StudentHomeStackParamList> =
  NativeStackScreenProps<StudentHomeStackParamList, T>;

export type TutorHomeScreenProps<T extends keyof TutorHomeStackParamList> =
  NativeStackScreenProps<TutorHomeStackParamList, T>;

export type ParentHomeScreenProps<T extends keyof ParentHomeStackParamList> =
  NativeStackScreenProps<ParentHomeStackParamList, T>;
