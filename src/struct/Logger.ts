import chalk from 'chalk';

enum LogLevel { LOG = 'log', ERROR = 'error', WARN = 'warn', DEBUG = 'debug', VERBOSE = 'verbose', INFO = "info" }

interface LoggerOptions { logLevel?: LogLevel; context?: string; }

class Logger {
    private static instance: Logger;
    private logLevel: LogLevel;
    private context?: string;

    constructor(options: LoggerOptions = {}) {
        this.logLevel = options.logLevel || LogLevel.LOG;
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
            [LogLevel.DEBUG]: chalk.blue,
            [LogLevel.VERBOSE]: chalk.magenta,
            [LogLevel.INFO]: chalk.blueBright
        };
        return colorMap[level] || chalk.white;
    }

    private formatMessage(level: LogLevel, message: string, context?: string): string {
        const now = new Date();
        const timestamp = `[${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB')}]`;
        const contextText = context ? `[${context}] ` : '';
        return `${chalk.gray(timestamp)} ${this.getLevelColor(level)(`[${level.toUpperCase()}]`)} ${chalk.cyan(contextText)}${message}`;
    }

    private logMessage(level: LogLevel, message: string, context?: string) {
        // Always log regardless of the level
        console.log(this.formatMessage(level, message, context || this.context));
    }

    error(message: string, trace?: string, context?: string) {
        this.logMessage(LogLevel.ERROR, message, context);
        if (trace) this.logMessage(LogLevel.ERROR, trace, context);
    }

    warn(message: string, context?: string) {
        this.logMessage(LogLevel.WARN, message, context);
    }

    log(message: string, context?: string) {
        this.logMessage(LogLevel.LOG, message, context);
    }

    debug(message: string, context?: string) {
        this.logMessage(LogLevel.DEBUG, message, context);
    }

    verbose(message: string, context?: string) {
        this.logMessage(LogLevel.VERBOSE, message, context);
    }

    info(message: string, context?: string) {
        this.logMessage(LogLevel.INFO, message, context);
    }

    // Static methods to allow direct usage
    static error(message: string, trace?: string, context?: string) {
        this.getInstance().error(message, trace, context);
    }

    static warn(message: string, context?: string) {
        this.getInstance().warn(message, context);
    }

    static log(message: string, context?: string) {
        this.getInstance().log(message, context);
    }

    static debug(message: string, context?: string) {
        this.getInstance().debug(message, context);
    }

    static verbose(message: string, context?: string) {
        this.getInstance().verbose(message, context);
    }

    static info(message: string, context?: string) {
        this.getInstance().info(message, context);
    }
}

export { Logger, LogLevel };
