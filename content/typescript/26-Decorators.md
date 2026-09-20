# Decorators

A special declaration (`@expression` syntax) that can be attached to classes, methods, properties, or parameters to modify or annotate their behavior — commonly used in frameworks like Angular and NestJS, and by libraries like TypeORM.

**Enabling decorators (legacy experimental decorators, still the most common in real-world frameworks):**

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

```ts
// A simple class decorator — receives the constructor function
function Logger(constructor: Function) {
  console.log(`Class created: ${constructor.name}`);
}

@Logger
class UserService {}
// Logs "Class created: UserService" when the class is DEFINED (not instantiated)
```

**Method decorators — can wrap/modify a method's behavior:**

```ts
function LogExecutionTime(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const start = Date.now();
    const result = original.apply(this, args);
    console.log(`${propertyKey} took ${Date.now() - start}ms`);
    return result;
  };
}

class Api {
  @LogExecutionTime
  fetchData() {
    /* ... */
  }
}
```

**Decorator factories — a function that RETURNS a decorator, allowing arguments:**

```ts
function MinLength(length: number) {
  return function (target: any, propertyKey: string) {
    // registers validation metadata for this property
  };
}

class User {
  @MinLength(3)
  name!: string;
}
```

**Real-world framework examples (illustrating the pattern, not full working code):**

```ts
// NestJS-style — decorators declare routes, injectable services, dependency injection
@Controller("users")
class UserController {
  @Get(":id")
  getUser(@Param("id") id: string) {
    /* ... */
  }
}

// TypeORM-style — decorators declare database entity mapping
@Entity()
class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;
}
```

**Interview note:** decorators are still an evolving part of the language — the "legacy"/experimental decorators (`experimentalDecorators: true`) are what most current frameworks (Angular, NestJS) use today, while a newer ECMAScript decorators proposal has since been standardized with some API differences; know that both exist, and that framework documentation dictates which one a given project needs.
