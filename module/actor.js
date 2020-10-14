export class GodboundActor extends Actor {

  static async create(data, options) {
    let gbActor = await super.create(data, options);

    if (gbActor.data.type === 'pc') {
      await gbActor.createOwnedItem({name: 'Fray Die', type: 'autoHitAttack', data: {
          numDice: 1,
          diceType: 8
        }
      });
      await gbActor.createOwnedItem({name: 'Succeed on Save', type: 'divineMiracle', data: {
          description: "Succeed on a Failed Save",
          effort: 1
        }
      });
      await gbActor.createOwnedItem({name: 'Suppress Effect', type: 'divineMiracle', data: {
          description: "Suppress an Appropriate Effect",
          effort: 1
        }
      });
      await gbActor.createOwnedItem({name: 'Divine Wrath', type: 'divineMiracle', data: {
          description: "You smite a chosen foe within sight with the energies of the Word, inflicting @RollDmg[leveld8] damage. You are always immune to the wrath of your own bound Words, as are other entities that wield similar powers. As a Smite power, Divine Wrath cannot be used two rounds in a row.",
          effort: 1,
          smite: true
        }
      });
      await gbActor.createOwnedItem({name: 'Corona of Fury', type: 'divineMiracle', data: {
          description: "Commit Effort to the end of the scene. You hurl a torrent of your Word’s energy at a group of foes, affecting all within a 30-foot radius of a target point within sight of you. Each victim takes @RollDmg[halfLeveld8] damage. The fury can selectively spare allies within the area, but the victims then get an appropriate saving throw to resist the effect. You are always immune to the furies of your own bound Words, as are other entities that wield similar powers. Corona of Fury cannot be used two rounds in a row.",
          effort: 1,
          smite: true
        }
      });
    } else if(gbActor.data.type === 'npc') {

    }
  }

  prepareData() {
    super.prepareData();
    const actorData = this.data;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'pc') this._preparePcData(actorData);

    if (actorData.type === 'npc') this._prepareNpcData(actorData);
  }

  _preparePcData(actorData) {
    const data = actorData.data;

    // Make a new Object that holds computed data and keeps it separate from anything else
    data.computed = {};

    data.computed.attributes = {};
    for(let k of Object.keys(data.attributes)) {
      const computedAtt = {};
      const srcAtt = data.attributes[k];
      const score = srcAtt.score;
      if(score <= 3) {
        computedAtt.mod = -3;
      } else if(score <= 5) {
        computedAtt.mod = -2;
      } else if(score <= 8) {
        computedAtt.mod = -1;
      } else if(score >= 19) {
        computedAtt.mod = 4;
      } else if(score >= 18) {
        computedAtt.mod = 3;
      } else if(score >= 16) {
        computedAtt.mod = 2;
      } else if(score >= 13) {
        computedAtt.mod = 1;
      } else {
        computedAtt.mod = 0;
      }
      computedAtt.check = 21 - score;
      data.computed.attributes[k] = computedAtt;
    }

    data.computed.saves = {};
    this._prepareSave(data.saves, data.computed.saves, data.computed.attributes, 'hardiness', 'str', 'con');
    this._prepareSave(data.saves, data.computed.saves, data.computed.attributes, 'evasion', 'dex', 'int');
    this._prepareSave(data.saves, data.computed.saves, data.computed.attributes, 'spirit', 'wis', 'cha');

    data.computed.armor = {};
    switch(data.armor.type) {
      case "light":
        data.computed.armor.baseAc = 7;
        break;
      case "medium":
        data.computed.armor.baseAc = 5;
        break;
      case "heavy":
      case "divine":
        data.computed.armor.baseAc = 3;
        break;
      default:
        data.computed.armor.baseAc = 9;
    }
    let ac = data.computed.armor.baseAc;
    if(data.armor.shield) {
      ac -= 1;
    }
    ac -= data.armor.bonus;
    ac -= data.computed.attributes[data.armor.attribute].mod;
    data.computed.armor.ac = ac;
    if(data.armor.penalizeHardiness) {
      data.computed.saves.hardiness.penalty = 4;
      data.computed.saves.hardiness.save += 4;
    }
    if(data.armor.penalizeEvasion) {
      data.computed.saves.evasion.penalty = 4;
      data.computed.saves.evasion.save += 4;
    }
    if(data.armor.penalizeSpirit) {
      data.computed.saves.spirit.penalty = 4;
      data.computed.saves.spirit.save += 4;
    }

    data.computed.effort = {};
    data.computed.effort.available =
        data.effort.total - (
            data.effort.round +
            data.effort.scene +
            data.effort.day
        )
    ;
    data.computed.effort.spent = data.effort.total - data.computed.effort.available;

    data.computed.influence = {};
    data.computed.influence.available = data.influence.total - data.influence.spent;

    data.computed.dominion = {};
    data.computed.dominion.available = data.dominion.total - data.dominion.spent;

    data.computed.hp = {};
    data.computed.hp.max = 8 + data.computed.attributes.con.mod + (
        (data.level - 1) * (4 + Math.ceil(data.computed.attributes.con.mod / 2))
    );
  }

  _prepareSave(src, dest, atts, name, att1, att2) {
    dest[name] = {};
    dest[name].base = 15 - Math.max(
        atts[att1].mod,
        atts[att2].mod
    );
    dest[name].penalty = 0;
    dest[name].save = dest[name].base - src[name].bonus;
  }
  _prepareNpcData(actorData) {
    const data = actorData.data;

    // Make a new Object that holds computed data and keeps it separate from anything else
    data.computed = {};

    data.computed.effort = {};
    data.computed.effort.available =
        data.effort.total - (
            data.effort.round +
            data.effort.scene +
            data.effort.day
        )
    ;
  }

  rollDamage(source, formula) {
    console.log(`Rolling damage for ${this.name} from ${source} for ${formula}`);
  }
}
