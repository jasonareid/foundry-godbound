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

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
  }
}
