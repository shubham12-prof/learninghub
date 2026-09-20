# Q1: What is the difference between Block and Inline elements?

Answer:

Block-level elements (<div>, <p>, <h1>, <section>) always start on a new line and stretch to take up the full available width of their parent container. You can safely apply vertical margins and padding to them.

Inline elements (<span>, <a>, <strong>, <em>) do not start on a new line; they sit right next to each other and only take up as much width as their content needs. Vertical margins and padding do not affect their layout separation from other lines.

# Q2: What does the defer attribute do when loading a script tag, and how does it compare to async?

Answer:
By default, scripts block HTML parsing while they are downloaded and executed.

async: The script downloads in the background while HTML parsing continues. The moment it finishes downloading, HTML parsing pauses so the script can execute. Best for independent utility scripts (like analytics).

defer: The script downloads in the background while HTML parsing continues. Execution is strictly delayed until the entire HTML document has finished parsing. It also maintains the original order of your scripts. Best for main app logic that relies on the full DOM being ready.
