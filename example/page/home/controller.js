import { ActionController } from "../../../src/action-controller.js";
import { detail, list } from '../home.js';
console.log(list);
window.list = list;
window.detail = detail;
export const action = new ActionController({
    async showItem(data) {
        if (detail.state.equal('edit')) {
            return;
        }
        detail.title.set(list.at(data.id).title.get());
        detail.description.set(list.at(data.id).description.get());
    },
    async deleteItem(data) {
        list.splice(data.id, 1);
        list.forEach((value, index) => value.id.set(index));
    },
    async addItem() {
        list.push({ id: list.length, title: 'todo-' + list.length, description: 'do something', done: false });
    },
    async editItem() {
        if (list.selected < 0) {
            return alert('You must select one of list before.');
        }
        detail.set({ state: 'edit' });
    },
    async editDoneItem() {
        detail.set({ state: 'display' });
    },
    async editTitle(data) {
        list.at(list.selected).title.set(data.value);
        detail.title.set(data.value);
    },
    async editDescription(data) {
        list.at(list.selected).description.set(data.value);
        detail.description.set(data.value);
    },
    async checkItem(data) {
        list.at(data.id).done.set(!list.at(data.id).done.get());
    },
    async searchItem(data) {
        if (detail.state.equal('display')) {
            const filtered = list.filter((item) => RegExp(data.value, 'img').test(item.title.get()));
            list.setTempByObserver(filtered.map((item, index) => {
                item.id.set(index);
                return item;
            }));
        }
    }
});
