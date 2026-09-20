# 11. Mongoose

## What is Mongoose?

Mongoose is an **ODM (Object Data Modeling)** library for MongoDB and Node.js. It sits on top of the native MongoDB driver, adding:

- Schema definition and validation
- Type casting
- Middleware (hooks) for pre/post operations
- Model methods and query building
- Relationship population (joins-like behavior)

```bash
npm install mongoose
```

## Connecting to MongoDB

```js
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Connection error:", err));
```

## Defining a Schema

```js
const { Schema } = require("mongoose");

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    age: { type: Number, min: 0, max: 120 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // automatically adds createdAt/updatedAt
  },
);
```

## Creating a Model

```js
const User = mongoose.model("User", userSchema);
```

Mongoose automatically pluralizes and lowercases the model name to determine the collection name (`'User'` → `users` collection).

## CRUD with Mongoose

```js
// Create
const user = await User.create({ name: "Alice", email: "alice@example.com" });
// or:
const user2 = new User({ name: "Bob", email: "bob@example.com" });
await user2.save();

// Read
const allUsers = await User.find();
const activeUsers = await User.find({ role: "admin" });
const oneUser = await User.findById(userId);
const byEmail = await User.findOne({ email: "alice@example.com" });

// Update
await User.findByIdAndUpdate(
  userId,
  { age: 31 },
  { new: true, runValidators: true },
);
await User.updateMany({ role: "user" }, { $set: { verified: true } });

// Delete
await User.findByIdAndDelete(userId);
await User.deleteMany({ verified: false });
```

## Validation

Mongoose enforces schema-level validation automatically on `save()` and `create()` (but **not** by default on `findByIdAndUpdate` — you must opt in via `runValidators: true`).

```js
const productSchema = new Schema({
  name: { type: String, required: [true, "Name is required"] },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"],
  },
  category: {
    type: String,
    enum: {
      values: ["electronics", "clothing", "food"],
      message: "{VALUE} is not a valid category",
    },
  },
});

try {
  await Product.create({ name: "", price: -10 });
} catch (err) {
  console.log(err.errors); // { name: ValidatorError, price: ValidatorError }
}
```

### Custom Validators

```js
const userSchema = new Schema({
  email: {
    type: String,
    validate: {
      validator: (v) => /^\S+@\S+\.\S+$/.test(v),
      message: (props) => `${props.value} is not a valid email address`,
    },
  },
});
```

## Middleware (Hooks) — Pre/Post

Run logic automatically before or after certain operations.

```js
const bcrypt = require("bcrypt");

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // only re-hash if password changed
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.post("save", function (doc) {
  console.log(`User ${doc.email} was saved`);
});
```

Common hook types: `pre('save')`, `pre('findOneAndUpdate')`, `pre('deleteOne')`, `post('save')`, `post('find')`, etc.

## Instance Methods and Statics

```js
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};
```

```js
const user = await User.findByEmail("alice@example.com"); // static method
const isMatch = await user.comparePassword("plainPassword"); // instance method
```

## Virtuals — Computed Fields (Not Stored in DB)

```js
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set("toJSON", { virtuals: true }); // include virtuals when converting to JSON
```

## Population — Joining Referenced Documents

```js
const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  total: Number,
});

const Order = mongoose.model("Order", orderSchema);

const order = await Order.findById(orderId).populate("userId");
console.log(order.userId.name); // the referenced User document, fully populated
```

### Selective Population

```js
const order = await Order.findById(orderId).populate("userId", "name email"); // only these fields
```

### Nested/Deep Population

```js
const order = await Order.findById(orderId).populate({
  path: "userId",
  populate: { path: "company", select: "name" },
});
```

## Embedded (Subdocument) Schemas

```js
const addressSchema = new Schema(
  {
    street: String,
    city: String,
    zip: String,
  },
  { _id: false },
); // no separate _id for the subdocument, if not needed

const userSchema = new Schema({
  name: String,
  address: addressSchema,
});
```

## Query Building (Chainable API)

```js
const results = await User.find({ role: "user" })
  .select("name email")
  .sort({ createdAt: -1 })
  .skip(10)
  .limit(20)
  .lean(); // returns plain JS objects instead of Mongoose documents — faster for read-only use cases
```

## Indexes in Mongoose

```js
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ name: 1, createdAt: -1 }); // compound index
```

## Transactions with Mongoose

```js
const session = await mongoose.startSession();

await session.withTransaction(async () => {
  const from = await Account.findById(fromId).session(session);
  const to = await Account.findById(toId).session(session);

  from.balance -= amount;
  to.balance += amount;

  await from.save({ session });
  await to.save({ session });
});

session.endSession();
```

## Schema Options Cheat Sheet

```js
const schema = new Schema(
  {
    /* fields */
  },
  {
    timestamps: true, // auto createdAt/updatedAt
    versionKey: false, // disable the __v field
    toJSON: { virtuals: true }, // include virtuals in JSON output
    collection: "custom_name", // override the default collection name
  },
);
```

## Common Pitfalls

```js
// Forgetting runValidators — schema validation is skipped on updates by default!
await User.findByIdAndUpdate(id, { age: -5 }); // succeeds without runValidators, even though min: 0 is set

// Correct:
await User.findByIdAndUpdate(id, { age: -5 }, { runValidators: true }); // now properly rejected
```

```js
// Comparing an ObjectId to a string directly won't work as expected in plain JS comparisons
if (order.userId === currentUserId) {
  /* often WRONG — ObjectId isn't a primitive string */
}

// Correct:
if (order.userId.equals(currentUserId)) {
  /* or */
}
if (order.userId.toString() === currentUserId.toString()) {
  /* also correct */
}
```

## Mongoose vs Native MongoDB Driver

|                    | Native Driver                                | Mongoose                                                        |
| ------------------ | -------------------------------------------- | --------------------------------------------------------------- |
| Schema enforcement | None (fully flexible)                        | Enforced via defined schemas                                    |
| Validation         | Manual                                       | Built-in, declarative                                           |
| Boilerplate        | More manual work                             | Less boilerplate for common patterns                            |
| Performance        | Slightly faster (no abstraction overhead)    | Small overhead from schema casting/validation                   |
| Relationships      | Manual `$lookup` or app-level joins          | `populate()` convenience                                        |
| Best for           | Performance-critical paths, full flexibility | Most typical application development, faster to build correctly |

## Common Interview-Style Questions

- **What is Mongoose, and what problem does it solve?**
  An ODM library that adds schema definition, validation, middleware, and relationship population on top of the native MongoDB driver, reducing boilerplate and enforcing structure in an otherwise schema-less database.

- **Why doesn't schema validation run automatically on `findByIdAndUpdate`?**
  Because Mongoose's update operations bypass document validation by default for performance/behavioral reasons — you must explicitly opt in with `{ runValidators: true }`.

- **What does `populate()` do, and what's its trade-off?**
  It resolves a referenced ObjectId field into the actual referenced document(s), similar to a SQL join; the trade-off is it requires an additional query (or `$lookup` under the hood) rather than being a true database-level join, which can affect performance for deeply nested populations.

- **What's the difference between an instance method and a static method in a Mongoose schema?**
  Instance methods (`schema.methods`) are called on individual documents (`user.comparePassword()`); static methods (`schema.statics`) are called on the model itself (`User.findByEmail()`).

- **When would you use `.lean()` on a query, and what's the trade-off?**
  When you only need plain data (read-only use cases like an API response) and don't need Mongoose document features (virtuals, methods, change tracking) — it returns plain JS objects, which is faster and uses less memory, at the cost of losing those document features.
