import { render } from "../../../src/html-templating.js";
import { detail, list } from '../../model/home.js';
import { view } from './view.js';
export { detail, list };
const template = render(view(detail, list), 'main');
// console.log(template);
