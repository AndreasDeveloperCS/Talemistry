import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'bitValue', standalone: false })
export class BitValuePipe implements PipeTransform {
    transform(value: any): string {
        try {
            const bigInt = BigInt('0b' + value);
            const hex = bigInt.toString(16).toUpperCase();
            return hex;
        }
        catch (error) {

            const expandedDecimal = expandScientificNotation(value.toString());
            const recoveredBinaryBigInt = BigInt('0b' + expandedDecimal);
            const hex = recoveredBinaryBigInt.toString(16).toUpperCase();//.padStart(16, '0');
            return hex;
        }

    }
}
function expandScientificNotation(input: string): string {
    if (!input.toLowerCase().includes('e')) {
        return input;
    }
    const [base, exp] = input.toLowerCase().split('e');
    const exponent = parseInt(exp, 10);

    if (base.includes('.')) {
        const [intPart, fracPart] = base.split('.');
        const combined = intPart + fracPart;
        const zerosToAdd = exponent - fracPart.length;
        return combined + '0'.repeat(zerosToAdd);
    } else {
        return base + '0'.repeat(exponent);
    }
}