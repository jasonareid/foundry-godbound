/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
import {PlayerRollDialog} from "./playerRollDialog.js";
import {Capitalize} from "./misc.js";

export class GodboundActorSheet extends ActorSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
  	  classes: ["godbound", "sheet", "actor"],
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attrs"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  get template() {
    const path = "systems/godbound/templates/actor";
    return `${path}/${this.actor.data.type}-sheet.html`;
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

    // Update Inventory Item
    html.find('.item-name').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    html.find('.item-chat').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.getOwnedItem(li.data("itemId"));
      ChatMessage.create({
        content: `<div><h3>${item.name}</h3><p>${item.data.data.description}</p></div>`,
      });
    });

    html.find('.item-day-effort').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.getOwnedItem(li.data("itemId"));
      let effortCost = 1;
      if(item.type === 'divineMiracle') {
        effortCost = item.data.data.effort;
      }
      if(this.actor.data.data.computed.effort.available >= effortCost) {
        this.actor.update({data: {effort: {day: this.actor.data.data.effort.day + effortCost}}});
        ChatMessage.create({
          content: `<div><h3>${item.name}</h3><h4>${this.actor.name}: ${effortCost} Effort for Day</h4><p>${item.data.data.description}</p></div>`,
        });
      }
    });

    html.find('.item-scene-effort').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.getOwnedItem(li.data("itemId"));
      if(this.actor.data.data.computed.effort.available >= 1) {
        this.actor.update({data: {effort: {scene: this.actor.data.data.effort.scene + 1}}});
        ChatMessage.create({
          content: `<div><h3>${item.name}</h3><h4>${this.actor.name}: Effort for Scene</h4><p>${item.data.data.description}</p></div>`,
        });
      }
    });

    html.find('.item-round-effort').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.getOwnedItem(li.data("itemId"));
      if(this.actor.data.data.computed.effort.available >= 1) {
        this.actor.update({data: {effort: {round: this.actor.data.data.effort.round + 1}}});
        ChatMessage.create({
          content: `<div><h3>${item.name}</h3><h4>${this.actor.name}: Round-by-Round Effort</h4><p>${item.data.data.description}</p></div>`,
        });
      }
    });

    html.find('.itemAdder').click(async ev => {
      const $i = $(ev.currentTarget);
      const names = {
        boundWord: 'Word',
        divineGift: 'Gift',
        divineMiracle: 'Miracle',
        attack: 'Attack',
        autoHitAttack: 'Attack',
        multiDieDamageRoll: 'Attack',
        project: 'Project',
        item: 'Item',
        artifact: 'Artifact',
        treasure: 'Treasure',
        invocation: 'Invocation',
        tactic: 'Tactic,'
      }
      this.actor.createOwnedItem({name: names[$i.data('itemType')], type: $i.data('itemType')}, {renderSheet: true});
    })
    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    html.find('.effortSpend').click(ev => {
      const $i = $(ev.currentTarget);
      let effortCategory = $i.data('effortCategory');
      let effortChange = parseInt($i.data('effortChange'));
      if(effortChange > 0 && this.actor.data.data.computed.effort.available >= effortChange) {
        this.actor.update({data: {effort: {[effortCategory]: this.actor.data.data.effort[effortCategory] + effortChange}}});
      } else if(effortChange < 0 && this.actor.data.data.effort[effortCategory] >= effortChange * -1) {
        this.actor.update({data: {effort: {[effortCategory]: this.actor.data.data.effort[effortCategory] + effortChange}}});
      }
    });

    html.find('.attr-roll').click(ev => {
      let attr = $(ev.currentTarget).data('attr');
      PlayerRollDialog.create(this.actor, {rollType: `${Capitalize(attr)} check`}, async (data) => {
        let template = 'systems/godbound/templates/chat/roll-result.html';
        let chatData = {
          user: game.user._id,
          speaker: this.actor,
        };
        let templateData = {
          title: `${Capitalize(attr)} Check (${data.modifier < 1 ? 'Hard' : data.modifier > 1 ? 'Easy' : 'Normal'})`,
          flavor: `By ${this.actor.name}`,
          data: data,
        }
        let roll = new Roll('1d20 + @attr + @difficulty', {
          attr: this.actor.data.data.attributes[attr].score,
          difficulty: data.modifier,
        });
        roll.roll();
        let target = 21;
        let result = {
          isSuccess: roll.total >= target,
          isFailure: roll.total < target,
          target: target,
        }
        templateData.roll = await roll.render();
        templateData.result = result;
        templateData.data.actor = this.actor;
        chatData.content = await renderTemplate(template, templateData);
        chatData.roll = roll;
        chatData.isRoll = true;
        // Dice So Nice
        if (game.dice3d) {
          await game.dice3d.showForRoll(
            roll,
            game.user,
            true,
            chatData.whisper,
            chatData.blind
          );
          ChatMessage.create(chatData);
        } else {
          chatData.sound = CONFIG.sounds.dice;
          ChatMessage.create(chatData);
        }
      });
    })

    html.find('.attack-roll').click(async ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.getOwnedItem(li.data("itemId"));
      console.log(item);
      let template = 'systems/godbound/templates/chat/attack-roll-result.html';
      let chatData = {
        user: game.user._id,
        speaker: this.actor,
      };
      let attrBonus = this.actor.data.data.computed.attributes[item.data.data.attr].mod;
      let templateData = {
        title: `Attack with ${item.name}`,
        flavor: `By ${this.actor.name}`,
        damage: `${item.data.data.damageRoll}+${attrBonus+item.data.data.damageBonus}`,
        damageSource: item.name,
        data: {},
      };
      let roll = new Roll('1d20 + @attrBonus + @toHitBonus + @itemBonus', {
        attrBonus: attrBonus,
        toHitBonus: this.actor.data.data.toHitBonus,
        itemBonus: item.data.data.hitBonus
      });
      roll.roll();
      console.log(roll);
      templateData.roll = await roll.render();
      templateData.result = {
        total: roll.total,
      };
      templateData.data.actor = this.actor;
      console.log(templateData);
      chatData.content = await renderTemplate(template, templateData);
      chatData.roll = roll;
      chatData.isRoll = true;
      if (game.dice3d) {
        await game.dice3d.showForRoll(
            roll,
            game.user,
            true,
            chatData.whisper,
            chatData.blind
        );
        ChatMessage.create(chatData);
      } else {
        chatData.sound = CONFIG.sounds.dice;
        ChatMessage.create(chatData);
      }
    });

    html.find('.save-roll').click(ev => {
      let save = $(ev.currentTarget).data('save');
      PlayerRollDialog.create(this.actor, {rollType: `${Capitalize(save)} save`}, async (data) => {
        let template = 'systems/godbound/templates/chat/roll-result.html';
        let chatData = {
          user: game.user._id,
          speaker: this.actor,
        };
        let templateData = {
          title: `${Capitalize(save)} Save (${data.modifier < 1 ? 'Hard' : data.modifier > 1 ? 'Easy' : 'Normal'})`,
          flavor: `By ${this.actor.name}`,
          data: data,
        }
        let roll = new Roll('1d20 + @difficulty', {
          difficulty: data.modifier,
        });
        roll.roll();
        let target = this.actor.data.data.computed.saves[save].save;
        let result = {
          isSuccess: roll.total >= target,
          isFailure: roll.total < target,
          target: target,
        }
        templateData.roll = await roll.render();
        templateData.result = result;
        templateData.data.actor = this.actor;
        chatData.content = await renderTemplate(template, templateData);
        chatData.roll = roll;
        chatData.isRoll = true;
        // Dice So Nice
        if (game.dice3d) {
          await game.dice3d.showForRoll(
            roll,
            game.user,
            true,
            chatData.whisper,
            chatData.blind
          );
          ChatMessage.create(chatData);
        } else {
          chatData.sound = CONFIG.sounds.dice;
          ChatMessage.create(chatData);
        }
      });
    })
  }
}
