import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? 'https://33f8fdef99246d94d7479fdb5abd7961@o4511388030205953.ingest.us.sentry.io/4511388056879104',
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
