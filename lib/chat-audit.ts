/**
 * Système d'audit trail pour le chat IA
 * Enregistre toutes les actions effectuées via le chat pour analyse et rejouage
 */

export interface ChatAuditLog {
  id: string;
  message: string;
  response: string;
  actions: Array<{
    type: string;
    data: any;
    success: boolean;
    error?: string;
  }>;
  timestamp: string;
  context: {
    tasksCount: number;
    foldersCount: number;
    userId?: string;
  };
}

const STORAGE_KEY = 'chat_audit_logs';
const MAX_LOGS = 500; // Garder les 500 derniers logs

export function saveChatAuditLog(log: ChatAuditLog): void {
  try {
    const existingLogs = loadChatAuditLogs();
    const updatedLogs = [log, ...existingLogs].slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Error saving chat audit log:', error);
  }
}

export function loadChatAuditLogs(): ChatAuditLog[] {
  try {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Error loading chat audit logs:', error);
    return [];
  }
}

export function getChatAuditLogsByDateRange(startDate: Date, endDate: Date): ChatAuditLog[] {
  const logs = loadChatAuditLogs();
  return logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });
}

export function getChatAuditLogsByActionType(actionType: string): ChatAuditLog[] {
  const logs = loadChatAuditLogs();
  return logs.filter(log => 
    log.actions.some(action => action.type === actionType)
  );
}

export function clearChatAuditLogs(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportChatAuditLogs(): string {
  const logs = loadChatAuditLogs();
  return JSON.stringify(logs, null, 2);
}


