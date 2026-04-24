import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Clock, MapPin } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { calendarService } from '../../services/calendarService';
import { CalendarEventResponse } from '../../types/calendar';
import { Badge } from '../../components/common/Badge';
import { AnimatedCard } from '../../components/common/AnimatedCard';
import { EmptyState } from '../../components/common/EmptyState';
import { formatTimeRange } from '../../utils/formatters';
import { SESSION_TYPE_LABELS, MODE_LABELS } from '../../utils/constants';

export function CalendarScreen({ navigation }: any) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]!);
  const [events, setEvents] = useState<CalendarEventResponse[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});

  const fetchEvents = useCallback(async (dateStr: string) => {
    const date = new Date(dateStr);
    const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]!;
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]!;
    try {
      const res = await calendarService.getEvents(start, end);
      const data = res.data.data;
      setEvents(data);
      const marks: Record<string, any> = {};
      data.forEach((ev) => {
        const day = ev.start.split('T')[0]!;
        marks[day] = { marked: true, dotColor: colors.primary.blue };
      });
      setMarkedDates(marks);
    } catch {}
  }, []);

  useEffect(() => { fetchEvents(selectedDate); }, [fetchEvents, selectedDate]);

  const dayEvents = events.filter((e) => e.start.split('T')[0] === selectedDate);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    fetchEvents(month.dateString);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Calendar</Text>
      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        markedDates={{
          ...markedDates,
          [selectedDate]: { ...(markedDates[selectedDate] ?? {}), selected: true, selectedColor: colors.primary.blue },
        }}
        theme={{
          backgroundColor: colors.surface.base,
          calendarBackground: colors.surface.base,
          textSectionTitleColor: colors.text.muted,
          selectedDayBackgroundColor: colors.primary.blue,
          selectedDayTextColor: colors.white,
          todayTextColor: colors.primary.blue,
          dayTextColor: colors.text.heading,
          textDisabledColor: colors.text.muted,
          dotColor: colors.primary.blue,
          arrowColor: colors.primary.blue,
          monthTextColor: colors.text.heading,
          textMonthFontWeight: '600',
          textDayFontSize: 15,
          textMonthFontSize: 17,
        }}
        style={styles.calendar}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {dayEvents.length > 0 ? (
          dayEvents.map((ev, i) => (
            <AnimatedCard
              key={ev.id}
              index={i}
              onPress={() => {
                if (navigation.getState().routeNames.includes('ClassDetail')) {
                  navigation.navigate('ClassDetail', { sessionId: ev.id });
                } else if (navigation.getState().routeNames.includes('ClassSpace')) {
                  navigation.navigate('ClassSpace', { sessionId: ev.id });
                }
              }}
            >
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                <Badge text={SESSION_TYPE_LABELS[ev.session_type] ?? ev.session_type} />
              </View>
              <View style={styles.eventMeta}>
                <Clock size={14} color={colors.text.muted} strokeWidth={1.5} />
                <Text style={styles.metaText}>{formatTimeRange(ev.start, ev.end)}</Text>
              </View>
              {ev.location_city && (
                <View style={styles.eventMeta}>
                  <MapPin size={14} color={colors.text.muted} strokeWidth={1.5} />
                  <Text style={styles.metaText}>{ev.location_city}</Text>
                </View>
              )}
              {ev.tutor_name && <Text style={styles.tutorName}>{ev.tutor_name}</Text>}
            </AnimatedCard>
          ))
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No sessions on this day</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  title: { ...typography.h2, color: colors.text.heading, paddingHorizontal: spacing[5], paddingTop: spacing[3] },
  calendar: { marginBottom: spacing[4] },
  content: { paddingHorizontal: spacing[5], paddingBottom: spacing[10], gap: spacing[3] },
  eventHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] },
  eventTitle: { ...typography.labelMd, color: colors.text.heading, flex: 1, marginRight: spacing[2] },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[1] },
  metaText: { ...typography.bodySm, color: colors.text.muted },
  tutorName: { ...typography.bodySm, color: colors.text.body, marginTop: spacing[2] },
  emptyWrap: { padding: spacing[8], alignItems: 'center' },
  emptyText: { ...typography.bodyMd, color: colors.text.muted },
});
