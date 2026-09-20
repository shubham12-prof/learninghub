# Push Notifications

## What they are

Notifications delivered to a user's device (mobile app or browser) even
when the app isn't actively open, shown via the OS-level notification tray.
Unlike email/SMS, push delivery always goes through a **platform-specific
push gateway** operated by Apple/Google/the browser vendor — you never
deliver directly to the device yourself.

## The core mechanics

1. **Device registration:** when a user installs/opens the app (or enables
   web push), the client obtains a unique **device token** from the
   platform (APNs device token on iOS, FCM registration token on Android,
   a push subscription object for Web Push) and sends it to your backend.
2. **Token storage:** your backend stores `user_id → [device_token, platform,
app_version, last_active]` — a user can have multiple tokens (multiple
   devices, or a reinstalled app generating a new token).
3. **Sending:** your backend (or a queue worker) calls the platform's push
   service API with the device token + payload:
   - **APNs (Apple Push Notification service)** for iOS.
   - **FCM (Firebase Cloud Messaging)** for Android (and can also proxy
     Web Push and iOS).
   - **Web Push protocol** (via VAPID keys) for browsers.
4. **Platform delivers to device:** the OS/browser is responsible for the
   final hop to the device — your system's job ends once the platform
   gateway acknowledges receipt of the send request, not actual on-device
   display.

## Device token lifecycle management

- Tokens can become **invalid** (app uninstalled, token rotated by the OS,
  user revoked permission). Push providers return specific error codes for
  this (e.g., APNs returns an "Unregistered" / 410 response; FCM returns
  `NotRegistered`/`InvalidRegistration`).
- On receiving such an error, **immediately remove the stale token** from
  your store — continuing to send to dead tokens wastes provider quota and
  can hurt your sending reputation with the platform.
- Tokens should also be refreshed/re-synced periodically from the client
  side, since the OS can rotate them without an explicit uninstall event.

## Payload considerations

- Push payloads are size-limited (e.g., APNs caps around 4KB) — keep the
  notification payload small (title, body, a small data object, maybe a
  deep-link) rather than embedding large content; fetch full content from
  your API when the user taps the notification.
- **Silent/background push** (no visible alert, just a data payload) is
  supported by most platforms and useful for triggering a background sync
  rather than showing a user-facing alert — worth mentioning as a distinct
  use case from user-visible notifications.

## Fan-out to multiple devices

- Since a user may have several registered devices, sending "one logical
  notification" often means dispatching to **all of a user's active
  tokens** in parallel, and (for a good UX) coordinating **cross-device
  dismissal** — e.g., using APNs/FCM's collapse-key / notification-ID
  features so tapping/reading on one device can suppress or update the
  notification on others, rather than leaving stale duplicates.

## Reliability characteristics

- Push delivery is inherently **best-effort** — the platform gateway may
  queue, delay, or drop a notification (e.g., if the device is offline for
  an extended period, low-priority notifications can be dropped by the OS
  entirely). This matters for the interview: don't promise strong delivery
  guarantees for push the way you might for email; instead, design the
  in-app experience (e.g., an in-app notification center / inbox) as the
  reliable source of truth, with push as a best-effort real-time nudge on
  top of it.

## Interview-relevant talking points

- Be able to name the three platform gateways (APNs, FCM, Web Push) and
  explain that your system always sends _through_ them, never directly to
  a device.
- Explain token invalidation handling explicitly — a common follow-up is
  "how do you avoid wasting resources sending to dead tokens forever."
- Bring up push's best-effort nature and the common mitigation (a durable
  in-app notification store as the source of truth, push as a
  supplementary real-time signal) — a strong, experienced-sounding point.
