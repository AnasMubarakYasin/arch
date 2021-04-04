import {Observable} from '../src/observable-data.js';
describe('Observable data', () => {
    describe('ObservableValue', () => {
        it('should listen on value change', () => {
            const foo = new Observable.Value('foo');

            const listener = (value: string) => {}
            
            foo.subscribe(listener);
        });
    });
});