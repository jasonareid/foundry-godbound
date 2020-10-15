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

        if (itemData.type === 'artifact') this._prepareArtifactData(itemData);
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
    }

    canSpendEffort(amount) {
        if(!this.type === 'artifact') {
            ui.notifications.warn("Item is not powered by effort");
            return false;
        }
        if(this.data.data.computed.effort.available >= amount) {
            return true;
        } else {
            ui.notifications.warn("Not enough effort in item");
            return false;
        }
    }
}
