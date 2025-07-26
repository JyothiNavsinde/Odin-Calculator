// --- Basic Math Functions ---
function add(a, b) {
    return a + b;
}

function sub(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}

function divide(a, b) {
    if (b === 0) {
        return "Can't divide by 0!"; // Snarky error message
    }
    return a / b;
}

// --- Global Calculator State Variables ---
let num1 = null;          // Stores the first number of an operation
let num2 = null;          // Stores the second number of an operation
let operator = null;      // Stores the selected operator (+, -, *, /)
let dispNum = "";         // Represents the current number shown on the display
let awaitingNewNumber = false; // Flag: true if the next digit pressed should start a new number

// --- DOM Elements ---
const calDisp = document.querySelector(".calcDisp");
const digitButtons = document.querySelectorAll('.digit');
const operatorButtons = document.querySelectorAll('.operator');
const equalsButton = document.querySelector('.equals');
const clearButton = document.querySelector('.clear');
const backspaceButton = document.querySelector('.backspace');
const decimalButton = document.querySelector('.decimal');

// --- Core Operate Function ---
function operate(firstNum, secondNum, op) {
    // Ensure numbers are parsed as floats for calculations
    firstNum = parseFloat(firstNum);
    secondNum = parseFloat(secondNum);

    let result;
    switch (op) {
        case '+':
            result = add(firstNum, secondNum);
            break;
        case '-':
            result = sub(firstNum, secondNum);
            break;
        case '*':
            result = multiply(firstNum, secondNum);
            break;
        case '/':
            result = divide(firstNum, secondNum);
            break;
        default:
            return "Error!"; // Should not happen with proper button handling
    }

    // Handle division by zero error from the divide function
    if (typeof result === 'string' && result.includes("Can't divide by 0")) {
        return result;
    }

    // Round answers with long decimals
    // Multiplied by 10^7 and divided back to handle floating point inaccuracies
    return Math.round(result * 10000000) / 10000000;
}

// --- Display Update Function ---
function updateDisplay(value) {
    calDisp.value = value;
}

// --- Button Click Handlers ---

// Digit Buttons (0-9) and Decimal Point
digitButtons.forEach(button => {
    button.addEventListener('click', () => appendToDisplay(button.dataset.digit));
});

// Decimal Button specifically (can be included in digitButtons, but kept separate for clarity)
if (decimalButton) {
    decimalButton.addEventListener('click', () => appendToDisplay(decimalButton.dataset.digit));
}

function appendToDisplay(digit) {
    // If we're awaiting a new number (after an operator or equals), clear the display
    if (awaitingNewNumber) {
        dispNum = ""; // Reset dispNum
        awaitingNewNumber = false;
    }

    // Prevent multiple decimal points
    if (digit === '.' && dispNum.includes('.')) {
        return;
    }

    // If current display is "0" and a non-decimal digit is pressed, replace "0"
    if (dispNum === "0" && digit !== '.') {
        dispNum = digit;
    } else {
        dispNum += digit;
    }

    updateDisplay(dispNum);
}

// Operator Buttons (+, -, *, /)
operatorButtons.forEach(button => {
    button.addEventListener('click', () => {
        // If there's no first number yet, set the current display as num1
        if (num1 === null) {
            num1 = dispNum;
        }
        // If num1, a previous operator, and a second number (dispNum) are ready
        // (This handles chained operations like 12 + 7 - 1)
        else if (operator && dispNum !== "") {
            num2 = dispNum;
            let currentResult = operate(num1, num2, operator);

            // If the operation resulted in a division by zero error
            if (typeof currentResult === 'string' && currentResult.includes("Can't divide by 0")) {
                updateDisplay(currentResult);
                // Reset state after error
                num1 = null;
                num2 = null;
                operator = null;
                dispNum = ""; // Clear internal dispNum for new input
                awaitingNewNumber = true; // Still await new number to clear error message
                return;
            }

            updateDisplay(currentResult);
            num1 = currentResult; // Set the result as the new first number
            dispNum = String(currentResult); // Keep the result in dispNum for potential chaining
        }
        // Always update the operator to the last one pressed (handles consecutive operator presses)
        operator = button.dataset.operator;
        awaitingNewNumber = true; // Next digit input should start a new number
    });
});

// Equals Button
equalsButton.addEventListener('click', () => {
    // Only perform operation if we have num1, an operator, and a valid number on display
    if (num1 !== null && operator !== null && dispNum !== "") {
        num2 = dispNum; // The current display value is the second number

        let finalResult = operate(num1, num2, operator);

        // Handle division by zero for the final result
        if (typeof finalResult === 'string' && finalResult.includes("Can't divide by 0")) {
            updateDisplay(finalResult);
            // Reset state after error
            num1 = null;
            num2 = null;
            operator = null;
            dispNum = "";
            awaitingNewNumber = true;
            return;
        }

        updateDisplay(finalResult);
        num1 = finalResult; // Store the result in num1 for potential further operations
        num2 = null;       // Reset num2
        operator = null;   // Reset operator
        dispNum = String(finalResult); // Update dispNum with the result
        awaitingNewNumber = true; // Next digit input after equals should start a new number
    }
});

// Clear Button
if (clearButton) {
    clearButton.addEventListener('click', () => {
        num1 = null;
        num2 = null;
        operator = null;
        dispNum = "";
        awaitingNewNumber = false;
        updateDisplay("0"); // Reset display to "0"
    });
}

// Backspace Button
if (backspaceButton) {
    backspaceButton.addEventListener('click', () => {
        // Only backspace if not awaiting a new number and dispNum isn't empty
        if (!awaitingNewNumber && dispNum.length > 0) {
            dispNum = dispNum.slice(0, -1); // Remove the last character
            updateDisplay(dispNum === "" ? "0" : dispNum); // If empty, show "0"
        } else if (awaitingNewNumber) {
            // If awaiting new number (e.g., after an operation and before next digit),
            // pressing backspace should clear the displayed result and prepare for new input.
            // Or simply ignore it. For simplicity, we'll just reset dispNum to current num1 if exists.
            // This is a design choice, could also just ignore.
            if (num1 !== null && operator === null) { // If a result is showing from previous calculation
                 dispNum = String(num1);
                 awaitingNewNumber = false;
                 updateDisplay(dispNum);
            } else {
                 dispNum = "";
                 awaitingNewNumber = false;
                 updateDisplay("0");
            }
        }
    });
}

// --- Keyboard Support ---
document.addEventListener('keydown', (e) => {
    // Check for digit keys (0-9)
    if (e.key >= '0' && e.key <= '9') {
        appendToDisplay(e.key);
    }
    // Check for decimal point
    else if (e.key === '.') {
        appendToDisplay('.');
    }
    // Check for operators
    else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        // Map keyboard / to data-operator / (which is '÷' visually)
        // Map keyboard * to data-operator * (which is '×' visually)
        const correspondingButton = document.querySelector(`.operator[data-operator="${e.key}"]`);
        if (correspondingButton) {
            correspondingButton.click(); // Simulate a click on the button
        }
    }
    // Check for Enter key for '='
    else if (e.key === 'Enter') {
        equalsButton.click();
    }
    // Check for Backspace key for 'DEL'
    else if (e.key === 'Backspace') {
        backspaceButton.click();
    }
    // Check for 'c' or 'C' for 'Clear'
    else if (e.key === 'c' || e.key === 'C') {
        clearButton.click();
    }
});

// Initial display setup
updateDisplay("0");