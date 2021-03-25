import { html } from '../../script/html-templating.js';
import { action } from './controller.js';
export const view = (detail, list) => {
    const getId = (element) => parseInt(element.closest('li')?.dataset.id ?? '-1');
    const itemClick = (event) => {
        console.log('clicked');
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
        const description = event.target.previousSibling?.nodeValue;
        const title = event.target.previousSibling?.previousSibling?.nodeValue;
        action.dispatch('editDoneItem', { title, description });
    };
    const completeItem = (event) => {
        event.stopPropagation();
        action.dispatch('checkItem', { id: getId(event.target) });
    };
    const searchItem = (event) => {
        action.dispatch('searchItem', { value: event.target.value });
    };
    return html `
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
                ${(html) => {
        if (detail.state.get() == 'display') {
            html `
                            <h2 class="subtitle">${detail.title}</h2>
                            <p class="body">${detail.description}</p>
                            <button class="btn md-icons" onclick="${editItem}">edit</button>
                        `.flush();
        }
        else {
            html `
                            <input class="input" placeholder="title" value="${detail.title}"/>
                            <input class="input" placeholder="description" value="${detail.description}"/>
                            <button class="btn md-icons" onclick="${editDoneItem}">done</button>
                        `.flush();
        }
        return detail;
    }}
            </article>
            <ul class="todo-list"> 
                ${(html) => {
        for (const item of list) {
            html `
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
};
