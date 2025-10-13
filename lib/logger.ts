type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  }

  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data || '')
    }
  }

  warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data || '')
  }

  error(message: string, error?: Error | any): void {
    console.error(`[ERROR] ${message}`, error || '')
  }
}

export const logger = new Logger()