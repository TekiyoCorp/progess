/**
 * Système de logging conditionnel pour Tekiyo Dashboard
 * 
 * En développement: tous les logs sont affichés
 * En production: seules les erreurs sont affichées
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Logs d'information (uniquement en dev)
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Logs d'erreur (toujours affichés)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Logs d'avertissement (uniquement en dev)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Logs de debug (uniquement en dev)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};

/**
 * Logger pour les opérations Supabase
 */
export const supabaseLogger = {
  fetch: (table: string, count?: number) => {
    logger.info(`📊 [${table}] Fetching${count ? ` ${count} records` : ''}...`);
  },
  
  create: (table: string, data: any) => {
    logger.info(`➕ [${table}] Creating:`, data);
  },
  
  update: (table: string, id: string, data: any) => {
    logger.info(`✏️ [${table}] Updating ${id}:`, data);
  },
  
  delete: (table: string, id: string) => {
    logger.info(`🗑️ [${table}] Deleting ${id}`);
  },
  
  error: (table: string, operation: string, error: any) => {
    logger.error(`❌ [${table}] Error during ${operation}:`, error);
  },
  
  success: (table: string, operation: string) => {
    logger.info(`✅ [${table}] ${operation} successful`);
  },
};

/**
 * Logger pour les opérations Realtime
 */
export const realtimeLogger = {
  setup: (table: string) => {
    logger.info(`📡 [${table}] Setting up Realtime subscription...`);
  },
  
  event: (table: string, eventType: string, data?: any) => {
    logger.info(`🔥 [${table}] Realtime event: ${eventType}`, data);
  },
  
  status: (table: string, status: string) => {
    logger.info(`📡 [${table}] Subscription status: ${status}`);
  },
  
  cleanup: (table: string) => {
    logger.info(`🔌 [${table}] Cleaning up Realtime subscription...`);
  },
};

/**
 * Logger pour les opérations API
 */
export const apiLogger = {
  request: (endpoint: string, method: string, data?: any) => {
    logger.info(`🌐 [API] ${method} ${endpoint}`, data);
  },
  
  response: (endpoint: string, status: number, data?: any) => {
    logger.info(`✅ [API] ${endpoint} → ${status}`, data);
  },
  
  error: (endpoint: string, error: any) => {
    logger.error(`❌ [API] ${endpoint} failed:`, error);
  },
};

export default logger;

