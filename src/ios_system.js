import { CommandParser } from './commands/parser.js';
import { VlanDatabase } from './vlan.js';
import { InterfaceDatabase } from './interfaces.js';

export const MOES = {
    EXEC: 'EXEC',
    PRIVILEGED: 'PRIVILEGED',
    CONFIG: 'CONFIG',
    CONFIG_IF: 'CONFIG_IF',
    CONFIG_VLAN: 'CONFIG_VLAN'
};

export class IOSSystem {
    constructor(terminal) {
        this.terminal = terminal;
        this.hostname = "Switch";
        this.mode = MOES.EXEC;
        this.configContext = null;

        this.vlanDb = new VlanDatabase();
        this.interfaceDb = new InterfaceDatabase();

        this.terminal.print("");
        this.terminal.print("Cisco IOS Software, C6500 Software (s72033_rp-ADVENTERPRISEK9-M), Version 12.2(18)SXF7, RELEASE SOFTWARE (fc1)");
        this.terminal.print("Copyright (c) 1986-2006 by Cisco Systems, Inc.");
        this.terminal.print("Press RETURN to get started!");
        this.terminal.print("");
    }

    processCommand(line) {
        const tokens = CommandParser.tokenize(line.trim());
        if (tokens.length === 0) return;

        const cmd = tokens[0].toLowerCase();

        try {
            switch (this.mode) {
                case MOES.EXEC:
                    this.handleExec(cmd, tokens);
                    break;
                case MOES.PRIVILEGED:
                    this.handlePrivileged(cmd, tokens);
                    break;
                case MOES.CONFIG:
                    this.handleConfig(cmd, tokens);
                    break;
                case MOES.CONFIG_IF:
                    this.handleConfigIf(cmd, tokens);
                    break;
                case MOES.CONFIG_VLAN:
                    this.handleConfigVlan(cmd, tokens);
                    break;
                default:
                    this.terminal.print("System Error: Unknown mode");
            }
        } catch (e) {
            this.terminal.print(`Error: ${e.message}`);
        }

        this.updatePrompt();
    }

    updatePrompt() {
        let prompt = this.hostname;
        switch (this.mode) {
            case MOES.EXEC:
                prompt += ">";
                break;
            case MOES.PRIVILEGED:
                prompt += "#";
                break;
            case MOES.CONFIG:
                prompt += "(config)#";
                break;
            case MOES.CONFIG_IF:
                prompt += "(config-if)#";
                break;
            case MOES.CONFIG_VLAN:
                prompt += "(config-vlan)#";
                break;
        }
        this.terminal.setPrompt(prompt);
    }

    handleExec(cmd, tokens) {
        if (cmd === 'enable' || cmd === 'en') {
            this.mode = MOES.PRIVILEGED;
        } else if (cmd === 'exit' || cmd === 'logout') {
            this.terminal.print("Closing connection");
        } else if (cmd === 'show' || cmd === 'sh') {
            this.handleShow(tokens);
        } else {
            this.terminal.print(`% Invalid input detected at '^' marker.`);
        }
    }

    handlePrivileged(cmd, tokens) {
        if (cmd === 'configure' || cmd === 'conf') {
            if (tokens[1] && (tokens[1].startsWith('t'))) {
                this.terminal.print("Enter configuration commands, one per line.  End with CNTL/Z.");
                this.mode = MOES.CONFIG;
            } else {
                this.terminal.print("% Invalid input detected at '^' marker.");
            }
        } else if (cmd === 'disable') {
            this.mode = MOES.EXEC;
        } else if (cmd === 'exit') {
            this.mode = MOES.EXEC;
        } else if (cmd === 'show' || cmd === 'sh') {
            this.handleShow(tokens);
        } else {
            this.terminal.print(`% Invalid input detected at '^' marker.`);
        }
    }

    handleConfig(cmd, tokens) {
        if (cmd === 'exit') {
            this.mode = MOES.PRIVILEGED;
        } else if (cmd === 'end') {
            this.mode = MOES.PRIVILEGED;
        } else if (cmd === 'interface' || cmd === 'int') {
            if (!tokens[1]) {
                this.terminal.print("% Incomplete command.");
                return;
            }
            const iface = this.interfaceDb.getInterface(tokens[1]);
            if (iface) {
                this.mode = MOES.CONFIG_IF;
                this.configContext = iface;
            } else {
                this.terminal.print("% Invalid interface.");
            }
        } else if (cmd === 'vlan') {
            if (!tokens[1]) {
                this.terminal.print("% Incomplete command.");
                return;
            }
            const vlanId = parseInt(tokens[1]);
            if (vlanId >= 1 && vlanId <= 4094) {
                // Get or create
                const vlan = this.vlanDb.addVlan(vlanId);
                this.mode = MOES.CONFIG_VLAN;
                this.configContext = vlan;
            } else {
                this.terminal.print("% Invalid VLAN ID.");
            }
        } else if (cmd === 'hostname') {
            if (tokens[1]) {
                this.hostname = tokens[1];
            }
        } else {
            this.terminal.print(`% Invalid input detected at '^' marker.`);
        }
    }

    handleConfigIf(cmd, tokens) {
        if (cmd === 'exit') {
            this.mode = MOES.CONFIG;
            this.configContext = null;
        } else if (cmd === 'end') {
            this.mode = MOES.PRIVILEGED;
            this.configContext = null;
        } else if (cmd === 'switchport') {
            this.handleSwitchport(tokens);
        } else if (cmd === 'shutdown') {
            this.configContext.shutdown = true;
        } else if (cmd === 'no' && tokens[1] === 'shutdown') {
            this.configContext.shutdown = false;
        } else {
            this.terminal.print(`% Invalid input detected at '^' marker.`);
        }
    }

    handleSwitchport(tokens) {
        // syntax: switchport mode access|trunk
        // syntax: switchport access vlan <id>
        // syntax: switchport trunk allowed vlan ... (maybe later)

        if (tokens[1] === 'mode') {
            if (['access', 'trunk', 'dynamic'].includes(tokens[2])) {
                let mode = tokens[2];
                if (mode === 'dynamic' && tokens[3]) mode += ' ' + tokens[3];
                this.configContext.setSwitchportMode(mode);
            } else {
                this.terminal.print("% Invalid switchport mode.");
            }
        } else if (tokens[1] === 'access') {
            if (tokens[2] === 'vlan' && tokens[3]) {
                const vlanId = parseInt(tokens[3]);
                // Verify vlan exists? optionally autocreate
                // IOS usually says "Access VLAN does not exist. Creating vlan 10"
                if (!this.vlanDb.getVlan(vlanId)) {
                    this.terminal.print(`% Access VLAN does not exist. Creating vlan ${vlanId}`);
                    this.vlanDb.addVlan(vlanId);
                }
                this.configContext.setAccessVlan(vlanId);
            } else {
                this.terminal.print("% Incomplete command.");
            }
        }
    }

    handleConfigVlan(cmd, tokens) {
        if (cmd === 'exit') {
            this.mode = MOES.CONFIG;
            this.configContext = null;
        } else if (cmd === 'end') {
            this.mode = MOES.PRIVILEGED;
            this.configContext = null;
        } else if (cmd === 'name') {
            if (tokens[1]) {
                this.configContext.name = tokens[1];
            }
        } else {
            this.terminal.print(`% Invalid input detected at '^' marker.`);
        }
    }

    handleShow(tokens) {
        if (tokens[1] === 'vlan') {
            this.terminal.print("VLAN Name                             Status    Ports");
            this.terminal.print("---- -------------------------------- --------- -------------------------------");

            const vlans = this.vlanDb.getAllVlans();
            vlans.forEach(v => {
                // Find ports in this vlan
                const ports = [];
                for (const [name, iface] of this.interfaceDb.interfaces) {
                    // Logic: switchport mode access AND access vlan = v, OR trunk (simplified logic)
                    if (iface.switchportMode.includes('access') && iface.accessVlan === v.id) {
                        // Simplify name for display: GigabitEthernet1/1 -> Gi1/1
                        const shortName = name.replace('gigabitethernet', 'Gi').replace('fastethernet', 'Fa');
                        ports.push(shortName);
                    }
                }

                let portStr = ports.join(', ');
                // Formatting is tricky in HTML, but we use pre-wrap.
                // Padding:
                const idStr = v.id.toString().padEnd(4);
                const nameStr = v.name.padEnd(32);
                const statusStr = v.state.padEnd(9);
                this.terminal.print(`${idStr} ${nameStr} ${statusStr} ${portStr}`);
            });

        } else if (tokens[1] === 'interface' && tokens[2] === 'status') {
            this.terminal.print("Port      Name               Status       Vlan       Duplex  Speed Type");
            for (const [name, iface] of this.interfaceDb.interfaces) {
                const shortName = name.replace('gigabitethernet', 'Gi').replace('fastethernet', 'Fa');
                const padName = shortName.padEnd(9);
                const status = iface.shutdown ? 'disabled' : 'connected'; // Simplified
                const padStatus = status.padEnd(12);
                const vlan = iface.switchportMode === 'trunk' ? 'trunk' : iface.accessVlan.toString();
                const padVlan = vlan.padEnd(10);

                this.terminal.print(`${padName}                    ${padStatus} ${padVlan} auto    auto  10/100/1000BaseT`);
            }
        } else if (tokens[1] === 'running-config' || tokens[1] === 'run') {
            this.printRunningConfig();
        } else {
            this.terminal.print(`% Invalid input detected at '^' marker.`);
        }
    }

    printRunningConfig() {
        this.terminal.print("Building configuration...");
        this.terminal.print("");
        this.terminal.print(`hostname ${this.hostname}`);
        this.terminal.print("!");
        this.terminal.print("vlan 1");
        this.terminal.print("!");

        // Show non-default vlans
        this.vlanDb.getAllVlans().forEach(v => {
            if (v.id !== 1) {
                this.terminal.print(`vlan ${v.id}`);
                this.terminal.print(` name ${v.name}`);
                this.terminal.print("!");
            }
        });

        // Show interfaces that are changed
        for (const [name, iface] of this.interfaceDb.interfaces) {
            // Only show if modified from default?
            let modified = false;
            if (iface.switchportMode !== 'dynamic auto') modified = true;
            if (iface.accessVlan !== 1) modified = true;
            if (iface.shutdown) modified = true;

            if (modified) {
                this.terminal.print(`interface ${iface.name}`);
                if (iface.switchportMode !== 'dynamic auto') {
                    this.terminal.print(` switchport mode ${iface.switchportMode}`);
                }
                if (iface.switchportMode === 'access' && iface.accessVlan !== 1) {
                    this.terminal.print(` switchport access vlan ${iface.accessVlan}`);
                }
                if (iface.shutdown) {
                    this.terminal.print(` shutdown`);
                }
                this.terminal.print("!");
            }
        }

        this.terminal.print("end");
    }
}
