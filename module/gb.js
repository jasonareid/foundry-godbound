/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import {GodboundActor} from "./actor.js";
import {GodboundItem} from "./item.js";
import {GodboundItemSheet} from "./item-sheet.js";
import {GodboundActorSheet} from "./actor-sheet.js";
import {EffortCommitmentDialog} from "./effortCommitmentDialog.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {
    console.log(`Initializing Godbound System`);

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d20",
        decimals: 2
    };

    // Define custom Entity classes
    CONFIG.Actor.entityClass = GodboundActor;
    CONFIG.Item.entityClass = GodboundItem;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("godbound", GodboundActorSheet, {makeDefault: true});
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("godbound", GodboundItemSheet, {makeDefault: true});

    // Register system settings
    game.settings.register("godbound", "macroShorthand", {
        name: "Shortened Macro Syntax",
        hint: "Enable a shortened macro syntax which allows referencing attributes directly, for example @str instead of @attributes.str.value. Disable this setting if you need the ability to reference the full attribute model, for example @attributes.str.label.",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    Handlebars.registerHelper('concat', function() {
        var outStr = '';
        for (var arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper('orderedEach', function(obj, keys, options) {
        let accum = '';
        for(let i = 0; i < keys.length; i++) {
            let value = obj[keys[i]];
            if(value) {
                accum += options.fn(value);
            }
        }
        return accum;
    });

    Handlebars.registerHelper('toLowerCase', function(str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper('cap', function(str) {
        return Capitalize(str);
    });

    Handlebars.registerHelper("ifeq", function(arg1, arg2, options) {
        if (arg1 === arg2) {
            return options.fn(this);
        }
    });

    Handlebars.registerHelper("unlesseq", function(arg1, arg2, options) {
        if (arg1 !== arg2) {
            return options.fn(this);
        }
    });

    Handlebars.registerHelper("ifcombatpower", function(actorId, itemId, options) {
        let actor = game.actors.get(actorId);
        if(actor) {
            let item = actor.getOwnedItem(itemId);
            if(item) {
                if(item.data.data.combatPower) {
                    if(item.type === 'artifactPower') {
                        let artifactId = item.data.data.artifactId;
                        let artifact = actor.getOwnedItem(artifactId);
                        if(!artifact.data.data.completed || !artifact.data.data.bound) {
                            return;
                        }
                    }
                    return options.fn(this);
                }
            }
        }
    });

    Handlebars.registerHelper("ifneq", function(arg1, arg2, options) {
        if (arg1 !== arg2) {
            return options.fn(this);
        }
    });

    Handlebars.registerHelper('times', function(n, options) {
        var accum = '';
        for(var i = 0; i < n; ++i)
            accum += options.fn(i);
        return accum;
    });

    Handlebars.registerHelper('add', function(a1, a2) {
        return a1 + a2;
    });

    Handlebars.registerHelper('json', function(context) {
        return JSON.stringify(context);
    });

    $(document).on('click', '.damage-formula-roll', ev => {
        let span = $(ev.currentTarget);
        let formula = span.data('formula');
        let actor = game.actors.get(span.data('actorId'));
        let damageSource = actor.getOwnedItem(span.data('damageSource'));

        let damageTarget = null;
        let damageTargetId = span.data('targetTokenId');
        if(damageTargetId) {
            damageTarget = canvas.tokens.get(damageTargetId);
        }
        if (actor) {
            actor.rollDamage(damageSource, formula, damageTarget);
        }
    });

    $(document).on('click', '.instant-auto-save', ev => {
        let span = $(ev.currentTarget);
        let actorId = span.data('actorId');
        let actor = game.actors.get(actorId);
        if (actor) {
            actor.autoSave();
        }
    });

    if(!game.Godbound) {
        game.Godbound = {};
    }
    game.Godbound.executeGodboundItemMacro = executeGodboundItemMacro;
    Hooks.on("hotbarDrop", (bar, data, slot) => createGodboundMacro(data, slot));
});
async function createGodboundMacro(data, slot) {
    console.log("CREATE GODBOUND MACRO");
    console.log(data);
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;

    //Create the macro command
    const command = `game.Godbound.executeGodboundItemMacro("${item._id}", "${item.name}", "${data.actorId}");`;
    let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "boilerplate.itemMacro": true }
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}
async function executeGodboundItemMacro(itemId, itemName, actorId) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(actorId);
    if (!actor) actor = game.actors.get(speaker.actor);
    let item = actor ? actor.items.find(i => i._id === itemId) : null;
    if(!item) {
        return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName} with id ${itemId}`);
    }

    if(item.type === 'autoHitAttack') {
        actor.rollDamage(item);
    } else if(item.type === 'attack') {
        actor.rollAttack(item);
    } else if(item.type === 'divineMiracle') {
        actor.commitEffortForDay(item);
    } else if(item.type === 'divineGift' || item.type === 'artifactPower') {
        let options = item.getCommitmentOptions();
        if(options.length === 1) {
            await actor[options[0].actorFnRef](item);
        } else {
            await EffortCommitmentDialog.create(actor, item, {}, (choice) => {
                if(choice) {
                    actor[choice](item);
                }
            });
        }
    }
}