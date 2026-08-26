type LogLevel = 'info' | 'error' | 'warn' | 'debug';

function timestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, tag: string, data?: Record<string, unknown>): string {
  const ts = timestamp();
  const base = `[${ts}] [${level.toUpperCase()}] [Worker] ${tag}`;
  if (data && Object.keys(data).length > 0) {
    return `${base} ${JSON.stringify(data)}`;
  }
  return base;
}

export const log = {
  info(tag: string, data?: Record<string, unknown>) {
    console.log(formatMessage('info', tag, data));
  },
  error(tag: string, data?: Record<string, unknown>) {
    console.error(formatMessage('error', tag, data));
  },
  warn(tag: string, data?: Record<string, unknown>) {
    console.warn(formatMessage('warn', tag, data));
  },
  debug(tag: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatMessage('debug', tag, data));
    }
  },
};
