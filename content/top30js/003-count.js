// #3: Count Vowels and Consonants in a String

// 1. Problem
// Given a string, count the number of vowels and consonants.
// Vowels: a, e, i, o, u
// Consonants: All other English letters except vowels.
// Ignore spaces, numbers, and special characters.

// Example:
// Input: "hello world"
// Output: Vowels: 3, Consonants: 7

// 2. Solution

function countVowelsConsonants(str) {
    let vowels = 0;
    let consonants = 0;

    for (let i = 0; i < str.length; i++) {
        let char = str[i].toLowerCase();

        if ("aeiou".includes(char)) {
            vowels++;
        } else if (char >= "a" && char <= "z") {
            consonants++;
        }
    }

    return { vowels, consonants };
}

console.log(countVowelsConsonants("hello world"));
// Output: { vowels: 3, consonants: 7 }

// 3. Code Explanation

// let vowels = 0
// Initializes the vowel counter.

// let consonants = 0
// Initializes the consonant counter.

// for (let i = 0; i < str.length; i++)
// Iterates through every character in the string.

// let char = str[i].toLowerCase()
// Gets the current character and converts it to lowercase.

// "aeiou".includes(char)
// Checks whether the character is a vowel.

// vowels++
// Increases the vowel counter by one.

// char >= "a" && char <= "z"
// Checks whether the character is an English letter.

// consonants++
// Increases the consonant counter by one.

// return { vowels, consonants }
// Returns both counts in an object.

// 4. Dry Run

// Input: "cat"

// Character | Type       | Vowels | Consonants
// c         | Consonant  |   0    |     1
// a         | Vowel      |   1    |     1
// t         | Consonant  |   1    |     2

// Output: { vowels: 1, consonants: 2 }

// 5. Time and Space Complexity

// Time Complexity: O(n)
// The loop visits each character once.

// Space Complexity: O(1)
// Only a fixed number of variables are used.

// 6. Practice Questions

// 1. Count vowels and consonants in "JavaScript".
// 2. Count vowels and consonants in "Hello World 123".
// 3. Count only vowels in a string.
// 4. Count only consonants in a string.
// 5. Find the most frequent vowel in a string.