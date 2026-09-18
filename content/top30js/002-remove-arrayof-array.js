// JavaScript compares arrays by reference, not by their contents.
// That's why [...new Set(arr)] does not remove duplicate arrays.
// We need to compare the contents of the arrays instead.
function removeDuplicateArrays(arr) {
    const result = [];

    for (let i = 0; i < arr.length; i++) {

        const current = JSON.stringify(arr[i]);

        let alreadyExists = false;

        for (let j = 0; j < result.length; j++) {
            if (JSON.stringify(result[j]) === current) {
                alreadyExists = true;
                break;
            }
        }

        if (!alreadyExists) {
            result.push(arr[i]);
        }
    }

    return result;
}

console.log(
    removeDuplicateArrays([
        [1, 2],
        [3, 4],
        [1, 2],
        [5, 6],
        [3, 4]
    ])
);