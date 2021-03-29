import { html, forOf, block } from '../../../src/html-templating.js';
import { ObserveableListInstance, ObserveableMapInstance } from '../../../src/observeable-data.js';
import { action } from './controller.js';

type Detail = {state: string, title: string, description: string};
type List = {id: number, title: string, description: string, done: boolean}[];

export const view = (detail: ObserveableMapInstance<Detail>, list: ObserveableListInstance<List>) => {
    const getId = (element: HTMLElement) => parseInt(element.closest('li')?.dataset.id ?? '-1');
    const itemClick = (event: MouseEvent) => {
        action.dispatch('showItem', {id: getId(event.target as HTMLElement)});
    };
    const deleteItem = (event: MouseEvent) => {
        event.stopPropagation();
        action.dispatch('deleteItem', {id: getId(event.target as HTMLElement)});
    }
    const addItem = (event: MouseEvent) => {
        action.dispatch('addItem');
    }
    const editItem = (event: MouseEvent) => {
        action.dispatch('editItem');
    }
    const editDoneItem = (event: MouseEvent) => {
        action.dispatch('editDoneItem');
    }
    const editTitle = (event: InputEvent) => {
        action.dispatch('editTitle', {value: (event.target as HTMLInputElement).value});
    }
    const editDescription = (event: InputEvent) => {
        action.dispatch('editDescription', {value: (event.target as HTMLInputElement).value});
    }
    const completeItem = (event: MouseEvent) => {
        event.stopPropagation();
        action.dispatch('checkItem', {id: getId(event.target as HTMLElement)});
    }
    const searchItem = (event: InputEvent) => {
        action.dispatch('searchItem', {value: (event.target as HTMLInputElement).value});
    }
    return html`
        <section class="todo-list-component" translate="false" theme="dark">
            <header class="header">
                <img class="img" src="/example/assets/images/task-list-icon-19.jpg" alt="todo list"/>
                <h1 class="title">To-Do List Project</h1>
            </header>
            <div class="search">
                <input class="input" placeholder="search..." oninput="${searchItem}"/>
                <button class="btn md-icons">search</button>
            </div>
            <article class="display-box" state="${detail.state}">
                ${block(detail, (raw, data) => {
                    if (detail.state.equal('display')) {
                        raw`
                            <h2 class="subtitle">${detail.title}</h2>
                            <p class="body">${detail.description}</p>
                            <button class="btn md-icons" onclick="${editItem}">edit</button>
                        `.flush();
                    } else {
                        raw`
                            <input class="input" placeholder="title" value="${detail.title}" oninput="${editTitle}"/>
                            <input class="input" placeholder="description" value="${detail.description}" oninput="${editDescription}"/>
                            <button class="btn md-icons" onclick="${editDoneItem}">done</button>
                        `.flush();
                    }
                })}
            </article>
            <ul class="todo-list"> 
                ${forOf(list, (raw, item) => {
                    raw`
                        <li data-id="${item.id}" data-done="${item.done}" tabindex="0" class="todo-item" onclick="${itemClick}">
                            <span class="subtitle">${item.title}</span>
                            <button class="btn md-icons done" onclick="${completeItem}">done</button>
                            <button class="btn md-icons" onclick="${deleteItem}">delete</button>
                        </li>
                    `.flush();
                })}
            </ul> 
            <button class="btn md-icons" onclick="${addItem}">add</button>
        </section>
    `;
}
