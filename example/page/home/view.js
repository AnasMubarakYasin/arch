import { html, forOf, block } from '../../../src/html-templating.js';
import { action } from './controller.js';
export const view = (detail, list) => {
    const getId = (element) => parseInt(element.closest('li')?.dataset.id ?? '-1');
    const itemClick = (event) => {
        action.dispatch('showItem', { id: getId(event.target) });
    };
    const deleteItem = (event) => {
        event.stopPropagation();
        action.dispatch('deleteItem', { id: getId(event.target) });
    };
    const addItem = (event) => {
        action.dispatch('addItem');
    };
    const editItem = (event) => {
        action.dispatch('editItem');
    };
    const editDoneItem = (event) => {
        action.dispatch('editDoneItem');
    };
    const editTitle = (event) => {
        action.dispatch('editTitle', { value: event.target.value });
    };
    const editDescription = (event) => {
        action.dispatch('editDescription', { value: event.target.value });
    };
    const completeItem = (event) => {
        event.stopPropagation();
        action.dispatch('checkItem', { id: getId(event.target) });
    };
    const searchItem = (event) => {
        action.dispatch('searchItem', { value: event.target.value });
    };
    return html `
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
            raw `
                            <h2 class="subtitle">${detail.title}</h2>
                            <p class="body">${detail.description}</p>
                            <button class="btn md-icons" onclick="${editItem}">edit</button>
                        `.flush();
        }
        else {
            raw `
                            <input class="input" placeholder="title" value="${detail.title}" oninput="${editTitle}"/>
                            <input class="input" placeholder="description" value="${detail.description}" oninput="${editDescription}"/>
                            <button class="btn md-icons" onclick="${editDoneItem}">done</button>
                        `.flush();
        }
    })}
            </article>
            <ul class="todo-list"> 
                ${forOf(list, (raw, item) => {
        raw `
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
};
