export function groupIntoCuts(lines) {
    const preamble = [], cuts = [], postamble = [];
    let currentCut;
    let mode = 'preamble';

    for (let l = 0; l < lines.length; l++) {
        const line = lines[l];
        switch (mode) {
            case 'preamble':
                if (!line.startsWith('G0')) {
                    preamble.push(line);
                    break;
                } 
                // else fall through
                mode = 'cuts';
            case 'cuts':
                if (line.startsWith('G0')) {
                    currentCut = { 
                        move: line, 
                        parsedMove: parseLine(line),
                        cutLines: []
                    };
                    cuts.push(currentCut);
                    break;
                }
        
                else if (line.startsWith('G1')) {
                    currentCut.cutLines.push(line);
                    break;
                }
                
                // else fall through
                mode = 'postamble';
            case 'postamble':
                postamble.push(line);
                break;
        }
    }

    return {
        preamble,
        cuts,
        postamble
    };
}

export function unParseCuts(preamble, cuts, postamble) {
    let text = '';

    // start GCODE
    text += preamble.map(l=> l+'\n').join('');

    // main GCODE
    for (const cut of cuts) {
        text += cut.move + '\n';
        for (const line of cut.cutLines) {
            text += line + '\n';
        }
    }
    // end GCODE
    text += postamble.join('\n');
    return text;
}

export function parseLine(line) {
    const parts = line.split(' ');

    const result = {};
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const key = part[0];
        if (key !== undefined) {
            result[key.toLowerCase()] = parseFloat(part.substring(1));
        }
    }
    // console.log(result);

    return result;
}
