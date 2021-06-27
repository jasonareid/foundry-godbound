import {TypeNames} from "./misc.js";

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
    if(this.item.data.type === 'artifact' && this.item.actor) {
      let lookup = this.item.actor.data.data.computed.artifactIdx[this.item.id];
      if(lookup) {
        data.artifactPowers = lookup.artifactPowers;
      } else {
        data.artifactPowers = [];
      }
      console.log("Artifact powers");
      console.log(data.artifactPowers);
    }
    if(this.item.data.type === 'divineGift' && this.item.actor) {
      data.actorBoundWordNames = this.item.actor.items.filter(i => i.data.type === 'boundWord').map(i => i.name);
    }
    return data;
  }
  /* -------------------------------------------- */
  /** @override */
  _onEditImage(event) {
    const attr = event.currentTarget.dataset.edit;
    const original = getProperty(this.item.data, attr);
    let current = original;
    let activeSource = null;
    if(!game.user.isGM) {
      current = `player-home/${game.user.name}`;
      activeSource = 'data';
    }
    let options = {
      type: "image",
      current: original,
      callback: path => {
        event.currentTarget.src = path;
        if ( this.options.submitOnChange ) {
          this._onSubmit(event);
        }
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    };
    if(activeSource) {
      options.activeSource = activeSource;
    }
    const fp = new FilePicker(options);
    fp.browse(current);
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.item-name').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    html.find('.item-chat').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      let item;
      if(li && li.data("itemId") && this.actor) {
        item = this.actor.items.get(li.data("itemId"));
      } else {
        item = this.item;
      }
      if(this.actor) {
        this.actor.demonstratePower(item);
      } else {
        ChatMessage.create({
          content: `<div><h3>${item.name}</h3><p>${item.data.data.description}</p></div>`,
        });
      }
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
      if(this.item.data.type === 'artifact') {
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
      if(!this.item.data.type === 'artifact') {
        ui.notifications.error("Only artifacts should be creating sub-items");
        return;
      }
      if(!this.item.actor) {
        ui.notifications.error("Cannot add powers to an unowned artifact");
        return;
      }
      this.actor.createOwnedItem({name: TypeNames($i.data('itemType')), type: $i.data('itemType'), data: {artifactId: this.item.id}}, {renderSheet: true});
    });

  }
}
