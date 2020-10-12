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
        resizable: true
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
    return data;
  }
  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    html.find('.item-chat').click(ev => {
      const item = this.item;
      ChatMessage.create({
        content: `<div><h3>${item.name}</h3><p>${item.data.data.description}</p></div>`,
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
      if(this.item.actor) {
        this.item.actor.deleteOwnedItem(this.item.id);
      }
    });
  }
}
