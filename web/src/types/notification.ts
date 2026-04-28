export interface Notification {
  id: string;
  account_id: string;
  notification_type: string;
  title: string;
  body: string;
  is_read: boolean;
  related_entity_id: string | null;
  related_entity_type: string | null;
  created_at: string;
}
