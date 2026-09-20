# OpenAI APIs — Function Calling (Tool Use)

## 1. What is Function Calling?

Function calling lets you describe functions (tools) your application supports to the model. The model doesn't execute code itself — it decides _when_ a function should be called and _what arguments_ to pass, returning that as structured JSON. Your application then executes the actual function and (optionally) sends the result back for the model to use in its final answer.

```
[User message] -> [Model] -> "I should call get_weather(location='Tokyo')"
                                        |
                          [Your code executes get_weather('Tokyo')]
                                        |
                        [Result sent back to model] -> [Final natural language answer]
```

## 2. Defining a Function/Tool

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a given city",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City name, e.g. 'Tokyo' or 'New York'",
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Temperature unit",
                    },
                },
                "required": ["location"],
            },
        },
    }
]
```

## 3. Full Request-Response Loop (Chat Completions)

```python
from openai import OpenAI
import json

client = OpenAI()

def get_weather(location, unit="celsius"):
    # your actual implementation - call a weather API, etc.
    return {"location": location, "temperature": 22, "unit": unit, "condition": "Sunny"}

messages = [{"role": "user", "content": "What's the weather like in Tokyo?"}]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    tool_choice="auto",  # let the model decide whether to call a tool
)

message = response.choices[0].message

if message.tool_calls:
    messages.append(message)  # add the assistant's tool call request to history

    for tool_call in message.tool_calls:
        if tool_call.function.name == "get_weather":
            args = json.loads(tool_call.function.arguments)
            result = get_weather(**args)

            # send the function result back to the model
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result),
            })

    # get the model's final natural-language response using the tool result
    final_response = client.chat.completions.create(model="gpt-4o", messages=messages, tools=tools)
    print(final_response.choices[0].message.content)
    # "It's currently 22°C and sunny in Tokyo."
```

## 4. `tool_choice` Options

```python
tool_choice="auto"                                       # model decides (default)
tool_choice="none"                                        # force no tool call, text only
tool_choice="required"                                     # force it to call SOME tool
tool_choice={"type": "function", "function": {"name": "get_weather"}}  # force a specific tool
```

## 5. Multiple Tools & Parallel Tool Calls

```python
tools = [
    {"type": "function", "function": {"name": "get_weather", "parameters": {...}}},
    {"type": "function", "function": {"name": "get_stock_price", "parameters": {...}}},
]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What's the weather in Tokyo and the stock price of AAPL?"}],
    tools=tools,
)

# The model may return multiple tool_calls in a single response (parallel calling)
for tool_call in response.choices[0].message.tool_calls:
    print(tool_call.function.name, tool_call.function.arguments)
```

## 6. Building a Full Agent Loop (Multi-Step Tool Use)

```python
def run_agent(user_input, tools, available_functions, max_iterations=5):
    messages = [{"role": "user", "content": user_input}]

    for _ in range(max_iterations):
        response = client.chat.completions.create(
            model="gpt-4o", messages=messages, tools=tools
        )
        message = response.choices[0].message
        messages.append(message)

        if not message.tool_calls:
            return message.content  # model is done, final answer ready

        for tool_call in message.tool_calls:
            fn = available_functions[tool_call.function.name]
            args = json.loads(tool_call.function.arguments)
            result = fn(**args)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result),
            })

    return "Max iterations reached without a final answer."
```

This loop pattern — call model, check for tool calls, execute, feed results back, repeat — is the foundation of most "agentic" LLM applications.

## 7. Function Definition Best Practices

```python
# GOOD: clear, specific descriptions help the model choose correctly
{
    "name": "search_orders",
    "description": "Search the customer's order history by date range or order status. Use this when the user asks about past orders, shipping status, or order history.",
    "parameters": {
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "enum": ["pending", "shipped", "delivered", "cancelled"],
            },
            "start_date": {"type": "string", "format": "date"},
            "end_date": {"type": "string", "format": "date"},
        },
    },
}
```

```python
# BAD: vague name/description leads to incorrect or missed tool calls
{
    "name": "do_thing",
    "description": "Does something with orders",
    "parameters": {"type": "object", "properties": {"x": {"type": "string"}}},
}
```

## 8. Handling Errors in Tool Execution

```python
for tool_call in message.tool_calls:
    try:
        args = json.loads(tool_call.function.arguments)
        result = execute_function(tool_call.function.name, args)
    except Exception as e:
        result = {"error": str(e)}  # let the model see the error and decide how to respond

    messages.append({
        "role": "tool",
        "tool_call_id": tool_call.id,
        "content": json.dumps(result),
    })
```

Returning structured errors (instead of crashing) lets the model gracefully inform the user ("I wasn't able to fetch that information") rather than your application failing entirely.

## 9. Security Considerations

1. **Never blindly execute arbitrary code/commands** the model suggests — only call pre-defined, vetted functions with validated arguments.
2. **Validate/sanitize arguments** before use (e.g., check `location` isn't attempting SQL injection if used in a query).
3. **Apply permission checks** — a function that can delete data should verify the requesting user actually has permission, not just trust the model's decision to call it.
4. **Rate-limit and monitor tool calls**, especially for functions that cost money or hit external APIs.

```python
def get_weather(location, unit="celsius"):
    if not isinstance(location, str) or len(location) > 100:
        raise ValueError("Invalid location")
    # proceed safely
```

## 10. Function Calling vs Structured Outputs

```
Function Calling: model decides WHETHER and WHICH function to call, and generates arguments
Structured Outputs: model is FORCED to return output matching a specific JSON schema
                     (can be used standalone for structured data extraction, no "calling" involved)
```

See `04-Structured-Outputs.md` for the JSON schema-constrained generation approach, which is often combined with function calling to guarantee valid argument JSON.

## 11. Best Practices

1. Write clear, specific function names and descriptions — this is effectively your "API documentation" for the model.
2. Use `enum` for constrained parameter values instead of free-text strings where possible.
3. Always validate/sanitize arguments before executing real functions — never trust model output blindly.
4. Use `tool_choice="required"` when you specifically want a tool call, `"none"` when you want to force text-only.
5. Handle tool execution errors gracefully and feed them back to the model rather than crashing.
6. Cap agent loop iterations (`max_iterations`) to avoid infinite loops/runaway costs.
