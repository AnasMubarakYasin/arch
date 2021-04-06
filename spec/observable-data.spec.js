import { Observable } from '../src/observable-data.js';
describe('Observable data', () => {
    describe('ObservableValue', () => {
        it('should listen on value change', () => {
            const foo = new Observable.Value('foo');
            const listener = jest.fn((val) => { });
            foo.subscribe(listener);
            foo.set('baz');
            expect(listener.mock.calls).toHaveBeenCalledWith('baz');
        });
    });
});
