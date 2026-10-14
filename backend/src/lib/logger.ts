type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: string | Error;
}

const formatLog = (payload: LogPayload): string => {
  return JSON.stringify(payload);
};

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    const payload: LogPayload = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...(context ? { context } : {}),
    };
    console.log(formatLog(payload));
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    const payload: LogPayload = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...(context ? { context } : {}),
    };
    console.warn(formatLog(payload));
  },

  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const errMessage = error instanceof Error ? error.stack || error.message : String(error);
    const payload: LogPayload = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...(error ? { error: errMessage } : {}),
      ...(context ? { context } : {}),
    };
    console.error(formatLog(payload));
  },

  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      const payload: LogPayload = {
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        ...(context ? { context } : {}),
      };
      console.debug(formatLog(payload));
    }
  },
};
