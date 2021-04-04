import {Router} from '../src/router.js';

describe('Path module', () => {
    it('should out path segment', () => {
        expect(Router.path.resolve('/home/detail/..')).toBe('/home');
    })
})