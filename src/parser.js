export function groupIntoCuts(lines) {
    const cuts = [];
    let currentCut;

    for (let l = 0; l < lines.length; l++) {
        const line = lines[l];
        if (line.startsWith('G0')) {
            currentCut = { move: line, cutLines: [] };
            cuts.push(currentCut);
        }

        else if (currentCut) {
            currentCut.cutLines.push(line);
        }
    }
    return cuts;
}
