if(!window.ACTOR_SHEET_DEV_MACRO_FN) {
    window.ACTOR_SHEET_DEV_MACRO_FN = (ev) => {
        delete _templateCache["systems/godbound/templates/actor-sheet.html"];
        game.actors.entities[0].sheet.render(true);

        var links = document.getElementsByTagName("link");
        for (var cl in links)
        {
            var link = links[cl];
            if (link.rel === "stylesheet")
                link.href += "";
        }
    };
}
if(window.ACTOR_SHEET_DEV_MACRO_ACTIVE) {
    $(window).off('focus', window.ACTOR_SHEET_DEV_MACRO_FN);
    window.ACTOR_SHEET_DEV_MACRO_ACTIVE = false;
    ui.notifications.info("actor sheet dev deactivated");
}
else {
    $(window).on('focus', window.ACTOR_SHEET_DEV_MACRO_FN);
    window.ACTOR_SHEET_DEV_MACRO_ACTIVE = true;
    ui.notifications.info("actor sheet dev activated");
}
