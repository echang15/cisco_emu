export class CommandParser {
    static tokenize(input) {
        if (!input) return [];
        const tokens = [];
        let currentToken = '';
        let inQuotes = false;

        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }

            if (char === ' ' && !inQuotes) {
                if (currentToken.length > 0) {
                    tokens.push(currentToken);
                    currentToken = '';
                }
            } else {
                currentToken += char;
            }
        }

        if (currentToken.length > 0) {
            tokens.push(currentToken);
        }

        return tokens;
    }

    /* 
     * Helper to resolve partial command matches in the future.
     * For now, exact match or simple startsWith logic can be done in the system.
     */
    static normalize(token, candidates) {
        // TODO: Implement partial matching (e.g. 'conf' -> 'configure')
        return token;
    }
}
