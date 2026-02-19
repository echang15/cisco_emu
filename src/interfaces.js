export class Interface {
    constructor(name) {
        this.name = name;
        this.shutdown = false; // Default no shutdown? Actually Cisco defaults to shutdown usually but for emulation sake maybe up? 
        // Real 6509 ports are roughly 'notconnect' if nothing plugged in, but 'connected' if we simulate it.
        // Let's assume they are administrative status UP by default for ease.
        this.switchportMode = 'dynamic auto'; // Cisco default. Usually we want 'access' or 'trunk' manually.
        this.accessVlan = 1;
        this.voiceVlan = null;
        this.nativeVlan = 1;
        this.encapsulation = 'dot1q';
    }

    setSwitchportMode(mode) {
        if (['access', 'trunk', 'dynamic auto', 'dynamic desirable'].includes(mode)) {
            this.switchportMode = mode;
        } else {
            throw new Error("Invalid switchport mode");
        }
    }

    setAccessVlan(vlanId) {
        this.accessVlan = parseInt(vlanId);
    }
}

export class InterfaceDatabase {
    constructor() {
        this.interfaces = new Map();
        this.init();
    }

    init() {
        // Create Gi1/1 - Gi1/48
        for (let i = 1; i <= 48; i++) {
            const name = `GigabitEthernet1/${i}`;
            this.interfaces.set(name.toLowerCase(), new Interface(name));
            // Also add short name aliases logic in lookup, but for store use full name
        }
    }

    getInterface(name) {
        // Handle common abbreviations
        // Gi1/1 -> GigabitEthernet1/1
        // Fa1/1 -> FastEthernet1/1
        // Te1/1 -> TenGigabitEthernet1/1

        let normalized = name.toLowerCase();
        if (normalized.startsWith('gi')) {
            normalized = normalized.replace(/^gi/, 'gigabitethernet');
        } else if (normalized.startsWith('fa')) {
            normalized = normalized.replace(/^fa/, 'fastethernet');
        } else if (normalized.startsWith('te')) {
            normalized = normalized.replace(/^te/, 'tengigabitethernet');
        }

        /* 
           Simple normalization for spaces e.g. "Gi 1/1" -> "Gi1/1"
           We'll just strip spaces?
        */
        normalized = normalized.replace(/\s+/g, '');

        // Handle case where user typed partial e.g. just "gigabitethernet1/1" is fine
        // but wait, we need to match the key in Map.

        // Our keys are lowercase "gigabitethernet1/1"

        return this.interfaces.get(normalized);
    }
}
