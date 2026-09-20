# 04. Relations

## Overview

Prisma models relationships between tables using the `@relation` attribute, letting you query related data with a clean, type-safe API instead of writing manual joins.

## One-to-Many Relations

The most common relationship — one `User` has many `Post`s.

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[] // the "many" side, no actual DB column — just a virtual relation field
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id]) // the "one" side
  authorId Int     // the actual foreign key column stored in the database
}
```

- `authorId` is the real foreign key column in the `Post` table.
- `author` is a virtual relation field — not a real column, just a way to navigate to the related `User`.
- `posts` on `User` is also virtual — the inverse side of the relation, letting you navigate from user to their posts.

### Querying One-to-Many

```js
// Get a user with all their posts
const userWithPosts = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true },
});

// Get a post with its author
const postWithAuthor = await prisma.post.findUnique({
  where: { id: 1 },
  include: { author: true },
});

// Create a post directly linked to an existing user
await prisma.post.create({
  data: {
    title: "My First Post",
    author: { connect: { id: 1 } },
  },
});
```

## One-to-One Relations

```prisma
model User {
  id      Int      @id @default(autoincrement())
  name    String
  profile Profile? // optional — a user might not have a profile yet
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String
  user   User   @relation(fields: [userId], references: [id])
  userId Int    @unique // @unique here is what enforces "one-to-one" instead of "one-to-many"
}
```

The `@unique` on the foreign key column (`userId`) is the key detail — without it, this would just be a one-to-many relationship.

```js
const userWithProfile = await prisma.user.findUnique({
  where: { id: 1 },
  include: { profile: true },
});

// Create a user and their profile together
await prisma.user.create({
  data: {
    name: "Alice",
    profile: { create: { bio: "Software engineer" } },
  },
});
```

## Many-to-Many Relations

### Implicit Many-to-Many (Simplest — Prisma Manages the Join Table Automatically)

```prisma
model Post {
  id         Int        @id @default(autoincrement())
  title      String
  categories Category[] // implicit many-to-many
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}
```

Prisma automatically creates and manages a hidden join table behind the scenes — you never define or directly query it.

```js
// Connect a post to existing categories
await prisma.post.update({
  where: { id: 1 },
  data: {
    categories: { connect: [{ id: 1 }, { id: 2 }] },
  },
});

// Get a post with its categories
const post = await prisma.post.findUnique({
  where: { id: 1 },
  include: { categories: true },
});
```

### Explicit Many-to-Many (When the Relationship Needs Extra Data)

If the relationship itself needs additional attributes (like an "enrollment date" or "role" on the join), you need an explicit join model.

```prisma
model Student {
  id          Int          @id @default(autoincrement())
  name        String
  enrollments Enrollment[]
}

model Course {
  id          Int          @id @default(autoincrement())
  title       String
  enrollments Enrollment[]
}

model Enrollment {
  student   Student  @relation(fields: [studentId], references: [id])
  studentId Int
  course    Course   @relation(fields: [courseId], references: [id])
  courseId  Int
  grade     String?
  enrolledAt DateTime @default(now())

  @@id([studentId, courseId]) // composite primary key
}
```

```js
// Create an enrollment with extra data on the relationship itself
await prisma.enrollment.create({
  data: {
    student: { connect: { id: 1 } },
    course: { connect: { id: 5 } },
    grade: "A",
  },
});

// Get all courses a student is enrolled in, along with their grade
const studentEnrollments = await prisma.enrollment.findMany({
  where: { studentId: 1 },
  include: { course: true },
});
```

## Self-Relations

```prisma
model Employee {
  id         Int        @id @default(autoincrement())
  name       String
  manager    Employee?  @relation("ManagerSubordinates", fields: [managerId], references: [id])
  managerId  Int?
  reports    Employee[] @relation("ManagerSubordinates") // inverse side — named relations required to disambiguate
}
```

Named relations (`"ManagerSubordinates"`) are required whenever a model relates to itself, so Prisma can distinguish which field is which side of the relationship.

```js
const employeeWithManagerAndReports = await prisma.employee.findUnique({
  where: { id: 3 },
  include: { manager: true, reports: true },
});
```

## `connect`, `create`, `connectOrCreate`, `disconnect`

```js
// connect — link to an EXISTING related record
await prisma.post.create({
  data: { title: "Hello", author: { connect: { id: 1 } } },
});

// create — create a NEW related record at the same time
await prisma.post.create({
  data: {
    title: "Hello",
    author: { create: { name: "Alice", email: "alice@example.com" } },
  },
});

// connectOrCreate — connect if it exists, otherwise create it
await prisma.post.create({
  data: {
    title: "Hello",
    author: {
      connectOrCreate: {
        where: { email: "alice@example.com" },
        create: { name: "Alice", email: "alice@example.com" },
      },
    },
  },
});

// disconnect — remove a relation link without deleting the related record
await prisma.post.update({
  where: { id: 1 },
  data: { author: { disconnect: true } }, // only valid for optional relations
});
```

## Referential Actions (`onDelete`, `onUpdate`)

```prisma
model Post {
  id       Int    @id @default(autoincrement())
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId Int
}
```

| Action     | Behavior                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------ |
| `Cascade`  | Deleting the parent automatically deletes dependent rows                                   |
| `Restrict` | Prevents deleting the parent if dependent rows exist                                       |
| `SetNull`  | Sets the foreign key to `NULL` on the dependent row (requires the FK field to be optional) |
| `NoAction` | Similar to `Restrict`, deferred to the database's default behavior                         |

## Filtering Through Relations

```js
// Find users who have at least one published post
const usersWithPublishedPosts = await prisma.user.findMany({
  where: { posts: { some: { published: true } } },
});

// Find users where ALL their posts are published
const users = await prisma.user.findMany({
  where: { posts: { every: { published: true } } },
});

// Find users with NO posts at all
const usersWithNoPosts = await prisma.user.findMany({
  where: { posts: { none: {} } },
});
```

## Common Interview-Style Questions

- **How does Prisma distinguish a one-to-one relation from a one-to-many relation in the schema?**
  By whether the foreign key field also has a `@unique` attribute — without it, it's one-to-many; with it, at most one related row can exist per parent, making it one-to-one.

- **What's the difference between implicit and explicit many-to-many relations?**
  Implicit relations let Prisma automatically manage a hidden join table with no extra data; explicit relations require you to define the join model yourself, needed when the relationship itself carries additional attributes (like an enrollment date or role).

- **Why are named relations (e.g., `@relation("ManagerSubordinates", ...)`) required for self-relations?**
  Because a model relating to itself has two distinct relation fields pointing to the same related model — a name is needed to disambiguate which field represents which side of the relationship.

- **What's the difference between `connect` and `create` when writing a nested relation?**
  `connect` links to an already-existing related record by a unique identifier; `create` creates a brand-new related record at the same time as the parent operation.

- **How would you find all users who have never created a post?**
  `prisma.user.findMany({ where: { posts: { none: {} } } })`, using the `none` relation filter.
