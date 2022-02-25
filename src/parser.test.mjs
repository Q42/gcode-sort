import { groupIntoCuts } from './parser.mjs';

test('a successfull parse returns a result with preamble, cuts and postamble', ()=> {
    const result = groupIntoCuts([]);
    expect(result).toHaveProperty('preamble');
    expect(result).toHaveProperty('cuts');
    expect(result).toHaveProperty('postamble');
})