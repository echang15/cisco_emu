export class Terminal {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.history = [];
        this.currentInput = "";
        this.promptText = options.prompt || "Switch>";
        this.onLine = options.onLine || (() => {});
        
        this.init();
    }

    init() {
        // Create a wrapper for the current input line
        this.inputLineContainer = document.createElement('div');
        this.inputLineContainer.className = 'input-line';
        this.container.appendChild(this.inputLineContainer);

        // Prompt element
        this.promptElem = document.createElement('span');
        this.promptElem.className = 'prompt';
        this.promptElem.textContent = this.promptText;
        this.inputLineContainer.appendChild(this.promptElem);

        // Input content element
        this.inputContentElem = document.createElement('span');
        this.inputLineContainer.appendChild(this.inputContentElem);

        // Cursor element
        this.cursorElem = document.createElement('span');
        this.cursorElem.className = 'cursor';
        this.cursorElem.innerHTML = "&nbsp;"; // Non-breaking space to give it width
        this.inputLineContainer.appendChild(this.cursorElem);

        // Global key listener
        window.addEventListener('keydown', (e) => this.handleInput(e));
        
        // Focus handler - keep focus on checks
        document.addEventListener('click', () => {
           // Maybe focus a hidden input if we were using one, but global listener works for now
        });
    }

    setPrompt(prompt) {
        this.promptText = prompt;
        this.promptElem.textContent = this.promptText;
    }

    print(text) {
        // Before printing, remove the current input line from the bottom
        this.container.removeChild(this.inputLineContainer);

        // Create a new line for the text
        const line = document.createElement('div');
        line.className = 'line';
        line.textContent = text;
        this.container.appendChild(line);

        // Re-append the input line at the bottom
        this.container.appendChild(this.inputLineContainer);
        
        this.scrollToBottom();
    }

    handleInput(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.processLine();
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            this.currentInput = this.currentInput.slice(0, -1);
            this.renderInput();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            this.currentInput += e.key;
            this.renderInput();
        }
        // Handle other keys (arrows, tab) later
    }

    renderInput() {
        this.inputContentElem.textContent = this.currentInput;
        this.scrollToBottom();
    }

    processLine() {
        const input = this.currentInput;
        
        // Remove the current input line logic from DOM to "finalize" it
        this.container.removeChild(this.inputLineContainer);

        // Print the completed line as static text
        const staticLine = document.createElement('div');
        staticLine.className = 'line';
        staticLine.textContent = this.promptText + input;
        this.container.appendChild(staticLine);

        // Reset input
        this.currentInput = "";
        this.renderInput();

        // Re-append input line for next command
        this.container.appendChild(this.inputLineContainer);
        this.scrollToBottom();

        // Callback
        if (input.trim().length > 0) {
            this.onLine(input);
        } else {
             // Just a newline, maybe reprint prompt?
             // specific logic might be needed here, but for now it just shows the new prompt line
        }
    }

    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }

    clear() {
        // Remove all content and recreate the input line
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        this.inputLineContainer = document.createElement('div');
        this.inputLineContainer.className = 'input-line';
        this.container.appendChild(this.inputLineContainer);

        this.promptElem = document.createElement('span');
        this.promptElem.className = 'prompt';
        this.promptElem.textContent = this.promptText;
        this.inputLineContainer.appendChild(this.promptElem);

        this.inputContentElem = document.createElement('span');
        this.inputLineContainer.appendChild(this.inputContentElem);

        this.cursorElem = document.createElement('span');
        this.cursorElem.className = 'cursor';
        this.cursorElem.innerHTML = "&nbsp;";
        this.inputLineContainer.appendChild(this.cursorElem);

        this.currentInput = "";
        this.renderInput();
        this.scrollToBottom();
    }
}
