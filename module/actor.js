import {TypeNames} from "./misc.js";

export class GodboundActor extends Actor {

    static async create(data, options) {
        let gbActor = await super.create(data, options);

        if (gbActor.data.type === 'pc') {
            await gbActor.createOwnedItem({
                name: 'Fray Die', type: 'autoHitAttack',
                img: 'modules/game-icons-net/blackbackground/sword-spin.svg',
                data: {
                    numDice: 1,
                    diceType: 8
                }
            });
            await gbActor.createOwnedItem({
                name: 'Succeed on Save', type: 'divineMiracle',
                img: 'modules/game-icons-net/blackbackground/shield-reflect.svg',
                data: {
                    description: "Succeed on a Failed Save",
                    effortCost: 1,
                    instant: true,
                }
            });
            await gbActor.createOwnedItem({
                name: 'Dispel Effect', type: 'divineMiracle',
                img: 'modules/game-icons-net/blackbackground/halt.svg',
                data: {
                    description: "Dispel an appropriate effect, instantly if targeted directly at you.",
                    effortCost: 1,
                    action: true,
                    instant: true,
                }
            });
            await gbActor.createOwnedItem({
                name: 'Divine Wrath', type: 'divineMiracle',
                img: 'modules/game-icons-net/blackbackground/hypersonic-bolt.svg',
                data: {
                    description: "You smite a chosen foe within sight with the energies of the Word, inflicting @RollDmg[leveld8] damage. You are always immune to the wrath of your own bound Words, as are other entities that wield similar powers.",
                    effortCost: 1,
                    smite: true,
                    action: true,
                    combatPower: true,
                }
            });
            await gbActor.createOwnedItem({
                name: 'Corona of Fury', type: 'divineMiracle',
                img: 'modules/game-icons-net/blackbackground/explosion-rays.svg',
                data: {
                    description: "You hurl a torrent of your Word’s energy at a group of foes, affecting all within a 30-foot radius of a target point within sight of you. Each victim takes @RollDmg[halfLeveld8] damage. The fury can selectively spare allies within the area, but the victims then get an appropriate saving throw to resist the effect. You are always immune to the furies of your own bound Words, as are other entities that wield similar powers.",
                    effortCost: 1,
                    smite: true,
                    action: true,
                    combatPower: true,
                }
            });
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
        for (let k of Object.keys(data.attributes)) {
            const computedAtt = {};
            const srcAtt = data.attributes[k];
            const score = srcAtt.score;
            if (score <= 3) {
                computedAtt.mod = -3;
            } else if (score <= 5) {
                computedAtt.mod = -2;
            } else if (score <= 8) {
                computedAtt.mod = -1;
            } else if (score >= 19) {
                computedAtt.mod = 4;
            } else if (score >= 18) {
                computedAtt.mod = 3;
            } else if (score >= 16) {
                computedAtt.mod = 2;
            } else if (score >= 13) {
                computedAtt.mod = 1;
            } else {
                computedAtt.mod = 0;
            }
            computedAtt.check = 21 - score;
            data.computed.attributes[k] = computedAtt;
        }

        data.computed.saves = {};
        this._prepareSave(data.level, data.saves, data.computed.saves, data.computed.attributes, 'hardiness', 'str', 'con');
        this._prepareSave(data.level, data.saves, data.computed.saves, data.computed.attributes, 'evasion', 'dex', 'int');
        this._prepareSave(data.level, data.saves, data.computed.saves, data.computed.attributes, 'spirit', 'wis', 'cha');

        data.computed.armor = {};
        switch (data.armor.type) {
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
        if (data.armor.shield) {
            ac -= 1;
        }
        ac -= data.armor.bonus;
        ac -= data.computed.attributes[data.armor.attribute].mod;
        data.computed.armor.ac = ac;
        if (data.armor.penalizeHardiness) {
            data.computed.saves.hardiness.penalty = 4;
            data.computed.saves.hardiness.save += 4;
        }
        if (data.armor.penalizeEvasion) {
            data.computed.saves.evasion.penalty = 4;
            data.computed.saves.evasion.save += 4;
        }
        if (data.armor.penalizeSpirit) {
            data.computed.saves.spirit.penalty = 4;
            data.computed.saves.spirit.save += 4;
        }

        data.computed.effort = {};
        data.computed.effort.available =
            data.effort.total - (
                data.effort.atWill +
                data.effort.scene +
                data.effort.day
            )
        ;
        data.computed.effort.spent = data.effort.total - data.computed.effort.available;

        data.computed.influence = {};
        data.computed.influence.spent = data.influence.contributed;
        data.computed.dominion = {};
        data.computed.dominion.spent = data.dominion.contributed;
        data.computed.dominion.income = data.dominion.otherIncome;
        if(actorData.items) {
            actorData.items.forEach(i => {
                if(i.type === 'project') {
                    data.computed.dominion.spent += i.data.committedDominion;
                    data.computed.influence.spent += i.data.committedInfluence;
                } else if(i.type === 'artifact') {
                    data.computed.dominion.spent += i.data.committedDominion;
                } else if(i.type === 'cult') {
                    data.computed.dominion.income += i.data.income;
                }
            });
        }
        data.computed.influence.available = data.influence.total - data.computed.influence.spent;
        data.computed.dominion.available = data.dominion.total - data.computed.dominion.spent;

        data.computed.hp = {};
        data.computed.hp.max = 8 + data.computed.attributes.con.mod + (
            (data.level - 1) * (4 + Math.ceil(data.computed.attributes.con.mod / 2))
        );

        let artifactIdx = {};
        data.computed.artifacts = [];
        if(this.data.items && this.data.items.length > 0) {
            this.data.items.forEach(i => {
                let entry = null;
                if(i.type === 'artifact') {
                    entry = artifactIdx[i._id];
                    if(!entry) {
                        entry = {
                            item: null,
                            artifactPowers: []
                        };
                        artifactIdx[i._id] = entry;
                    }
                    entry.item = i;
                    data.computed.artifacts.push(entry);
                } else if(i.type === 'artifactPower') {
                    entry = artifactIdx[i.data.artifactId];
                    if(!entry) {
                        entry = {
                            item: null,
                            artifactPowers: []
                        };
                        artifactIdx[i.data.artifactId] = entry;
                    }
                    entry.artifactPowers.push(i);
                }
            });
        }
        data.computed.artifactIdx = artifactIdx;
    }

    _prepareSave(level, src, dest, atts, name, att1, att2) {
        dest[name] = {};
        dest[name].base = 15 - Math.max(
            atts[att1].mod,
            atts[att2].mod
        ) - Math.max(level - 1, 0);
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
                data.effort.atWill +
                data.effort.scene +
                data.effort.day
            )
        ;
        data.computed.effort.spent = data.effort.total - data.computed.effort.available;

        if(data.numActions > data.numAttacks) {
            data.computed.extraActions = data.numActions - data.numAttacks;
        }

        data.computed.saves = {};
        data.computed.saves.npc = {
            save: data.save
        };
    }

    _extractBonus(roll) {
        let runningTotal = 0;
        for(let i = 0; i < roll.dice.length; i++) {
            for(let j = 0; j < roll.dice[i].results.length; j++) {
                runningTotal += roll.dice[i].results[j].result;
            }
        }
        return roll.total - runningTotal;
    }

    _sortedDiceResults(roll) {
        let results = [];
        for(let i = 0; i < roll.dice.length; i++) {
            for(let j = 0; j < roll.dice[i].results.length; j++) {
                results.push(roll.dice[i].results[j].result);
            }
        }
        results.sort().reverse();
        return results;
    }

    _toNormalDamage(roll) {
        console.log(roll);
        let bonus = this._extractBonus(roll);
        console.log("bonus", bonus);
        let results = this._sortedDiceResults(roll);
        console.log("results", results);
        results[0] = results[0] + bonus;
        let runningTotal = 0;
        for(let i = 0; i < results.length; i++) {
            let roll = results[i];
            if(roll < 2) {
            } else if(roll < 6) {
                runningTotal += 1;
            } else if(roll < 10) {
                runningTotal += 2;
            } else {
                runningTotal += 4;
            }
        }
        return runningTotal;
    }

    async rollAttack(item) {
        let template = 'systems/godbound/templates/chat/attack-roll-result.html';
        // console.log(this);
        let chatData = {
            user: game.user._id,
            speaker: this.token ? {
                token: this
            } : {
                actor: this
            },
        };
        let attrBonus = 0;
        if(this.data.data.computed.attributes) {
            attrBonus = this.data.data.computed.attributes[item.data.data.attr].mod;
        }
        let totalBonus = attrBonus+item.data.data.damageBonus;
        let totalBonusStr = '';
        if(totalBonus > 0) {
            totalBonusStr = `+${totalBonus}`;
        } else if(totalBonus < 0) {
            totalBonusStr = `${totalBonus};`
        }
        let templateData = {
            title: `Attack`,
            damage: `${item.data.data.damageRoll}${totalBonusStr}`,
            damageSource: item.id,
            data: {},
        };
        let roll = new Roll('1d20 + @attrBonus + @toHitBonus + @itemBonus', {
            attrBonus: attrBonus,
            toHitBonus: this.data.data.toHitBonus,
            itemBonus: item.data.data.hitBonus
        });
        roll.roll();
        templateData.roll = await roll.render();
        let target = null;
        if(game.user.targets.size > 0) {
            let token = game.user.targets.values().next().value;
            if(token.actor) {
                if(token.actor.data.type === 'pc') {
                    target = 20 - token.actor.data.data.computed.armor.ac;
                } else {
                    target = 20 - token.actor.data.data.ac;
                }
            }
            templateData.data.targetToken = token;
        }
        let isCheckedForSuccess = target !== null;
        templateData.result = {
            total: roll.total,
            isSuccess: isCheckedForSuccess && roll.total >= target,
            isFailure: isCheckedForSuccess && roll.total < target,
            isCheckedForSuccess,
            target,
        };
        if(isCheckedForSuccess) {
            templateData.result.className = templateData.result.isSuccess ? 'result-msg-success' : 'result-msg-failure';
        }
        templateData.data.actor = this;
        templateData.data.item = item;
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
            await ChatMessage.create(chatData);
        } else {
            chatData.sound = CONFIG.sounds.dice;
            await ChatMessage.create(chatData);
        }
    }

    async rollDamage(source, formula) {
        if(!formula) {
            formula = source.data.data.computed.damageFormula;
        }
        let template = 'systems/godbound/templates/chat/damage-roll-result.html';
        let chatData = {
            user: game.user._id,
            speaker: this.token ? {
                token: this
            } : {
                actor: this
            },
        };
        let templateData = {
            title: `Damage`,
            data: {},
        };
        let roll = new Roll(formula);
        roll.roll();
        templateData.roll = await roll.render();
        templateData.result = {
            straightDamage: roll.total,
            normalDamage: this._toNormalDamage(roll),
        };
        templateData.data.actor = this;
        templateData.data.item = source;
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
    }

    async rollMorale() {
        let template = 'systems/godbound/templates/chat/morale-roll-result.html';
        let chatData = {
            user: game.user._id,
            speaker: this.token ? {
                token: this
            } : {
                actor: this
            },
        };
        let templateData = {
            title: `Morale`,
            data: {},
        };
        let formula = '2d6';
        let roll = new Roll(formula);
        roll.roll();
        let target = this.data.data.morale;
        let result = {
            isSuccess: roll.total <= target,
            isFailure: roll.total > target,
            target: target,
        }
        result.className = result.isSuccess ? 'result-msg-success' : 'result-msg-failure';
        templateData.roll = await roll.render();
        templateData.result = result;
        templateData.data.actor = this;

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
    }

    async demonstrateDoc(item) {
        let pdfCode = item.data.data.pdfCode;
        let pdfPage = item.data.data.pdfPage;
        if(ui && ui.PDFoundry && pdfCode && pdfPage) {
            ui.PDFoundry.openPDFByCode(pdfCode, {page: pdfPage});
        }
    }

    async demonstratePower(item, effortCommitment) {
        let template = 'systems/godbound/templates/chat/power-result.html';
        let chatData = {
            user: game.user._id,
            speaker: this.token ? {
                token: this
            } : {
                actor: this
            },
        };
        let templateData = {
            title: TypeNames(item.type),
            data: {},
        };
        templateData.data.actor = this;
        templateData.data.item = item;
        if(effortCommitment) {
            templateData.data.effort = {[effortCommitment]: true};
        }
        if(!effortCommitment) {
            templateData.data.actions = {};
            if(item.data.data.day) templateData.data.actions.day = true;
            if(item.data.data.scene) templateData.data.actions.scene = true;
            if(item.data.data.atWill) templateData.data.actions.atWill = true;
            if(item.data.data.day) templateData.data.actions.day = true;
        }
        templateData.data.description = this.replaceItemDescriptionMacros(item);
        chatData.content = await renderTemplate(template, templateData);
        ChatMessage.create(chatData);
    }

    _replaceRollDmgMacro(item, formula) {
        let replacement = formula.replace('halfLevel', Math.ceil(this.data.data.level / 2));
        replacement = replacement.replace('level', this.data.data.level);
        return `<span class="damage-formula-roll" data-formula="${replacement}" data-actor-id="${this.id}" data-damage-source="${item.id}">${replacement}</span>`;
    }

    canSpendEffort(amount) {
        if(this.data.data.computed.effort.available >= amount) {
            return true;
        } else {
            ui.notifications.warn("Not enough effort");
            return false;
        }
    }

    canReclaimEffort(amount, type) {
        if(this.data.data.effort[type] >= amount * -1) {
            return true;
        } else {
            ui.notifications.warn(`Cannot reclaim that ${amount} ${type} effort`);
            return false;
        }
    }

    _calcActualEffortCost(item, effortCost) {
        if(effortCost) return effortCost;
        if(item.type === 'divineMiracle' || item.type === 'artifactPower') {
            return Math.min(item.data.data.effortCost, 1);
        }
        return 1;
    }

    _determineEffortTarget(item) {
        if(item.type !== 'artifactPower') return this;
        return this.getOwnedItem(item.data.data.artifactId);
    }

    async commitEffortForDay(item, effortCost) {
        effortCost = this._calcActualEffortCost(item, effortCost);
        let target = this._determineEffortTarget(item);
        if(item.type === 'artifact' && item.data.data.bound) {
            ui.notifications.warn("Artifact already bound for the day");
            return;
        }
        if (target.canSpendEffort(effortCost)) {
            await target.update({data: {effort: {day: target.data.data.effort.day + effortCost}}});
            await this.demonstratePower(item, 'day');
            if(item.type === 'artifact') {
                item.update({data: {bound: true}});
            }
        }
    }
    async commitEffortForScene(item, effortCost) {
        effortCost = this._calcActualEffortCost(item, effortCost);
        let target = this._determineEffortTarget(item);
        if (target.canSpendEffort(effortCost)) {
            await target.update({data: {effort: {scene: target.data.data.effort.scene + 1}}});
            await this.demonstratePower(item, 'scene');
        }
    }

    async commitEffortAtWill(item, effortCost) {
        effortCost = this._calcActualEffortCost(item, effortCost);
        let target = this._determineEffortTarget(item);
        if(target.canSpendEffort(effortCost)) {
            await target.update({data: {effort: {atWill: target.data.data.effort.atWill + 1}}});
            await this.demonstratePower(item, 'atWill');
        }
    }

    async autoSave() {
        let items = this.items.filter(i => i.name === 'Succeed on Save');
        if(items.length < 1) {
            ui.notifications.error("Cannot find Succeed on Save Miracle");
        } else {
            let ownedItem = this.getOwnedItem(items[0].id);
            await this.commitEffortForDay(ownedItem, ownedItem.data.data.effortCost);
        }
    }

    replaceItemDescriptionMacros(item) {
        let description = item.data.data.description || '';

        let segments = description.split(/(@.*?\[.*?])/g);
        let result = [];
        for(let i = 0; i < segments.length; i++) {
            let parsed = segments[i].match(/@(.*?)\[(.*?)]/);
            if(!parsed) {
                result.push(segments[i]);
            } else {
                let macro = segments[i];
                if(parsed[1] === 'RollDmg') {
                    result.push(this._replaceRollDmgMacro(item, parsed[2]));
                } else {
                    result.push(macro);
                }
            }
        }
        return result.join('');
    }

    hasArtifactPowersUnder(id) {
        console.log(id);
        console.log(this.data.data.computed);
        let lookup = this.data.data.computed.artifactIdx[id];
        console.log(lookup);
        return lookup && lookup.artifactPowers.length > 0;
    }

    async resetScene() {
        await this.update({data: {effort: {scene: 0}}});
        if(this.items) {
            for(let i = 0; i < this.items.entries.length; i++) {
                let item = this.items.entries[i];
                if(item.type === 'artifact') {
                    await item.update({data: {effort: {scene: 0}}});
                }
            }
        }
    }

    async resetDay() {
        await this.update({data: {effort: {day: 0, scene: 0}}});
        if(this.items) {
            for(let i = 0; i < this.items.entries.length; i++) {
                let item = this.items.entries[i];
                if(item.type === 'artifact') {
                    await item.update({data: {bound: false, effort: {day: 0, scene: 0, atWill: 0}}});
                }
            }
        }
    }

    async applyDamage(amount) {
        let hpUpdate = {};
        let bonus = this.data.data.hp.bonus;
        let current = this.data.data.hp.current;
        if(bonus > 0) {
            let damageToBonus = Math.min(amount, bonus);
            hpUpdate.bonus = bonus - damageToBonus;
            amount -= damageToBonus;
        }
        if(amount > 0) {
            hpUpdate.current = current - amount;
        }
        await this.update({data: {hp: hpUpdate}});
    }

    async applyHDDamage(amount) {
        let hdUpdate = {};
        let current = this.data.data.hd.current;
        if(amount > 0) {
            hdUpdate.current = current - amount;
        }
        await this.update({data: {hd: hdUpdate}});
    }
}
