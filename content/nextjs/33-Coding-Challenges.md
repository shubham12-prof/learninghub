# Coding Challenges

### 1. Build a blog with a dynamic route and static generation

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

### 2. Implement a protected dashboard route using Middleware

```ts
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
```

### 3. Build a form using a Server Action with pending state and revalidation

```tsx
// app/actions.ts
"use server";
import { revalidatePath } from "next/cache";

export async function addTodo(formData: FormData) {
  const text = formData.get("text") as string;
  if (!text?.trim()) throw new Error("Todo text is required");
  await db.todo.create({ data: { text } });
  revalidatePath("/todos");
}
```

```tsx
// app/todos/TodoForm.tsx
"use client";
import { useFormStatus } from "react-dom";
import { addTodo } from "@/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending}>{pending ? "Adding..." : "Add Todo"}</button>
  );
}

export default function TodoForm() {
  return (
    <form action={addTodo}>
      <input name="text" required />
      <SubmitButton />
    </form>
  );
}
```

### 4. Implement ISR for a product catalog that revalidates every 5 minutes, plus on-demand refresh after an admin edit

```tsx
// app/products/[id]/page.tsx
async function getProduct(id: string) {
  const res = await fetch(`${process.env.API_URL}/products/${id}`, {
    next: { revalidate: 300, tags: [`product-${id}`] },
  });
  return res.json();
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);
  return <h1>{product.name}</h1>;
}
```

```ts
// app/actions.ts
"use server";
import { revalidateTag } from "next/cache";

export async function updateProduct(id: string, data: any) {
  await db.product.update({ where: { id }, data });
  revalidateTag(`product-${id}`); // instant refresh, no need to wait 5 minutes
}
```

### 5. Build a streaming dashboard with independently-loading widgets

```tsx
import { Suspense } from "react";

export default function Dashboard() {
  return (
    <div className="grid">
      <Suspense fallback={<Skeleton />}>
        <RevenueWidget />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <UsersWidget />
      </Suspense>
    </div>
  );
}

async function RevenueWidget() {
  const data = await getRevenue(); // slow
  return <Card title="Revenue" value={data.total} />;
}
async function UsersWidget() {
  const data = await getActiveUsers(); // slow, independent of RevenueWidget
  return <Card title="Active Users" value={data.count} />;
}
```
