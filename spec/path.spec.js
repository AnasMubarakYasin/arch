import { Router } from '../src/router.js';
describe('Path module', () => {
    it('should out path segment', () => {
        expect(Router.Path.resolve('/home/detail/..')).toBe('/home');
    });
});
