import chalk from 'chalk';

enum LogLevel {
  LOG = 'log',
  ERROR = 'error',
  WARN = 'warn',
  DEBUG = 'debug',
  INFO = 'info',
}

interface LoggerOptions {
  context?: string;
  debug?: boolean;
}

class Logger {
  private static instance: Logger;
  public debugOption?: boolean;
  private context?: string;

  constructor(options: LoggerOptions = {}) {
    this.debugOption = options.debug || false;
    this.context = options.context;
  }

  static getInstance(options: LoggerOptions = {}): Logger {
    if (!this.instance) this.instance = new Logger(options);
    return this.instance;
  }

  private getLevelColor(level: LogLevel) {
    const colorMap = {
      [LogLevel.ERROR]: chalk.red,
      [LogLevel.WARN]: chalk.yellow,
      [LogLevel.LOG]: chalk.green,
      [LogLevel.DEBUG]: chalk.magenta,
      [LogLevel.INFO]: chalk.blueBright,
    };
    return colorMap[level] || chalk.white;
  }

  private formatMessage(level: LogLevel, context?: string): string {
    const now = new Date();
    const timestamp = `[${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB')}]`;

    const maxLevelLength = Math.max(
      ...Object.values(LogLevel).map((l) => l.length),
    );
    const levelText = `[${level.toUpperCase()}]`.padEnd(maxLevelLength + 2);
    const coloredLevel = this.getLevelColor(level)(levelText);

    const contextText = context ? `[${context}] ` : '';
    return `${chalk.gray(timestamp)} ${coloredLevel} ${chalk.cyan(contextText)}`;
  }

  private logMessage(level: LogLevel, ...args: any[]) {
    const prefix = this.formatMessage(level, this.context);

    if (args.length === 1 && Array.isArray(args[0])) {
      console.log(prefix);
      console.table(args[0]);
    } else {
      console.log(prefix, ...args);
    }
  }

  setDebug(debug: boolean) {
    this.debugOption = debug;
  }

  error(...args: any[]) {
    this.logMessage(LogLevel.ERROR, ...args);
  }

  warn(...args: any[]) {
    this.logMessage(LogLevel.WARN, ...args);
  }

  log(...args: any[]) {
    this.logMessage(LogLevel.LOG, ...args);
  }

  debug(...args: any[]) {
    if (this.debugOption) this.logMessage(LogLevel.DEBUG, ...args);
  }

  info(...args: any[]) {
    this.logMessage(LogLevel.INFO, ...args);
  }

  static error(...args: any[]) {
    this.getInstance().error(...args);
  }

  static warn(...args: any[]) {
    this.getInstance().warn(...args);
  }

  static log(...args: any[]) {
    this.getInstance().log(...args);
  }

  static debug(...args: any[]) {
    this.getInstance().debug(...args);
  }

  static info(...args: any[]) {
    this.getInstance().info(...args);
  }
}

export { Logger, LogLevel };
