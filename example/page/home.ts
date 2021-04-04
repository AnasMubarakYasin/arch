import { Page, page } from "../../src/page.js";
import { html } from "../../src/templating/index.js";
import { detail, list } from '../model/home.js';

@page("home-page")
export class HomePage extends Page {
  onCreate() {
    this.template = html`
      <div>
        <todo-list .model="${{detail, list}}" />
      </div>
    `;
  }
  onDestroy() {}
}
