Q1: What is the difference between CSS Transitions and CSS Animations?
Answer:

Transitions: Best for simple, state-to-state changes. They require a trigger mechanism (like :hover, :focus, or an active class change via JavaScript) to smoothly interpolate values between an explicit start state and an end state.

Animations (@keyframes): Best for complex, multi-step visual effects. They do not require a user interaction trigger to start, can loop infinitely, and let you create micro-steps (0%, 50%, 100%) to fine-tune properties dynamically over time.

CSS
/_ Transition Example _/
.card {
transition: transform 0.3s ease-in-out;
}
.card:hover {
transform: translateY(-5px);
}

/_ Keyframe Animation Example _/
@keyframes spin {
0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }
}
.loader {
animation: spin 1s linear infinite;
}
