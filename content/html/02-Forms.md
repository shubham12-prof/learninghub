Q1: How do you handle form validation natively in HTML5?
Answer:
HTML5 introduces built-in validation attributes that handle basic validation rules without requiring JavaScript:

required: Ensures the input field cannot be left blank.

pattern: Uses a Regular Expression (Regex) to validate the format (e.g., specific password rules).

min / max: Sets limits for number and date inputs.

minlength / maxlength: Sets character limits for text inputs.

type: Choosing types like email or url forces the browser to check for valid formats.

HTML

<form>
  <label for="username">Username (3-10 characters):</label>
  <input type="text" id="username" name="username" required minlength="3" maxlength="10">
  
  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required>
  
  <button type="submit">Submit</button>
</form>

Q2: What is the purpose of the <label> tag's for attribute?
Answer:
The for attribute explicitly binds a label to a specific form input field by matching the input's id.

Benefits:

Accessibility: Screen readers read the label aloud when the user focuses on the connected input field.

User Experience: It increases the clickable target area. Clicking the label automatically places focus on or toggles the associated input (very helpful for small checkboxes and radio buttons).

HTML

<!-- Explicit binding -->
<input type="checkbox" id="subscribe" name="subscribe">
<label for="subscribe">Subscribe to newsletter</label>
