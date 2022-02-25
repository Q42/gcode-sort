import { groupIntoCuts } from './parser.mjs';

test('adds 1 + 2 to equal 3', () => {
    expect(groupIntoCuts([])).toBe(3);
});
