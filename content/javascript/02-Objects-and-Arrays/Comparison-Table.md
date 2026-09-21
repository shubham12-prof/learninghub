# Comparison Table

| Method     | Returns       | Mutates original? | Use case                |
| ---------- | ------------- | ----------------- | ----------------------- |
| map        | new array     | No                | transform each item     |
| filter     | new array     | No                | select matching items   |
| reduce     | any value     | No                | accumulate to one value |
| find       | single item   | No                | first match             |
| some/every | boolean       | No                | condition check         |
| flat       | new array     | No                | flatten nesting         |
| sort       | same array    | **Yes**           | ordering                |
| splice     | removed items | **Yes**           | insert/remove in place  |
| slice      | new array     | No                | extract a range         |
