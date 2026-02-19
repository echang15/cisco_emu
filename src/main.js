import { Terminal } from './terminal.js';
import { IOSSystem } from './ios_system.js';

document.addEventListener('DOMContentLoaded', () => {
  const terminal = new Terminal('terminal', {
    prompt: 'Switch>',
    onLine: (line) => {
      system.processCommand(line);
    }
  });

  const system = new IOSSystem(terminal);
});
