import { html } from '../../src/templating/index.js';
import { WebApp } from '../../src/web-app.js';
import { HomePage } from '../page/home.js';
import { TodoListComponent } from '../component/todo-list.js';
TodoListComponent;
HomePage;
export class App extends WebApp {
    constructor() {
        super();
        this.pageView = html `
      <page-layout target="main" debug="true">
        <home-page path="/example/template">
          <page-view path="/detail"/>
        </home-page>
      </page-layout>
    `;
    }
}
