export interface TaskAttachment {
  id: string;
  type: 'image' | 'pdf' | 'link';
  url: string;
  name: string;
  size?: number;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  percentage: number;
  type: TaskType;
  folder_id?: string;
  order_index?: number;
  event_id?: string;
  event_start?: string;
  archived?: boolean;
  blocked?: boolean;
  block_reason?: string;
  entity_id?: string;
  attachments?: TaskAttachment[];
  created_at?: string;
  updated_at?: string;
}

export type TaskType = 'call' | 'content' | 'dev' | 'other';

export type TaskFilter = 'all' | 'completed' | 'pending' | 'archived';

export interface CreateTaskInput {
  title: string;
  type?: TaskType;
  event_start?: string;
  entity_id?: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  completed?: boolean;
  percentage?: number;
  type?: TaskType;
  folder_id?: string | null;
  order_index?: number;
  event_id?: string;
  event_start?: string;
  archived?: boolean;
  blocked?: boolean;
  block_reason?: string;
  entity_id?: string;
  attachments?: TaskAttachment[];
}

export interface Problem {
  id: string;
  title: string;
  solved: boolean;
  solution?: string;
  created_at?: string;
}

export interface CreateProblemInput {
  title: string;
}

export interface Folder {
  id: string;
  name: string;
  order_index?: number;
  color?: string;
  summary?: string;
  price?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFolderInput {
  name: string;
  order_index?: number;
  color?: string;
  price?: number;
}

export interface UpdateFolderInput {
  id: string;
  name?: string;
  order_index?: number;
  price?: number;
  color?: string;
  summary?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  htmlLink?: string;
}

export interface Entity {
  id: string;
  name: string;
  type: 'project' | 'developer' | 'colleague' | 'client';
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEntityInput {
  name: string;
  type: 'project' | 'developer' | 'colleague' | 'client';
  description?: string;
}

export interface UpdateEntityInput {
  id: string;
  name?: string;
  type?: 'project' | 'developer' | 'colleague' | 'client';
  description?: string;
}

export interface TaskSuggestion {
  title: string;
  similarity: number;
  entity_id?: string;
}
