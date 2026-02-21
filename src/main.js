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

  // Preload a richer dummy configuration for demo / show running-config
  // VLANs
  system.vlanDb.addVlan(10, 'Marketing');
  system.vlanDb.addVlan(20, 'Sales');
  system.vlanDb.addVlan(30, 'Voice');
  system.vlanDb.addVlan(800, 'DMZ');
  system.vlanDb.addVlan(900, 'Guest');
  // Bulk-assign interfaces for demo:
  // - Many ports -> access VLAN 900
  // - A few ports -> access VLAN 800
  // - Gi1/24 stays on VLAN 1
  for (let i = 1; i <= 48; i++) {
    const name = `Gi1/${i}`;
    const iface = system.interfaceDb.getInterface(name);
    if (!iface) continue;

    // Default to access mode for clarity in running-config
    iface.setSwitchportMode('access');

    if (i >= 1 && i <= 20) {
      // first block -> VLAN 900
      iface.setAccessVlan(900);
    } else if (i >= 21 && i <= 23) {
      // a few ports -> VLAN 800
      iface.setAccessVlan(800);
    } else if (i === 24) {
      // keep default VLAN 1
      iface.setAccessVlan(1);
    } else {
      // remaining ports -> VLAN 900 as well
      iface.setAccessVlan(900);
    }
  }
});
