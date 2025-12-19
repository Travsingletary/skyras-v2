type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  namespace: string;
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

function emit(level: LogLevel, namespace: string, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? `${message} ${JSON.stringify(meta)}` : message;
  const formatted = `[${namespace}] ${payload}`;
  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export function createLogger(namespace: string): Logger {
  return {
    namespace,
    debug: (message, meta) => emit("debug", namespace, message, meta),
    info: (message, meta) => emit("info", namespace, message, meta),
    warn: (message, meta) => emit("warn", namespace, message, meta),
    error: (message, meta) => emit("error", namespace, message, meta),
  };
}
