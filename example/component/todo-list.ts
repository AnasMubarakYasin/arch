import { Component, component } from '../../src/component.js';
import {
  Observable,
  ObservableList,
  ObservableMap,
} from '../../src/observable-data.js';
import { forOf, html, watchOf } from '../../src/templating/index.js';

type Detail = ObservableMap<{ title: string; description: string; state: string; }>;
type List = ObservableList<{id: number, title: string, description: string, done: boolean }[]>;

@component('todo-list')
export class TodoListComponent extends Component {
  detail!: Detail;
  list!: List;
  onCreate() {
    this.shadowRoot.append(html`<link rel="stylesheet" href="/example/style/index.css"/>`.render().element)
    this.detail = new Observable.Map({
      title: '',
      description: '',
      state: 'display',
    });
    this.list = new Observable.List([
      { id: 0, title: '', description: '', done: false },
    ]) as List;
    this.template = html`
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
              html`
                <h2 class="subtitle">${data.title}</h2>
                <p class="body">${data.description}</p>
                <button class="btn md-icons" onclick="${this.editItem}">
                  edit
                </button>
              `.flush();
            } else {
              html`
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
            html`
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
  modelChangedCallback(model: { detail: any; list: any }) {
    this.detail = model.detail;
    this.list = model.list;
    return this;
  }
  itemClick = (event: MouseEvent) => {
    // action.dispatch('showItem', { id: getId(event.target as HTMLElement) });
  };
  deleteItem = (event: MouseEvent) => {
    event.stopPropagation();
    // action.dispatch('deleteItem', { id: getId(event.target as HTMLElement) });
  };
  addItem = (event: MouseEvent) => {
    // action.dispatch('addItem');
  };
  editItem = (event: MouseEvent) => {
    // action.dispatch('editItem');
  };
  editDoneItem = (event: MouseEvent) => {
    // action.dispatch('editDoneItem');
  };
  editTitle = (event: InputEvent) => {
    // action.dispatch('editTitle', {
    //   value: (event.target as HTMLInputElement).value,
    // });
  };
  editDescription = (event: InputEvent) => {
    // action.dispatch('editDescription', {
    //   value: (event.target as HTMLInputElement).value,
    // });
  };
  completeItem = (event: MouseEvent) => {
    event.stopPropagation();
    // action.dispatch('checkItem', { id: getId(event.target as HTMLElement) });
  };
  searchItem = (event: InputEvent) => {
    // action.dispatch('searchItem', {
    //   value: (event.target as HTMLInputElement).value,
    // });
  };
}
