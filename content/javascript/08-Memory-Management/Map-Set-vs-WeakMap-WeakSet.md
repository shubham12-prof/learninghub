# Map/Set vs WeakMap/WeakSet

|             | Map / Set              | WeakMap / WeakSet  |
| ----------- | ---------------------- | ------------------ |
| Key type    | any                    | objects only       |
| Held        | strongly (prevents GC) | weakly (allows GC) |
| Iterable    | yes                    | no                 |
| Has `.size` | yes                    | no                 |
