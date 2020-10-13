import {SafeNum} from "./misc.js";

export class PlayerRollDialog extends Dialog {
    static async create(actor, opts, onComplete) {
        let dialogContent = 'systems/godbound/templates/rolls/player-roll-dialog-content.html';

        let template = await renderTemplate(dialogContent,
            Object.assign({}, opts)
        );
        new PlayerRollDialog(actor, {content: template}, onComplete, opts).render(true);
    }

    constructor(actor, dialogData, onComplete, opts) {
        dialogData = Object.assign({
            title: `Roll`,
            buttons: {
                yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: `Roll`,
                    callback: (html) => {
                        let modifier = SafeNum(html.find('#modifier').val());
                        onComplete(Object.assign({}, opts, {
                            modifier
                        }));
                    }
                },
                no: {
                    icon: "<i class='fas fa-times'></i>",
                    label: `Cancel`
                }
            },
            default: 'yes'
        }, dialogData);
        super(dialogData);
        this.actor = actor;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}