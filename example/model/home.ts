import { Observable } from '../../src/observable-data.js';

export const detail = new Observable.Map({
  title: '[some title]',
  description: '[some description]',
  state: 'display',
  pass: false
});

export const list = new Observable.List([
  {
    id: 0,
    title: 'coding',
    description: 'coding urjs',
    done: false,
  },
  {
    id: 1,
    title: 'eat',
    description: 'eat something',
    done: false,
  },
  {
    id: 2,
    title: 'meet',
    description: 'discussion any project',
    done: false,
  },
]);
