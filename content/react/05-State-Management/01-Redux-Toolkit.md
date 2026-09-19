# Redux Toolkit

The official, recommended way to write Redux logic — reduces boilerplate compared to classic Redux (no manual action type constants, switch-based reducers, or `combineReducers` wiring by hand). Uses Immer internally, so you can write "mutating" logic that's actually applied immutably.

```jsx
// features/counter/counterSlice.js
import { createSlice } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    }, // looks mutating, Immer makes it immutable
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

```jsx
// store.js
import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./features/counter/counterSlice";

export const store = configureStore({
  reducer: { counter: counterReducer }, // no manual combineReducers needed
});
```

```jsx
// App.jsx
import { Provider, useSelector, useDispatch } from "react-redux";
import { increment } from "./features/counter/counterSlice";

function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();
  return <button onClick={() => dispatch(increment())}>{count}</button>;
}

function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}
```

**Async logic — `createAsyncThunk`:**

```jsx
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const fetchUser = createAsyncThunk("user/fetch", async (id) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});

const userSlice = createSlice({
  name: "user",
  initialState: { data: null, status: "idle" },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      });
  },
});
```

**Interview note:** Redux Toolkit is best for **large, complex apps** with lots of shared, frequently-updating state and a need for predictable, traceable state transitions (great with Redux DevTools' time-travel debugging).
