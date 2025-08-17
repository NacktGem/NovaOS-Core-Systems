export interface TaskEnvelope {
  id: string;
  type: string;
  created_at: string;
  priority?: number;
  actor?: string;
  payload: any;
}

export interface ResultEnvelope {
  id: string;
  task_id: string;
  status: 'ok' | 'error';
  output?: any;
  error?: string | null;
}

export interface ModerationFlagged {
  message_id: string;
  room_id: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface FeedUpdated {
  user_id: string;
  feed_id: string;
  items: string[];
}

export interface SearchIndexed {
  entity: string;
  entity_id: string;
}

export interface AnalyticsSignal {
  event_name: string;
  props?: Record<string, any>;
}

export type AgentEvent =
  | ModerationFlagged
  | FeedUpdated
  | SearchIndexed
  | AnalyticsSignal;
