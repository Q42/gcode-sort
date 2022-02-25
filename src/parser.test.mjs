import { groupIntoCuts, unParseCuts } from './parser.mjs';

test('a successfull parse returns a result with preamble, cuts and postamble', ()=> {
    const result = groupIntoCuts([]);
    expect(result).toHaveProperty('preamble');
    expect(result).toHaveProperty('cuts');
    expect(result).toHaveProperty('postamble');
})

test('preamble should be everything before the first G0', ()=> {
    const result = groupIntoCuts(['aap','noot','G0 X0 Y0']);
    expect(result.preamble).toEqual(['aap','noot']);
});

test('cuts should be the part from the first G0', ()=> {
    const result = groupIntoCuts(['aap','noot','G0 X0 Y0']);
    expect(result.cuts[0].move).toEqual('G0 X0 Y0');
});

test('every G0 results in a new cut', ()=> {
    const result = groupIntoCuts(['aap','G0 X0 Y0', 'G0 X1 Y1']);
    expect(result.cuts[1].move).toEqual('G0 X1 Y1');
});

test('every G1 following a G0 is part of that cut', ()=> {
    const result = groupIntoCuts(['aap','G0 X0 Y0', 'G1 X1 Y1', 'G1 X2 Y2']);
    expect(result.cuts[0].cutLines).toEqual(['G1 X1 Y1', 'G1 X2 Y2']);
});

test('2 cuts', ()=> {
    const result = groupIntoCuts(['aap','G0 X0 Y0', 'G1 X1 Y1', 'G0 X2 Y2', 'G1 X3 Y3']);
    expect(result.cuts[0]).toEqual({
        move: 'G0 X0 Y0',
        cutLines: ['G1 X1 Y1']
    });
    expect(result.cuts[1]).toEqual({
        move: 'G0 X2 Y2',
        cutLines: ['G1 X3 Y3']
    });
});

test('postamble is everything after G0/G1 cuts', ()=>{
    const result = groupIntoCuts(['G0 X0 Y0', 'bla']);
    expect(result.postamble).toEqual(['bla']);
});

test('postamble is everything after G0/G1 cuts (2)', ()=>{
    const result = groupIntoCuts(['G0 X0 Y0', 'G21', 'G90']);
    expect(result.postamble).toEqual(['G21', 'G90']);
});

test('postamble might include G0/G1', ()=>{
    const result = groupIntoCuts(['G0 X0 Y0', 'G21', 'G90', 'G0 X0 Y0']);
    expect(result.postamble).toEqual(['G21', 'G90', 'G0 X0 Y0']);
});

test('real life example', () => {
    const result = groupIntoCuts([
        'G21', 
        'G90', 
        'G1 Z3.810 F228.6',
        'G0 X69.333 Y108.024',
        'G1 Z-0.700 F50.0',
        'G1 X57.888 Y108.024 F762.0',
        'G21',
        'G90',
        'G1 Z3.810 F50.0',
        'G0 X0.000 Y0.000',
        'G4 P0.1'
    ]);

    expect(result.preamble).toEqual(['G21', 'G90', 'G1 Z3.810 F228.6']);
    expect(result.cuts[0]).toEqual({
        move: 'G0 X69.333 Y108.024',
        cutLines: ['G1 Z-0.700 F50.0', 'G1 X57.888 Y108.024 F762.0']
    })
    expect(result.postamble).toEqual([
        'G21',
        'G90',
        'G1 Z3.810 F50.0',
        'G0 X0.000 Y0.000',
        'G4 P0.1'
    ]);
});

test('unparse example', () => {
    const gcode = [
        'start', 
        'aap',
        'G0 X0 Y0',
        'G1 X1 Y1',
        'end',
        'end'
    ];

    const result = groupIntoCuts(gcode);

    const original = unParseCuts(result.preamble, result.cuts, result.postamble);

    expect(original.split('\n')).toEqual(gcode)
});

test('unparse no preable should not start with empty line', () => {
    const gcode = [
        'G0 X0 Y0',
        'G1 X1 Y1',
        'end',
        'end'
    ];

    const result = groupIntoCuts(gcode);

    const original = unParseCuts(result.preamble, result.cuts, result.postamble);

    expect(original.split('\n')).toEqual(gcode)
});
