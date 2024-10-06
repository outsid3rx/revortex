import winston from 'winston'

const format = winston.format

export const logger = winston.createLogger({
  level: 'warn',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({ filename: './logs/all.log' }),
  ],
})
