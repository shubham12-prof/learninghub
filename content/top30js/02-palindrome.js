/*
  Top 30 - #2: Palindrome

  PROBLEM: check if a string reads the same forwards and backwards.
  Example: "racecar" -> true, "hello" -> false
  Usually should ignore case and non-alphanumeric characters (spaces,
  punctuation) - e.g. "A man a plan a canal Panama" -> true
*/

function isPalindrome(str) {
  // Clean the string: lowercase it, and strip out anything that's not
  // a letter or number, using a regex.
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");

  const reversed = cleaned.split("").reverse().join("");

  return cleaned === reversed;
}

console.log(isPalindrome("racecar"));                    // true
console.log(isPalindrome("hello"));                       // false
console.log(isPalindrome("A man a plan a canal Panama")); // true


// -----------------------------------------------------------------
// Two pointer version (no extra reversed string needed)
// -----------------------------------------------------------------
function isPalindromeTwoPointers(str) {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");

  let left = 0;
  let right = cleaned.length - 1;

  while (left < right) {
    if (cleaned[left] !== cleaned[right]) {
      return false; // mismatch found - not a palindrome
    }
    left++;
    right--;
  }

  return true; // pointers met/crossed without any mismatch
}

console.log(isPalindromeTwoPointers("racecar")); // true

/*
  TIME COMPLEXITY: O(n)
  SPACE COMPLEXITY: O(n) for the cleaned string (regex replace makes a
  new string); the two-pointer check itself uses O(1) extra space.
*/

// simple one
function palinTwo(str) {
  let left = 0;
  let right = str.length - 1;

  while (left < right) {

    if (str[left] !== str[right]) {
      return "no";
    }

    left++;
    right--;
  }

  return "yes";
}

console.log(palinTwo("hello"));  // no
console.log(palinTwo("madam"));  // yes
console.log(palinTwo("racecar")); // yes
