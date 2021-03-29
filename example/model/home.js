import { ObserveableData } from '../../src/observeable-data.js';
export const detail = new ObserveableData.Map({
    title: '[some title]',
    description: '[some description]',
    state: 'display'
});
export const list = new ObserveableData.List([
    {
        id: 0,
        title: 'coding',
        description: 'coding urjs',
        done: false
    },
    {
        id: 1,
        title: 'eat',
        description: 'eat something',
        done: false
    },
    {
        id: 2,
        title: 'meet',
        description: 'discussion any project',
        done: false
    }
]);
