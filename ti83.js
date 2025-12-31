 class TI83Emulator {
    constructor() {
        this.display = document.getElementById('display');
        this.history = document.getElementById('history');
        this.currentInput = '0';
        this.previousInput = '';
        this.operation = null;
        this.memory = 0;
        this.degreeMode = true; // true = degrees, false = radians
        this.secondMode = false;
        this.alphaMode = false;
        
        this.initializeButtons();
    }

    initializeButtons() {
        const buttons = document.querySelectorAll('.key');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleKeyPress(button.dataset.key);
            });
        });
    }

    handleKeyPress(key) {
        // Vibration feedback sur Android
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }

        switch(key) {
            case 'clear':
                this.clear();
                break;
            case 'del':
                this.delete();
                break;
            case 'enter':
                this.calculate();
                break;
            case '+':
            case '-':
            case '*':
            case '/':
            case '^':
                this.setOperation(key);
                break;
            case '(−)':
                this.negate();
                break;
            case 'sin':
            case 'cos':
            case 'tan':
            case 'log':
            case 'ln':
                this.applyFunction(key);
                break;
            case 'x²':
                this.square();
                break;
            case '⁻¹':
                this.inverse();
                break;
            case '(':
            case ')':
            case '.':
                this.appendToDisplay(key);
                break;
            case '2nd':
                this.secondMode = !this.secondMode;
                this.updateDisplay();
                break;
            case 'alpha':
                this.alphaMode = !this.alphaMode;
                this.updateDisplay();
                break;
            case 'on':
                this.clear();
                break;
            case 'mode':
                this.degreeMode = !this.degreeMode;
                this.showMessage(this.degreeMode ? 'Degree Mode' : 'Radian Mode');
                break;
            default:
                if (!isNaN(key)) {
                    this.appendNumber(key);
                }
        }
    }

    appendNumber(num) {
        if (this.currentInput === '0' || this.currentInput === 'Error') {
            this.currentInput = num;
        } else {
            this.currentInput += num;
        }
        this.updateDisplay();
    }

    appendToDisplay(char) {
        if (this.currentInput === '0' || this.currentInput === 'Error') {
            this.currentInput = char;
        } else {
            this.currentInput += char;
        }
        this.updateDisplay();
    }

    delete() {
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }

    clear() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operation = null;
        this.history.textContent = '';
        this.updateDisplay();
    }

    negate() {
        if (this.currentInput !== '0') {
            if (this.currentInput.startsWith('-')) {
                this.currentInput = this.currentInput.substring(1);
            } else {
                this.currentInput = '-' + this.currentInput;
            }
            this.updateDisplay();
        }
    }

    setOperation(op) {
        if (this.operation && this.previousInput) {
            this.calculate();
        }
        this.operation = op;
        this.previousInput = this.currentInput;
        this.history.textContent = `${this.previousInput} ${this.getOperationSymbol(op)}`;
        this.currentInput = '0';
    }

    getOperationSymbol(op) {
        const symbols = {
            '+': '+',
            '-': '−',
            '*': '×',
            '/': '÷',
            '^': '^'
        };
        return symbols[op] || op;
    }

    calculate() {
        if (!this.operation || !this.previousInput) return;

        const prev = this.evaluateExpression(this.previousInput);
        const current = this.evaluateExpression(this.currentInput);
        let result;

        switch(this.operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                result = current !== 0 ? prev / current : 'Error';
                break;
            case '^':
                result = Math.pow(prev, current);
                break;
            default:
                return;
        }

        this.history.textContent = `${this.previousInput} ${this.getOperationSymbol(this.operation)} ${this.currentInput}`;
        this.currentInput = result === 'Error' ? 'Error' : this.formatResult(result);
        this.previousInput = '';
        this.operation = null;
        this.updateDisplay();
    }

    evaluateExpression(expr) {
        try {
            // Remplacer les symboles pour l'évaluation
            expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
            return Function('"use strict"; return (' + expr + ')')();
        } catch (e) {
            return NaN;
        }
    }

    applyFunction(func) {
        const value = this.evaluateExpression(this.currentInput);
        let result;

        switch(func) {
            case 'sin':
                result = this.degreeMode ? Math.sin(value * Math.PI / 180) : Math.sin(value);
                break;
            case 'cos':
                result = this.degreeMode ? Math.cos(value * Math.PI / 180) : Math.cos(value);
                break;
            case 'tan':
                result = this.degreeMode ? Math.tan(value * Math.PI / 180) : Math.tan(value);
                break;
            case 'log':
                result = Math.log10(value);
                break;
            case 'ln':
                result = Math.log(value);
                break;
            default:
                return;
        }

        this.history.textContent = `${func}(${this.currentInput})`;
        this.currentInput = this.formatResult(result);
        this.updateDisplay();
    }

    square() {
        const value = this.evaluateExpression(this.currentInput);
        this.history.textContent = `(${this.currentInput})²`;
        this.currentInput = this.formatResult(Math.pow(value, 2));
        this.updateDisplay();
    }

    inverse() {
        const value = this.evaluateExpression(this.currentInput);
        if (value !== 0) {
            this.history.textContent = `(${this.currentInput})⁻¹`;
            this.currentInput = this.formatResult(1 / value);
        } else {
            this.currentInput = 'Error';
        }
        this.updateDisplay();
    }

    formatResult(num) {
        if (isNaN(num) || !isFinite(num)) return 'Error';
        
        // Arrondir à 10 décimales pour éviter les erreurs de précision
        num = Math.round(num * 10000000000) / 10000000000;
        
        // Notation scientifique pour les très grands/petits nombres
        if (Math.abs(num) > 9999999999 || (Math.abs(num) < 0.0001 && num !== 0)) {
            return num.toExponential(6);
        }
        
        return num.toString();
    }

    showMessage(msg) {
        const prevDisplay = this.currentInput;
        this.currentInput = msg;
        this.updateDisplay();
        setTimeout(() => {
            this.currentInput = prevDisplay;
            this.updateDisplay();
        }, 1500);
    }

    updateDisplay() {
        this.display.textContent = this.currentInput;
    }
}

// Initialiser l'émulateur au chargement
document.addEventListener('DOMContentLoaded', () => {
    new TI83Emulator();
});
