type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  error?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private log(level: LogLevel, message: string, data?: any, error?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data }),
      ...(error && { error: error.message || error }),
    }

    const logMessage = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`

    switch (level) {
      case "debug":
        if (this.isDevelopment) console.debug(logMessage, data)
        break
      case "info":
        console.info(logMessage, data)
        break
      case "warn":
        console.warn(logMessage, data)
        break
      case "error":
        console.error(logMessage, error || data)
        break
    }

    return entry
  }

  debug(message: string, data?: any) {
    return this.log("debug", message, data)
  }

  info(message: string, data?: any) {
    return this.log("info", message, data)
  }

  warn(message: string, data?: any) {
    return this.log("warn", message, data)
  }

  error(message: string, error?: any, data?: any) {
    return this.log("error", message, data, error)
  }
}

export const logger = new Logger()
