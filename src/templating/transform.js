import { TAG, ARG, CHILD, ENV, KEY, VALUE } from './constant.js';
export function transformCore(template) {
    const string = template.string;
    const stringLength = template.stringLength;
    let buffer = '';
    let context = TAG;
    let root = null;
    for (let index = template.stringIndex; index < stringLength; index++) {
        const char = string[index];
        if (char == '\n') {
            continue;
        }
        if (char == ' ' && string[index + 1] == ' ') {
            index++;
            continue;
        }
        if (char == '<') {
            if (context == TAG) {
                root = { tag: '', attributes: {}, text: '', children: [], type: 'element' };
                let key = '';
                let value = [];
                let quoteCount = 0;
                let spaceCount = 0;
                for (++index; index < stringLength; index++) {
                    const char = string[index];
                    if (char == ' ' && string[index + 1] == ' ') {
                        index++;
                        continue;
                    }
                    if (char == ' ' || char == '\n') {
                        spaceCount++;
                        if (quoteCount) {
                            value.push(buffer, char);
                        }
                        else {
                            if (spaceCount > 1) {
                                if (key += buffer) {
                                    addProperty(root.attributes, key, value);
                                    key = '';
                                    value = [];
                                }
                            }
                            else {
                                root.tag += buffer;
                            }
                            context = KEY;
                        }
                        buffer = '';
                    }
                    else if (char == '=' && quoteCount == 0) {
                        key = buffer;
                        buffer = '';
                        context = VALUE;
                    }
                    else if (char == '"') {
                        quoteCount++;
                        if (quoteCount == 2) {
                            quoteCount = 0;
                            value.push(buffer);
                            buffer = '';
                            context = KEY;
                        }
                    }
                    else if (char == '>') {
                        if (string[index - 1] == '/') {
                            buffer = buffer.slice(0, -1);
                            template.stringIndex = index + 1;
                            index = stringLength;
                        }
                        if (context == KEY) {
                            if (key || (key = buffer)) {
                                addProperty(root.attributes, key, value);
                            }
                        }
                        else if (quoteCount == 0) {
                            if (buffer) {
                                root.tag += buffer;
                            }
                        }
                        buffer = '';
                        context = CHILD;
                        break;
                    }
                    else if (char == ARG) {
                        if (template.argIndex[0] == index) {
                            template.argIndex.shift();
                            const arg = template.pointers[template.pointerIndex++];
                            if (context == VALUE) {
                                buffer = buffer ? buffer + arg.pointer : arg;
                            }
                            else if (context == KEY) {
                                if (buffer[0] == '.' && buffer[2] == '.') {
                                    ENV.debug && console.error('not support object spread');
                                }
                                else {
                                    buffer += arg;
                                }
                            }
                            else if (context == TAG) {
                                if (buffer) {
                                    root.tag = buffer + arg;
                                    buffer = '';
                                }
                                else {
                                    root.tag = arg;
                                }
                            }
                            else {
                                throw new SyntaxError('unknown type on element: ' + arg);
                            }
                        }
                    }
                    else {
                        buffer += char;
                    }
                }
            }
            else {
                if (buffer) {
                    root.children.push({ tag: '', attributes: {}, text: buffer, children: [], type: 'text' });
                }
                if (string[index + 1] == '/') {
                    if (string[index + 2] == '>') {
                        index += 3;
                    }
                    else {
                        index += 3 + root.tag.length;
                    }
                    template.stringIndex = index;
                    break;
                }
                else {
                    template.stringIndex = index;
                    root.children.push(transformCore(template));
                    index = template.stringIndex;
                }
                buffer = '';
            }
        }
        else if (char == ARG) {
            if (template.argIndex[0] == index) {
                template.argIndex.shift();
                const arg = template.pointers[template.pointerIndex++];
                if (context == CHILD) {
                    if (string[index - 1] == '.' && string[index - 3] == '.') {
                        ENV.debug && console.error('not support object spread');
                        buffer = '';
                    }
                    else {
                        root.children.push({ tag: '', attributes: {}, children: [], text: arg, type: 'text' });
                    }
                    if (buffer) {
                        root.children.splice(-1, 0, { tag: '', attributes: {}, children: [], text: buffer, type: 'text' });
                        buffer = '';
                    }
                }
                else {
                    throw new SyntaxError('unknown type on child context: ' + arg);
                }
            }
            else {
                ENV.debug && console.error('template arg miss');
            }
        }
        else {
            buffer += char;
        }
    }
    return root;
}
function addProperty(object, key, value, descriptor = {
    configurable: true,
    enumerable: true,
    writable: true,
    value: null,
}) {
    descriptor.value = value;
    return Object.defineProperty(object, key, descriptor);
}
function addProperties(object, objectToCopy) {
    for (const [key, value] of Object.entries(objectToCopy)) {
        addProperty(object, key, value);
    }
    return object;
}
