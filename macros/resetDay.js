game.actors.entries.forEach(a => {
    a.resetDay();
});
ChatMessage.create({
    content: `<div><h3>Day Advanced</h3><p>Effort reclaimed and artifacts unbound.</p></div>`,
});
