var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, component } from '../../src/component.js';
import { Observable, } from '../../src/observable-data.js';
import { forOf, html, watchOf } from '../../src/templating/index.js';
let TodoListComponent = class TodoListComponent extends Component {
    constructor() {
        super(...arguments);
        this.itemClick = (event) => {
            // action.dispatch('showItem', { id: getId(event.target as HTMLElement) });
        };
        this.deleteItem = (event) => {
            event.stopPropagation();
            // action.dispatch('deleteItem', { id: getId(event.target as HTMLElement) });
        };
        this.addItem = (event) => {
            // action.dispatch('addItem');
        };
        this.editItem = (event) => {
            // action.dispatch('editItem');
        };
        this.editDoneItem = (event) => {
            // action.dispatch('editDoneItem');
        };
        this.editTitle = (event) => {
            // action.dispatch('editTitle', {
            //   value: (event.target as HTMLInputElement).value,
            // });
        };
        this.editDescription = (event) => {
            // action.dispatch('editDescription', {
            //   value: (event.target as HTMLInputElement).value,
            // });
        };
        this.completeItem = (event) => {
            event.stopPropagation();
            // action.dispatch('checkItem', { id: getId(event.target as HTMLElement) });
        };
        this.searchItem = (event) => {
            // action.dispatch('searchItem', {
            //   value: (event.target as HTMLInputElement).value,
            // });
        };
    }
    onCreate() {
        this.shadowRoot.append(html `<link rel="stylesheet" href="/example/style/index.css"/>`.render().element);
        this.detail = new Observable.Map({
            title: '',
            description: '',
            state: 'display',
        });
        this.list = new Observable.List([
            { id: 0, title: '', description: '', done: false },
        ]);
        this.template = html `
      <section class="todo-list-component" translate="false" theme="dark">
        <header class="header">
          <img
            class="img"
            src="/example/assets/images/task-list-icon-19.jpg"
            alt="todo list"
          />
          <h1 class="title">To-Do List Project</h1>
        </header>
        <div class="search">
          <input
            class="input"
            placeholder="search..."
            oninput="${this.searchItem}"
          />
          <button class="btn md-icons">search</button>
        </div>
        <article class="display-box" state="${this.detail.state}">
          ${watchOf(this.detail, (html, data) => {
            if (data.state.equal('display')) {
                html `
                <h2 class="subtitle">${data.title}</h2>
                <p class="body">${data.description}</p>
                <button class="btn md-icons" onclick="${this.editItem}">
                  edit
                </button>
              `.flush();
            }
            else {
                html `
                <input
                  class="input"
                  placeholder="title"
                  value="${data.title}"
                  oninput="${this.editTitle}"
                />
                <input
                  class="input"
                  placeholder="description"
                  value="${data.description}"
                  oninput="${this.editDescription}"
                />
                <button class="btn md-icons" onclick="${this.editDoneItem}">
                  done
                </button>
              `.flush();
            }
        })}
        </article>
        <ul class="todo-list">
          ${forOf(this.list, (html, item) => {
            html `
              <li
                data-id="${item.id}"
                data-done="${item.done}"
                tabindex="0"
                class="todo-item"
                onclick="${this.itemClick}"
              >
                <span class="subtitle">${item.title}</span>
                <button
                  class="btn md-icons done"
                  onclick="${this.completeItem}"
                >
                  done
                </button>
                <button class="btn md-icons" onclick="${this.deleteItem}">
                  delete
                </button>
              </li>
            `.flush();
        })}
        </ul>
        <button class="btn md-icons" onclick="${this.addItem}">add</button>
      </section>
    `;
    }
    modelChangedCallback(model) {
        this.detail = model.detail;
        this.list = model.list;
        return this;
    }
};
TodoListComponent = __decorate([
    component('todo-list')
], TodoListComponent);
export { TodoListComponent };
