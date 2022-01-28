<script>
    import FileDrop from "filedrop-svelte";
    import fileSize from "filesize";
    import Gcode from "./gcode.svelte";
    import { onMount } from "svelte";
    import { two_opt } from "./TwoOpt";

    let file;
    let cutList;
    let tour;
    let initialTravelDistance;

    function parseLine(line) {
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

    function groupIntoCuts(lines) {
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

    async function getLines(file) {
        const text = await file.text();
        const lines = text.split('\n');
        return lines;
    }

    async function onFileDrop(e) {
        const files = e.detail.files;

        if (files.accepted.length) {
            file = files.accepted[0];
            updateGcode(file);
        }
    }

    async function updateGcode(file) {
        const lines = await getLines(file);
        cutList = groupIntoCuts(lines); //.slice(0,12)
        // console.log(cutList);
        initialTravelDistance = distanceCutList( cutList );
        tour = {
            vertices : cutList,
            cost : initialTravelDistance
        };
    }

    function distanceCutList(cuts) {
        let total = 0;
        let prev = null;
        for (let c = 0; c< cuts.length ; c++) {
            const cut = cuts[c];
            
            // startPos
            const prevPos =  prev || {x:0, y:0};
            const nextPos =  parseLine( cut.move) ;
            const d = delta (prevPos, nextPos);
            // console.log( prevPos, nextPos, d);
            
            prev = nextPos;
            total+=d;
        }

        return total;
    }

    function iterOptimize() {
        const iterations = 20;
        let currentIter = 1;

        optimize();
        function optimize() {
            tour = two_opt(tour, distanceCutList);

            cutList = tour.vertices;
            console.log(tour.cost, tour.vertices.length);

            currentIter++;

            if (currentIter < iterations) {
                requestAnimationFrame(optimize);
            }
        }
    }

    function delta(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt( dx*dx + dy*dy );
    }

    function download() {
        let text = '';
        // TODO start GCODE
        for (const cut of tour.vertices) {
            text += cut.move + '\n';
            for (const line of cut.cutLines) {
                text += line + '\n';
            }
        }
        // TODO end GCODE

        const el = document.createElement('a');
        el.setAttribute('href','data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        el.setAttribute('download', file.name + '-sorted.nc');
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
    }

    onMount(async () => {
        const response = await fetch('/schaakbord.nc');
        file = await response.blob();
        await updateGcode( file );
    });

</script>

<main>
    <h1>GCODE sorter</h1>
    <p>Optimize a GCODE file by reducing the total time spent moving the bit (G0) vs cutting or carving (G1)</p>
    <!-- <p>WARNING: this changes the order of the cuts</p>
    <p>assumes: absolute mode</p> -->

    
    <div class="dropzone" class:hide="{!!file}">
        <FileDrop on:filedrop={onFileDrop} fileLimit=1 >
            &nbsp;
        </FileDrop>
    </div>
    
    
    {#if file}
        <button on:click={iterOptimize}>optimize</button>
        <p>
            {file.name} - {fileSize(file.size)} <br>
            G0 / travel: {tour && Math.round(tour.cost)}mm (initial {Math.round(initialTravelDistance)}mm) <br>
            <!-- G1 / cutting:  -->
        </p>
        <button on:click={download}>download</button>
    {/if}

    {#if cutList}
        <div class="gcode-wrapper">
            <Gcode cutList={cutList} draw="cuts" />
            <Gcode cutList={cutList} draw="points" />
            <Gcode cutList={cutList} draw="travel" />
        </div>
    {/if}

    <p>Copyright Q42 2022</p>   
</main>

<style>
    .dropzone {
        background-color: rgb(198, 198, 198);
    }

    .dropzone.hide {
        position: absolute;
        display: none;
    }

    .gcode-wrapper {
        background-color:rgb(238 238 238);
        height: 512px;
    }

    :global(.gcode-wrapper > * ){
        position: absolute;
    }
</style>