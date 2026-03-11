# Cloudflare Queues — Implementation Guide

**Status:** P1 § §7.4 Arquitectura. Implementación pospuesta pending async architecture decision.

## Purpose

Current: Cron jobs y API calls síncronos bloquean requests.
Goal: Async jobs (image processing, email, reports) sin bloquear respuesta HTTP.

## Options

| Sistema | Pros | Contras | Costo |
|---------|------|---------|-------|
| **Cloudflare Queues** | Native CF, low latency, auto-retry | Limited to CF ecosystem, new | $0 (included) |
| **Bull/BullMQ + Redis** | Mature, full-featured, widely used | Requires Redis, worker overhead | $5-50/month |
| **AWS SQS** | Scalable, mature, cheap | AWS lock-in, management overhead | $0.40/million msgs |
| **RabbitMQ** | Feature-rich, reliable | Requires infrastructure | $10-100/month |

## Decision: Cloudflare Queues (for CF Pages deployment)

Since we're on CF Pages + CF Workers, Queues are:
- ✓ Native integration
- ✓ No additional infrastructure
- ✓ Auto-retry + DLQ
- ✓ $0 cost
- ✗ Limited to CF ecosystem (but fine for MVP)

## Architecture

```
User Request
  ↓
API Route (Nuxt)
  ├─ Immediate: return HTTP 200 (cached response)
  └─ Queue: sendEmail(user.email) → CF Queue

CF Queue Consumer (Worker)
  ↓
Process Job (email, image, report)
  ├─ Success → mark done
  └─ Error → retry (exponential backoff, max 30 retries)
```

## Implementation (Template)

### 1. Create Queue

```bash
# Cloudflare Dashboard → Workers → Queues → Create Queue
# Or via CLI:
wrangler queues create send-emails
wrangler queues create process-images
wrangler queues create generate-reports
```

### 2. Producer (API Route)

```typescript
// server/api/email/send.post.ts

export default defineEventHandler(async (event) => {
  const { email, subject, html } = await readBody(event)

  // Validate
  // ...

  // Queue async email send
  const queue = useCloudflareQueue(event, 'send-emails')
  await queue.send({ email, subject, html, timestamp: Date.now() })

  // Return immediately
  return { success: true, queued: true }
})

// Helper:
function useCloudflareQueue(event: H3Event, queueName: string) {
  const cf = event.context.cf as any
  return {
    send: async (payload: any) => {
      // In CF Workers context: env.QUEUE_NAME.send(payload)
      // In Nuxt: make HTTP request to queue worker
      return await $fetch(`/api/queue/${queueName}`, {
        method: 'POST',
        body: payload,
      })
    }
  }
}
```

### 3. Consumer (Dedicated Worker)

```typescript
// workers/queue-consumer.ts

export default {
  async queue(batch: MessageBatch, env: Env) {
    for (const message of batch.messages) {
      try {
        const { email, subject, html } = JSON.parse(message.body)

        // Process job
        await sendEmailViaResend(email, subject, html)

        // Mark as processed
        message.ack()
      } catch (error) {
        // Retry (CF handles exponential backoff)
        // After 30 retries → goes to DLQ (Dead Letter Queue)
        console.error(`Failed to process message:`, error)
        // message.nack() would retry, but CF does it automatically
      }
    }
  }
}
```

### 4. Wrangler Config

```toml
# wrangler.toml

[[queues.producers]]
binding = "QUEUE"
queue = "send-emails"

[[queues.consumers]]
queue = "send-emails"
max_batch_size = 30
max_batch_timeout = 30
max_retries = 30
dead_letter_queue = "send-emails-dlq"
```

## Monitoring

### Cloudflare Dashboard
- **Workers** → **Queues** → View message counts
- **Queues** → **Dead Letter Queues** → Review failed jobs

### Logging

```typescript
// Log queue processing
logger.info(`Queue job: ${jobType} processed`, {
  duration: Date.now() - startTime,
  status: 'success'
})
```

## Fallback: Bull/BullMQ (if CF not sufficient)

If Queues limitations appear:

```bash
npm install bullmq redis
```

```typescript
import { Queue } from 'bullmq'

const emailQueue = new Queue('send-emails', {
  connection: {
    host: process.env.REDIS_HOST,
    port: 6379,
  }
})

// Producer
await emailQueue.add('sendEmail', { email, subject, html })

// Consumer (separate server)
const worker = new Worker('send-emails', async (job) => {
  await sendEmailViaResend(job.data.email, ...)
})
```

## Timeline

| When | Action |
|------|--------|
| **Now** | Keep sync (current state) |
| **100 concurrent users** | Implement CF Queues for emails |
| **1k concurrent users** | Add image processing queue |
| **10k concurrent users** | Evaluate Bull/BullMQ + Redis |

---

**Current:** Sync API calls ✓
**Recommended:** CF Queues when emails start taking >1s
**Fallback:** Bull + Redis at 10k+ scale
