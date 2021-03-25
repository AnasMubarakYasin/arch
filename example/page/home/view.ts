import {html, RawStream} from '../../script/html-templating.js';
import { ObserveableListInstance, ObserveableMapInstance } from '../../script/observeable-data.js';
import { action } from './controller.js';

type Detail = {state: string, title: string, description: string};
type List = {id: number, title: string, description: string, complete: boolean}[];

export const view = (detail: ObserveableMapInstance<Detail>, list: ObserveableListInstance<List>) => {
    const getId = (element: HTMLElement) => parseInt(element.closest('li')?.dataset.id ?? '-1');
    const itemClick = (event: MouseEvent) => {
        console.log('clicked');
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
        const description = (event.target as HTMLElement).previousSibling?.nodeValue;
        const title = (event.target as HTMLElement).previousSibling?.previousSibling?.nodeValue;
        action.dispatch('editDoneItem', {title, description});
    }
    const completeItem = (event: MouseEvent) => {
        event.stopPropagation();
        action.dispatch('checkItem', {id: getId(event.target as HTMLElement)});
    }
    const searchItem = (event: InputEvent) => {
        action.dispatch('searchItem', {value: (event.target as HTMLInputElement).value});
    }
    return html`
        <section class="todo-list-component" translate="false" theme="light">
            <header class="header">
                <img class="img" src="/src/assets/images/task-list-icon-19.jpg" alt="todo list"/>
                <h1 class="title">To-Do List Project</h1>
            </header>
            <div class="search">
                <input class="input" placeholder="search..." oninput="${searchItem}"/>
                <button class="btn md-icons">search</button>
            </div>
            <article class="display-box" state="${detail.state}">
                ${(html: RawStream) => {
                    if (detail.state.get() == 'display') {
                        html`
                            <h2 class="subtitle">${detail.title}</h2>
                            <p class="body">${detail.description}</p>
                            <button class="btn md-icons" onclick="${editItem}">edit</button>
                        `.flush();
                    } else {
                        html`
                            <input class="input" placeholder="title" value="${detail.title}"/>
                            <input class="input" placeholder="description" value="${detail.description}"/>
                            <button class="btn md-icons" onclick="${editDoneItem}">done</button>
                        `.flush();
                    }
                    return detail;
                }}
            </article>
            <ul class="todo-list"> 
                ${(html: RawStream) => {
                    for (const item of list) {
                        html`
                            <li data-id="${item.id}" tabindex="0" class="todo-item" onclick="${itemClick}">
                                <span class="subtitle">${item.title}</span>
                                <button class="btn ${item.complete ? '' : 'undone'} md-icons" onclick="${completeItem}">done</button>
                                <button class="btn md-icons" onclick="${deleteItem}">delete</button>
                            </li>
                        `.flush();
                    }
                    return list;
                }}
            </ul> 
            <button class="btn md-icons" onclick="${addItem}">add</button>
        </section>
    `;
}
