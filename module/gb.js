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
        if (actor) {
            actor.rollDamage(damageSource, formula);
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
});
