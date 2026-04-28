import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, X, Video, Clock, Pencil, Trash2, AlignLeft } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuthStore, useAccountType } from '@/store/authStore';
import { calendarService } from '@/services/calendarService';
import { sessionService } from '@/services/sessionService';
import { formatDateTime } from '@/utils/formatters';
import { SESSION_TYPE_COLORS, SESSION_TYPES, SESSION_MODES } from '@/utils/constants';
import type { CalendarEvent } from '@/types/calendar';
import styles from './Calendar.module.css';

interface PersonalEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
}

interface SelectedSessionEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  session_type: string;
  mode: string;
  jitsi_room_name?: string;
  tutor_name?: string;
}

function getStorageKey(userId: string): string {
  return `rihla-personal-events-${userId}`;
}

function loadPersonalEvents(userId: string | null): PersonalEvent[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((e: Record<string, unknown>) => ({
      ...e,
      description: (e.description as string) ?? '',
    }));
  } catch {
    return [];
  }
}

function savePersonalEvents(userId: string | null, events: PersonalEvent[]) {
  if (!userId) return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(events));
}

function isPast(endStr: string): boolean {
  return new Date(endStr) < new Date();
}

export default function Calendar() {
  const accountType = useAccountType();
  const accountId = useAuthStore((s) => s.account?.id ?? null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);

  useEffect(() => {
    setPersonalEvents(loadPersonalEvents(accountId));
  }, [accountId]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', startTime: '09:00', endTime: '10:00' });

  const [selectedPersonalEvent, setSelectedPersonalEvent] = useState<PersonalEvent | null>(null);

  const [editingPersonalEvent, setEditingPersonalEvent] = useState<PersonalEvent | null>(null);
  const [editEvent, setEditEvent] = useState({ title: '', description: '', date: '', startTime: '09:00', endTime: '10:00' });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<SelectedSessionEvent | null>(null);

  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [showCancelBookingConfirm, setShowCancelBookingConfirm] = useState(false);

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

  const openAddModal = (dateStr?: string, timeStr?: string) => {
    const date = dateStr ?? new Date().toISOString().split('T')[0] ?? '';
    const startTime = timeStr ?? '09:00';
    const hourPart = startTime.split(':')[0] ?? '09';
    const minPart = startTime.split(':')[1] ?? '00';
    const endHour = Math.min(parseInt(hourPart) + 1, 23);
    const endTime = `${String(endHour).padStart(2, '0')}:${minPart}`;
    setNewEvent({ title: '', description: '', date, startTime, endTime });
    setShowAddModal(true);
  };

  const handleDateClick = (info: { dateStr: string }) => {
    const dateStr = info.dateStr.includes('T') ? (info.dateStr.split('T')[0] ?? info.dateStr) : info.dateStr;
    const timeStr = info.dateStr.includes('T') ? (info.dateStr.split('T')[1]?.substring(0, 5) ?? '09:00') : '09:00';
    openAddModal(dateStr, timeStr);
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) return;
    const event: PersonalEvent = {
      id: `personal-${Date.now()}`,
      title: newEvent.title,
      description: newEvent.description,
      start: `${newEvent.date}T${newEvent.startTime}:00`,
      end: `${newEvent.date}T${newEvent.endTime}:00`,
    };
    const updated = [...personalEvents, event];
    setPersonalEvents(updated);
    savePersonalEvents(accountId, updated);
    setShowAddModal(false);
  };

  const handleDeletePersonal = (id: string) => {
    const updated = personalEvents.filter((e) => e.id !== id);
    setPersonalEvents(updated);
    savePersonalEvents(accountId, updated);
  };

  const handleEditStart = (event: PersonalEvent) => {
    const startDate = event.start.split('T')[0] ?? '';
    const startTime = event.start.split('T')[1]?.substring(0, 5) ?? '09:00';
    const endTime = event.end.split('T')[1]?.substring(0, 5) ?? '10:00';
    setEditEvent({ title: event.title, description: event.description, date: startDate, startTime, endTime });
    setEditingPersonalEvent(event);
    setSelectedPersonalEvent(null);
  };

  const handleEditSave = () => {
    if (!editingPersonalEvent || !editEvent.title.trim()) return;
    const updated = personalEvents.map((e) =>
      e.id === editingPersonalEvent.id
        ? {
            ...e,
            title: editEvent.title,
            description: editEvent.description,
            start: `${editEvent.date}T${editEvent.startTime}:00`,
            end: `${editEvent.date}T${editEvent.endTime}:00`,
          }
        : e,
    );
    setPersonalEvents(updated);
    savePersonalEvents(accountId, updated);
    setEditingPersonalEvent(null);
  };

  const handleCancelBooking = async () => {
    if (!selectedEvent) return;
    setCancellingBooking(true);
    try {
      await sessionService.cancelBooking(selectedEvent.id);
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      await fetchEvents(start, end);
      setSelectedEvent(null);
      setShowCancelBookingConfirm(false);
    } catch { /* ignore */ }
    setCancellingBooking(false);
  };

  const allEvents = [
    ...events.map((e) => {
      const past = isPast(e.end);
      return {
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        backgroundColor: past ? '#BDD7EE' : (SESSION_TYPE_COLORS[e.session_type] ?? '#2E75B6'),
        borderColor: 'transparent',
        textColor: past ? '#667085' : '#fff',
        allDay: false as const,
        extendedProps: {
          session_type: e.session_type,
          mode: e.mode,
          jitsi_room_name: e.jitsi_room_name,
          tutor_name: e.tutor_name,
          isSession: true,
          isPast: past,
        },
      };
    }),
    ...personalEvents.map((e) => {
      const past = isPast(e.end);
      return {
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        backgroundColor: past ? '#D6D9E0' : '#8B5CF6',
        borderColor: 'transparent',
        textColor: past ? '#667085' : '#fff',
        allDay: false as const,
        extendedProps: { isSession: false, description: e.description, isPast: past },
      };
    }),
  ];

  return (
    <PageTransition>
      <div className={styles.page}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
          <Button size="sm" icon={<Plus size={14} strokeWidth={1.5} />} onClick={() => openAddModal()}>
            Add Event
          </Button>
        </div>

        <div className={styles.calendarWrapper}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={allEvents}
            datesSet={({ startStr, endStr }) => fetchEvents(startStr, endStr)}
            dateClick={handleDateClick}
            height={680}
            scrollTime="08:00:00"
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            eventDisplay="block"
            dayMaxEvents={3}
            nowIndicator
            eventClassNames={(info) => {
              if (info.event.extendedProps.isPast) return ['past-event'];
              return [];
            }}
            eventClick={(info) => {
              if (info.event.id.startsWith('personal-')) {
                const pe = personalEvents.find((e) => e.id === info.event.id);
                if (pe) setSelectedPersonalEvent(pe);
              } else {
                const props = info.event.extendedProps;
                setSelectedEvent({
                  id: info.event.id,
                  title: info.event.title,
                  start: info.event.start?.toISOString() ?? '',
                  end: info.event.end?.toISOString() ?? '',
                  session_type: props.session_type,
                  mode: props.mode,
                  jitsi_room_name: props.jitsi_room_name,
                  tutor_name: props.tutor_name,
                });
              }
            }}
          />
        </div>

        <div className={styles.legend}>
          {Object.entries(SESSION_TYPE_COLORS).map(([type, color]) => (
            <div key={type} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: color }} />
              <span>{type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
            </div>
          ))}
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#8B5CF6' }} />
            <span>Personal Event</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#D6D9E0' }} />
            <span>Past</span>
          </div>
        </div>

        {/* Session Event Detail */}
        {selectedEvent && (
          <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>{selectedEvent.title}</h3>
                <button onClick={() => setSelectedEvent(null)} className={styles.closeBtn}>
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Badge variant="info">
                    {SESSION_TYPES[selectedEvent.session_type as keyof typeof SESSION_TYPES] ?? selectedEvent.session_type}
                  </Badge>
                  <Badge variant="default">
                    {SESSION_MODES[selectedEvent.mode as keyof typeof SESSION_MODES] ?? selectedEvent.mode}
                  </Badge>
                  {isPast(selectedEvent.end) && <Badge variant="default">Completed</Badge>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-body)', fontSize: 'var(--text-body-sm)' }}>
                  <Clock size={14} strokeWidth={1.5} />
                  <span>{formatDateTime(selectedEvent.start)}</span>
                </div>
                {selectedEvent.tutor_name && (
                  <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                    Tutor: {selectedEvent.tutor_name}
                  </p>
                )}
              </div>
              <div className={styles.modalFooter}>
                {selectedEvent.jitsi_room_name && selectedEvent.mode !== 'physical' && !isPast(selectedEvent.end) && (
                  <Button
                    size="sm"
                    icon={<Video size={14} strokeWidth={1.5} />}
                    onClick={() => {
                      window.open(`/video/${selectedEvent.jitsi_room_name}?session=${selectedEvent.id}`, '_blank');
                      setSelectedEvent(null);
                    }}
                  >
                    Join Video Call
                  </Button>
                )}
                {selectedEvent.session_type === 'booking_meeting' && accountType === 'student' && !isPast(selectedEvent.end) && (
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<Trash2 size={14} strokeWidth={1.5} />}
                    onClick={() => setShowCancelBookingConfirm(true)}
                  >
                    Cancel Booking
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}

        {/* Personal Event Detail */}
        {selectedPersonalEvent && !editingPersonalEvent && (
          <div className={styles.modalOverlay} onClick={() => setSelectedPersonalEvent(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>{selectedPersonalEvent.title}</h3>
                <button onClick={() => setSelectedPersonalEvent(null)} className={styles.closeBtn}>
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <span className={styles.personalBadge}>Personal Event</span>
                {selectedPersonalEvent.description && (
                  <div className={styles.eventDescription}>
                    <AlignLeft size={14} strokeWidth={1.5} />
                    <span>{selectedPersonalEvent.description}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-body)', fontSize: 'var(--text-body-sm)' }}>
                  <Clock size={14} strokeWidth={1.5} />
                  <span>{formatDateTime(selectedPersonalEvent.start)}</span>
                </div>
                {isPast(selectedPersonalEvent.end) && (
                  <Badge variant="default">Completed</Badge>
                )}
              </div>
              <div className={styles.modalFooter}>
                {!isPast(selectedPersonalEvent.end) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Pencil size={14} strokeWidth={1.5} />}
                    onClick={() => handleEditStart(selectedPersonalEvent)}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  icon={<Trash2 size={14} strokeWidth={1.5} />}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Personal Event Modal */}
        {editingPersonalEvent && (
          <div className={styles.modalOverlay} onClick={() => setEditingPersonalEvent(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Edit Personal Event</h3>
                <button onClick={() => setEditingPersonalEvent(null)} className={styles.closeBtn}>
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label>Title</label>
                  <input
                    type="text"
                    value={editEvent.title}
                    onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className={styles.field}>
                  <label>Description</label>
                  <textarea
                    className={styles.textarea}
                    value={editEvent.description}
                    onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                    placeholder="Add a description..."
                    rows={3}
                  />
                </div>
                <div className={styles.field}>
                  <label>Date</label>
                  <input
                    type="date"
                    value={editEvent.date}
                    onChange={(e) => setEditEvent({ ...editEvent, date: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <div className={styles.field} style={{ flex: 1 }}>
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={editEvent.startTime}
                      onChange={(e) => setEditEvent({ ...editEvent, startTime: e.target.value })}
                    />
                  </div>
                  <div className={styles.field} style={{ flex: 1 }}>
                    <label>End Time</label>
                    <input
                      type="time"
                      value={editEvent.endTime}
                      onChange={(e) => setEditEvent({ ...editEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" size="sm" onClick={() => setEditingPersonalEvent(null)}>Cancel</Button>
                <Button size="sm" onClick={handleEditSave} disabled={!editEvent.title.trim()}>Save Changes</Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Personal Event Modal */}
        {showAddModal && (
          <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Add Personal Event</h3>
                <button onClick={() => setShowAddModal(false)} className={styles.closeBtn}>
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label>Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Study session, homework, etc."
                    autoFocus
                  />
                </div>
                <div className={styles.field}>
                  <label>Description</label>
                  <textarea
                    className={styles.textarea}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Add a description (optional)..."
                    rows={3}
                  />
                </div>
                <div className={styles.field}>
                  <label>Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <div className={styles.field} style={{ flex: 1 }}>
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                  <div className={styles.field} style={{ flex: 1 }}>
                    <label>End Time</label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddEvent} disabled={!newEvent.title.trim()}>Add Event</Button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            if (selectedPersonalEvent) {
              handleDeletePersonal(selectedPersonalEvent.id);
              setSelectedPersonalEvent(null);
              setShowDeleteConfirm(false);
            }
          }}
          title="Delete Personal Event"
          message="Are you sure you want to delete this event? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
        />

        <ConfirmDialog
          isOpen={showCancelBookingConfirm}
          onClose={() => setShowCancelBookingConfirm(false)}
          onConfirm={handleCancelBooking}
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking meeting? Both you and the tutor will be notified."
          confirmLabel="Cancel Booking"
          variant="danger"
          loading={cancellingBooking}
        />
      </div>
    </PageTransition>
  );
}
