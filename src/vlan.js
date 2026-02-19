export class VlanDatabase {
    constructor() {
        this.vlans = new Map();
        // Default VLAN 1
        this.addVlan(1, 'default');
    }

    addVlan(id, name = null) {
        const vlanId = parseInt(id);
        if (isNaN(vlanId) || vlanId < 1 || vlanId > 4094) {
            throw new Error("Invalid VLAN ID (1-4094)");
        }

        if (!this.vlans.has(vlanId)) {
            this.vlans.set(vlanId, {
                id: vlanId,
                name: name || `VLAN${vlanId.toString().padStart(4, '0')}`,
                state: 'active'
            });
        } else if (name) {
            // Rename existing
            this.vlans.get(vlanId).name = name;
        }
        return this.vlans.get(vlanId);
    }

    getVlan(id) {
        return this.vlans.get(parseInt(id));
    }

    getAllVlans() {
        return Array.from(this.vlans.values()).sort((a, b) => a.id - b.id);
    }
}
