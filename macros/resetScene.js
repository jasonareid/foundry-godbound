game.actors.entries.forEach(a => {
    a.resetScene();
});
ChatMessage.create({
    content: `<div><h3>Scene Advanced</h3><p>Effort reclaimed.</p></div>`,
});
