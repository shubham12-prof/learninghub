# API Routes

Build backend HTTP endpoints directly inside a Next.js project — no separate server needed — using `route.ts` files (App Router) inside the `app/` directory.

```ts
// app/api/users/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

**Dynamic API routes — same `[param]` syntax as page routing:**

```ts
// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  await db.user.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
```

**Reading query parameters and headers:**

```ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1"; // GET /api/users?page=2
  const authHeader = request.headers.get("authorization");
  // ...
}
```

**One HTTP method function per export** — `GET`, `POST`, `PUT`, `PATCH`, `DELETE` are each their own named export in the same `route.ts` file; a request with a method that has no matching export automatically gets a 405.

**API Routes vs Server Actions — when to use which:**

|             | API Routes                                                   | Server Actions                                       |
| ----------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| Called from | anywhere — including external clients, mobile apps, webhooks | only from within your Next.js app's components/forms |
| Use for     | public APIs, webhooks, third-party integrations              | internal form submissions and data mutations         |

**Interview note:** if you're building an endpoint that ONLY your own app's forms/components will ever call, Server Actions are usually simpler (no manual fetch/JSON boilerplate, built-in progressive enhancement) — reach for API Routes specifically when you need a genuine HTTP endpoint that external clients, webhooks, or a mobile app also need to hit.
