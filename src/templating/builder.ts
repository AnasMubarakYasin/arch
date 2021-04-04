import { ARG } from './constant.js';
import { TemplateInit, TemplatePointer } from './type.js';

export function buildTemplateInit(strings: TemplateStringsArray | string[], args: any[]): TemplateInit {
    const templateArgs: TemplatePointer[] = [];
    const argPos: number[] = [];
    let stringLength = strings.length;
    let string = strings[0].trimStart();
    for (let index = 1; index < stringLength; index++) {
        templateArgs.push({ pointer: args.shift() });
        argPos.push(string.length);
        string += ARG + strings[index];
    }
    string = string.trimEnd();
    stringLength = string.length;
    return { string, pointers: templateArgs, stringIndex: 0, argIndex: argPos, stringLength, pointerIndex: 0 };
}