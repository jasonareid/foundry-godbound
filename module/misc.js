export const SafeNum = (val) => {
    if(!val) return 0;
    let number = parseInt(val);
    return isNaN(number) ? 0 : number;
}

export const Capitalize = (val) => {
    if(!val) return '';
    return val.slice(0, 1).toUpperCase() + val.slice(1);
}

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
    cult: 'Cult',
    tactic: 'Tactic',
    artifactPower: 'Artifact Power',
}

export const TypeNames = (type) => {
    return names[type];
}