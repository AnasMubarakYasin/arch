console.time('init');
// import { forOf, render, html, RawStream, block } from '../../src/html-templating.js';
// import { ObserveableData } from './observeable-data.js';
// import { StateAction } from './state-action.js';

// html`<div>
//     <ul>
//         ${forOf([1, 2, 3], (raw, item, index) => {
//             raw`<li>hi ${item}</li>`;
//         })}
//     </ul>
//     <div>
//         ${block({name: 'anas'}, (raw, data) => {
//             raw`<p>${data.name}</p>`;
//         })}
//     </div>
// </div>`;

// import {a} from './a.js';
// import {b} from './b.js';

// console.log(a, b);

import '../page/home/index.js';
// import { open, env } from '../../src/db.js';
// import {get, env} from '../../src/req.js';
// import { wait } from '../../src/helper.js';

// env.debug = true;

// console.log(get('index.html'));
// window.http = get('http://localhost:6060/example/assets/fonts/iconfont/material-icons.css');
// let response;

// const abortController = new AbortController();
// const promise = new Promise<void>((res, rej) => {
//     wait(0, () => res());
//     abortController.signal.addEventListener('abort', (event) => {
//         console.log(event);
//         rej();
//     });
//     response = get('index.html');
// }).then(() => console.log('sucess') ).catch(() => console.error('failed'));
// wait(0, () => {
//     abortController.abort();
//     console.log(response);
// });


// const dbor = open<{test: {name: string, age: number}, spec: {detail: string}}>('test');
// dbor.onUpgrade(async (db) => {
//     const store = await db.create('test', {autoIncrement: true, keyPath: 'name'});
//     store.createIndex('name', 'name', {multiEntry: true, unique: true});
//     store.addAll([{name: 'anas', age: 21}, {name: 'mubarak', age: 19}]);
// });
// const db = await dbor;
// const result = await db.read('test', async (store) => {
//     // const val = await store.getAll();
//     const val = await store.index('name').getAll();
//     return val;
// });

// console.log(result);

// dbor.onSuccess(async (db) => {
//     console.log('success', db);
//     // const result = db.read('test', async (store) => store.get(1));
//     // console.log(await result);
// }).onUpgrade(async (db) => {
//     console.log('upgrade', db);

//     if (!db.contains('test')) {
//         const store = await db.create('test', {autoIncrement: true});

//         await store.add({name: 'anas mubarak yasin', age: 21});
//     }
// }).onError((error) => {
//     console.error('error', error);
// }).onBlock((error) => {
//     console.error('block', error);
// });

// dbc.db.then((db) => {
//     db.onChange((db) => {
//         console.log('change', db);
//     }).onError((error) => {
//         console.error('error', db);
//     }).onClose((error) => {
//         console.error('close', error);
//     }).onAbort((error) => {
//         console.error('abort', error);
//     });
//     // db.upgrade().
//     window.db = db;
//     // console.log(db);
// }).catch((reason) => {
//     console.error('dbc error', reason);
// });

// console.log(dbc);

// window.dbopen = open;

console.timeEnd('init');

// const idComponent = Symbol('todo-list');
// const detail = new ObserveableData.Map({
//     title: '[some title]',
//     description: '[some description]',
//     state: 'display'
// });
// const list = new ObserveableData.List(
//     {
//         id: 0,
//         title: 'coding',
//         description: 'coding urjs',
//         complete: true
//     },
//     {
//         id: 1,
//         title: 'eat',
//         description: 'eat something',
//         complete: false
//     },
//     {
//         id: 2,
//         title: 'meet',
//         description: 'discussion any project',
//         complete: false
//     }
// );
// const state = new StateAction();
// state.state
// state.on()

// const itemClick = (event: MouseEvent) => {
//     const id = parseInt((event.target as Element).closest('li')?.dataset.id ?? '');
//     detail.title.set(list.at(id).title);
//     detail.description.set(list.at(id).description);
// };
// const deleteItem = (event: MouseEvent) => {
//     event.stopPropagation();

//     list.splice(parseInt((event.target as Element).closest('li')?.dataset.id ?? ''), 1)
//         .commit()
//         .map((item, index) => {
//             item.id = index;
//             return item;
//         })
//         .commit();
// }
// const addItem = (event: MouseEvent) => {
//     list.push({id: list.length, title: 'todo-' + list.length, description: 'something', complete: false})
//         .commit();
// }
// const editItem = (event: MouseEvent) => {
//     detail.set({state: 'edit'});
// }
// const editDoneItem = (event: MouseEvent) => {
//     detail.set({state: 'display'});
//     list.at(list.selected).title = detail.title.get();
//     list.at(list.selected).description = detail.description.get();
//     list.update();
// }
// const inputTitle = (event: InputEvent) => {
//     detail.title.set((event.target as HTMLInputElement).value);
// }
// const inputDescription = (event: InputEvent) => {
//     detail.description.set((event.target as HTMLInputElement).value);
// }
// const completeItem = (event: MouseEvent) => {
//     event.stopPropagation();
//     const id = parseInt((event.target as Element).closest('li')?.dataset.id ?? '');
//     (event.target as Element).classList.toggle('undone');
//     list.at(id).complete = !list.at(id).complete;
//     list.update()
// }
// const searchItem = (event: InputEvent) => {
//     const temp = list.get();
//     const stage = list.filter((item) => RegExp((event.target as HTMLInputElement).value, 'img').test(item.title))
//         .getStage(true);
//     list.update(stage).setTemp(temp);
// }

// const preset = html`
//     <section id="${idComponent}" class="todo-list-component" translate="false" theme="light">
//         <header class="header">
//             <img class="img" src="/src/assets/images/task-list-icon-19.jpg" alt="todo list"/>
//             <h1 class="title">To-Do List Project</h1>
//         </header>
//         <div class="search">
//             <input class="input" placeholder="search..." oninput="${searchItem}"/>
//             <button class="btn md-icons">search</button>
//         </div>
//         <article class="display-box" state="${detail.state}">
//             ${(html: RawStream) => {
//                 if (detail.state.get() == 'display') {
//                     html`
//                         <h2 class="subtitle">${detail.title}</h2>
//                         <p class="body">${detail.description}</p>
//                         <button class="btn md-icons" onclick="${editItem}">edit</button>
//                     `.flush();
//                 } else {
//                     html`
//                         <input class="input" placeholder="title" value="${detail.title}" oninput="${inputTitle}"/>
//                         <input class="input" placeholder="description" value="${detail.description}" oninput="${inputDescription}"/>
//                         <button class="btn md-icons" onclick="${editDoneItem}">done</button>
//                     `.flush();
//                 }
//                 return detail;
//             }}
//         </article>
//         <ul class="todo-list"> 
//             ${(html: RawStream) => {
//                 for (const item of list) {
//                     html`
//                         <li data-id="${item.id}" tabindex="0" class="todo-item" onclick="${itemClick}">
//                             <span class="subtitle">${item.title}</span>
//                             <button class="btn ${item.complete ? '' : 'undone'} md-icons" onclick="${completeItem}">done</button>
//                             <button class="btn md-icons" onclick="${deleteItem}">delete</button>
//                         </li>
//                     `.flush();
//                 }
//                 return list;
//             }}
//         </ul> 
//         <button class="btn md-icons" onclick="${addItem}">add</button>
//     </section>
// `;
// console.log(preset);
// render(preset, 'main');


// detail.subscribe((value) => console.log(value));

// window.detail = detail;
// window.list = list;
// window.preset = preset;
// window.render = render;

// console.log()

// ...${html.of([{name: 'anas'}]).for((item) => {
//     return html`<li>hi ${item.name}</li>`
// })}
// ...${html.for((item, index) => {
//     return html`<li>hi ${item}</li>`
// }, [1, 2, 3])}
// ${(html: TemplateTransform) => {
//     for (const iterator of [1, 2, 3]) {
//         html`<li><li>`;
//         html`<span></span>`;
//     }
//     if (true) {
//         html`<a></a>`;
//     } else {
//         html`<b></b>`;
//     }
// }}