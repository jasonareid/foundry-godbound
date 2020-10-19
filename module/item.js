/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class GodboundItem extends Item {
    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        // Get the Item's data
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        this.data.data.computed = {};
        if (itemData.type === 'artifact') this._prepareArtifactData(itemData);
        if (itemData.type === 'project') this._prepareProjectData(itemData);
        if (itemData.type === 'cult') this._prepareCultData(itemData);

        if (this.data.data.damageRoll) {
            if (!this.data.data.damageBonus) {
                this.data.data.computed.damageFormula =`${this.data.data.damageRoll}`;
            } else if (this.data.data.damageBonus < 0) {
                this.data.data.computed.damageFormula = `${this.data.data.damageRoll}${this.data.data.damageBonus}`;
            } else {
                this.data.computed.damageFormula = `${this.data.data.damageRoll}+${this.data.data.damageBonus}`;
            }
        }
    }

    _prepareArtifactData(itemData) {
        const data = itemData.data;
        data.computed = {};
        data.computed.effort = {};
        data.computed.effort.available =
            data.effort.total - (
                data.effort.atWill +
                data.effort.scene +
                data.effort.day
            )
        ;
        data.computed.effort.spent = data.effort.total - data.computed.effort.available;
        data.computed.remaining = data.dominionCost - (data.committedDominion + data.contributedDominion);
    }

    _prepareProjectData(itemData) {
        const data = itemData.data;
        data.computed = {};
        data.computed.cost = (data.scope + data.resistance) * data.difficulty;
        data.computed.remaining = data.computed.cost - (
            data.committedDominion + data.committedInfluence + data.contributedDominion + data.contributedInfluence
        );
    }

    _prepareCultData(itemData) {
        const data = itemData.data;
        const maxTroubles = [1, 6, 8, 10, 12, 20]
        data.computed = {};
        data.computed.maxTrouble = maxTroubles[data.power] || 1;
    }

    canSpendEffort(amount) {
        if (!this.type === 'artifact') {
            ui.notifications.warn("Item is not powered by effort");
            return false;
        }
        if (this.data.data.computed.effort.available >= amount) {
            return true;
        } else {
            ui.notifications.warn("Not enough effort in item");
            return false;
        }
    }

    getCommitmentOptions() {
        let options = [];
        if(this.data.data.noEffort) {
            options.push({id: 'noEffort', name: 'No Effort', actorFnRef: 'demonstratePower', iClass: 'far fa-play-circle'});
        }
        if(this.data.data.atWill) {
            options.push({id: 'atWill', name: 'At Will', actorFnRef: 'commitEffortAtWill', iClass: 'fas fa-power-off'});
        }
        if(this.data.data.scene) {
            options.push({id: 'scene', name: 'Scene', actorFnRef: 'commitEffortForScene', iClass: 'fas fa-clock'});
        }
        if(this.data.data.day) {
            options.push({id: 'day', name: 'Day', actorFnRef: 'commitEffortForDay', iClass: 'fas fa-sun'});
        }
        return options;
    }
}
