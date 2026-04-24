export interface NotificationResponse {
  id: string;
  title: string;
  body: string | null;
  notification_type: string;
  related_entity_id: string | null;
  related_entity_type: string | null;
  is_read: boolean;
  created_at: string;
}
