import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import PageTransition from '@/components/common/PageTransition';
import { calendarService } from '@/services/calendarService';
import { SESSION_TYPE_COLORS } from '@/utils/constants';
import type { CalendarEvent } from '@/types/calendar';
import styles from './Calendar.module.css';

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const fetchEvents = useCallback(async (startStr: string, endStr: string) => {
    try {
      const res = await calendarService.getEvents(startStr, endStr);
      setEvents(res.data.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    fetchEvents(start, end);
  }, [fetchEvents]);

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.calendarWrapper}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events.map((e) => ({
              id: e.id,
              title: e.title,
              start: e.start,
              end: e.end,
              backgroundColor: SESSION_TYPE_COLORS[e.session_type] ?? '#2E75B6',
              borderColor: 'transparent',
              textColor: '#fff',
            }))}
            datesSet={({ startStr, endStr }) => fetchEvents(startStr, endStr)}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
          />
        </div>
      </div>
    </PageTransition>
  );
}
