import { ActionController } from "../../script/action-controller.js";
import { detail, list } from './index.js';
import { wait } from '../../script/helper.js';
export const action = new ActionController({
    async showItem(data) {
        detail.title.set(list.at(data.id).title);
        detail.description.set(list.at(data.id).description);
        return wait(3000);
    },
    async deleteItem(data) {
    },
    async addItem() {
        list.push({ id: list.length, title: 'todo-' + list.length, description: 'do something', complete: false })
            .commit();
        return wait(3000);
    },
    async editItem() {
    },
    async editDoneItem() {
    },
    async checkItem(data) {
    },
    async searchItem(data) {
    }
});
