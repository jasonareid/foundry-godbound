/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class GodboundItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    console.log("************Getting default item sheet options");
    return mergeObject(super.defaultOptions, {
        classes: ["godbound", "sheet", "item"],
        width: 520,
        height: 'auto',
        resizable: true,
        tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attrs"}],
      }
    );
  }

  get template() {
    const path = "systems/godbound/templates/item";
    return `${path}/${this.item.data.type}-sheet.html`;
  }
  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    if(this.item.type === 'artifact' && this.item.actor) {
      let lookup = this.item.actor.data.data.computed.artifactIdx[this.item._id];
      if(lookup) {
        data.artifactPowers = lookup.artifactPowers;
      } else {
        data.artifactPowers = [];
      }
      console.log("Artifact powers");
      console.log(data.artifactPowers);
    }
    if(this.item.type === 'divineGift' && this.item.actor) {
      data.actorBoundWordNames = this.item.actor.items.filter(i => i.type === 'boundWord').map(i => i.name);
    }
    return data;
  }
  /* -------------------------------------------- */

  _replaceMacros(description) {
    if(!this.item.actor) {
      return description;
    }
    return this.item.actor.replaceItemMacros(this.item, description);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('.item-name').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    html.find('.item-chat').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      let item;
      if(li && li.data("itemId")) {
        item = this.actor.getOwnedItem(li.data("itemId"));
      } else {
        item = this.item;
      }
      ChatMessage.create({
        content: `<div><h3>${item.name}</h3><p>${this.actor.replaceItemMacros(item, item.data.data.description)}</p></div>`,
      });
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    html.find('.item-maybe-delete').click(ev => {
      if(this.maybeDeleteActive) {
        html.find('.item-delete').hide();
        this.maybeDeleteActive = false;
      } else {
        html.find('.item-delete').show();
        this.maybeDeleteActive = true;
      }
    });
    html.find('.item-delete').click(ev => {
      if(this.item.type === 'artifact') {
        if(this.item.actor && this.item.actor.hasArtifactPowersUnder(this.item.id)) {
          ui.notifications.warn("Please delete artifact powers individually before deleting artifact.");
          return;
        }
      }
      if(this.item.actor) {
        this.item.actor.deleteOwnedItem(this.item.id);
      }
    });

    html.find('.itemAdder').click(async ev => {
      const $i = $(ev.currentTarget);
      const names = {
        artifactPower: 'Artifact Power',
      }
      if(!this.item.type === 'artifact') {
        ui.notifications.error("Only artifacts should be creating sub-items");
        return;
      }
      if(!this.item.actor) {
        ui.notifications.error("Cannot add powers to an unowned artifact");
        return;
      }
      this.actor.createOwnedItem({name: names[$i.data('itemType')], type: $i.data('itemType'), data: {artifactId: this.item._id}}, {renderSheet: true});
    });

  }
}
