function formatBeratKotor(value){
    const numericValue = parseFloat(value);
    if (Number.isNaN(numericValue)) return '';
    if (numericValue === 0) return '';
    const rounded = Math.round(numericValue * 100) / 100;
    if (Number.isInteger(rounded)) return `${rounded} KG`;
    return `${rounded.toFixed(2)} KG`;
}

console.log(formatBeratKotor(18));
console.log(formatBeratKotor('18'));
console.log(formatBeratKotor(18.0));
console.log(formatBeratKotor(18.5));
console.log(formatBeratKotor(302));
console.log(formatBeratKotor(302.0));
console.log(formatBeratKotor(302.001));
console.log(formatBeratKotor(0));
