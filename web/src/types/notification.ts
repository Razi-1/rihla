export interface Notification {
  id: string;
  account_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  entity_id: string | null;
  entity_type: string | null;
  created_at: string;
}
