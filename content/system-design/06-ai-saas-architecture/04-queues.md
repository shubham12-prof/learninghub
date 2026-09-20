# Queues

## Why queues matter more here than in typical SaaS

AI requests span a much wider latency range than typical API calls —
some complete in under a second, others (large document processing, agent
workflows with many steps, batch jobs) can take minutes. Holding an HTTP
request open for the long end of that range doesn't scale and produces a
bad experience if the connection drops. Queues let you decouple request
submission from processing, matching each request's actual latency needs.

## When to go async vs. keep it synchronous

- **Synchronous (with streaming):** interactive use cases where the user
  is actively waiting and watching output appear — a chat interface,
  a real-time autocomplete/suggestion feature. Streaming (see AI-providers
  note) makes even a 10-30 second generation feel acceptable because
  output appears progressively.
- **Asynchronous (via queue):** long-running or batch work — processing an
  uploaded document, running a multi-step agent workflow, bulk-generating
  content for many items at once. The client submits a job, gets an
  immediate acknowledgment (job ID), and either polls for status or
  receives a push notification/webhook when complete.
- A useful rule of thumb to state explicitly in an interview: if the work
  is bounded and short enough to stream progressively to an actively
  watching user, keep it synchronous+streaming; if it's unbounded, batched,
  or the user isn't expected to wait and watch, make it async via a queue.

## Queue architecture

- Standard producer/consumer setup: API layer publishes a job (with all
  context needed: prompt/input, user/org ID for billing and auth, desired
  model/params) to a queue (e.g., SQS, RabbitMQ, Kafka); a pool of workers
  consumes jobs, calls the AI provider abstraction layer, and writes
  results to storage, updating job status as it progresses.
- This is architecturally the same shape as the async processing pipelines
  in the notification-system and file-upload-system topics — worth
  explicitly noting the pattern reuse if it comes up, since it signals you
  recognize this as a general pattern (async work + queue + worker pool +
  status tracking) rather than something unique to AI.

## Backpressure & capacity management

- AI provider capacity (both your own rate limits with the provider, and
  the cost of running many concurrent generations) is a real constraint —
  unlike many typical background jobs, you can't simply scale worker
  count unboundedly, since each worker's throughput is ultimately capped
  by provider-side rate limits and your budget.
- **Concurrency limits** on the worker pool (tuned to provider rate
  limits) prevent the workers from overwhelming the provider and
  triggering widespread 429s.
- **Queue depth monitoring** as a leading indicator of capacity issues —
  a growing queue means demand is outpacing processing capacity, and
  should trigger either autoscaling (if cost allows) or user-facing
  signals (e.g., "your request is queued, estimated wait: X").

## Prioritization

- Not all queued work is equally urgent — a paid customer's request might
  reasonably jump ahead of a free-tier batch job, or an interactive
  request that briefly needs async handling (e.g., overflow during a
  traffic spike) might need priority over a scheduled bulk job.
- Implement via separate priority queues (consumed in priority order) or a
  priority field workers use to select the next job, rather than pure
  FIFO for all traffic — a good example of tailoring the queue design to
  actual business priority rather than treating all async work
  identically.

## Job status & result delivery

- Track job status (`queued → processing → complete/failed`) in a
  metadata store the client can poll, and/or push a notification/webhook
  on completion (reusing patterns from the notification-system topic) —
  the choice depends on whether the client is expected to stay connected
  or can check back later.
- Store results (generated output) in the same way covered in the
  storage note — durable storage referenced by the job record, not held
  only in the queue message itself (queue messages are typically not
  meant as a durable data store).

## Interview-relevant talking points

- Be ready to give a clear rule for sync+streaming vs. async+queue, tied
  to whether a user is actively watching and how bounded the work is —
  a common direct question.
- Bring up provider-side rate limits as the reason worker concurrency
  can't just be scaled up freely — a detail that's specific to AI
  workloads versus generic background job processing.
- Explicitly note the architectural similarity to async pipelines in other
  systems (notifications, file processing) if relevant — shows you
  recognize this as a reusable pattern, not a one-off.
