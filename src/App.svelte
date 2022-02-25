<script>
    import FileDrop from "filedrop-svelte";
    import fileSize from "filesize";
    import Gcode from "./gcode.svelte";
    import { onMount } from "svelte";
    import { two_opt } from "./TwoOpt";
    import { groupIntoCuts, unParseCuts, parseLine } from "./parser";

    let file;
    let toolpath, preamble, postamble;
    let optimizedToolpath;
    let tour;
    let initialTravelDistance;
    let iterations = 40;
    let curIter = 0;
    let displayCuts = true;
    let progress = 0;
    let isSorted = false;


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

    let totalDistance = 0;
    function analyzeGCode(lines) {
        const commands = lines
            .map(line=>parseLine(line))
            .filter(cmd => (cmd.g == 0 || cmd.g == 1) && cmd.x !== undefined && cmd.y !== undefined);
        
            console.log(commands.length)
        let prev = { x:0, y:0 };
        let totalDistance = 0;
        for (const cmd of commands) {
            if (cmd )
            totalDistance += delta(prev, cmd);
            prev = cmd;
        }
        
        console.log(totalDistance)
        return {
            totalDistance
        }
    }

    async function updateGcode(file) {
        const lines = await getLines(file);
        ({ totalDistance } = analyzeGCode(lines));
        ({ preamble, cuts: toolpath, postamble } = groupIntoCuts(lines)); //.slice(0,12)
        // console.log(cutList);
        optimizedToolpath = toolpath.slice();
        initialTravelDistance = distanceCutList( optimizedToolpath );
        tour = {
            vertices : optimizedToolpath,
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
            const nextPos =  cut.parsedMove; // parseLine( cut.move) ;
            const d = delta (prevPos, nextPos);
            // console.log( prevPos, nextPos, d);
            
            prev = nextPos;
            total+=d;
        }

        return total;
    }

    function iterOptimize() {
        isSorted = true;
        
        optimize();
        function optimize() {
            progress = iterations && 100*curIter/iterations
            if (curIter < iterations) {
                requestAnimationFrame(optimize);
            }
            tour = two_opt(tour, distanceCutList);

            optimizedToolpath = tour.vertices;
            // console.log(tour.cost, tour.vertices.length);

            curIter++;
        }
    }

    function delta(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt( dx*dx + dy*dy );
    }

    function download() {
        let text = unParseCuts(preamble, optimizedToolpath, postamble);

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
        <section>
            <div class="gcode-wrapper">
                {#if toolpath}
                    {#if displayCuts}
                        <Gcode cutList={toolpath} draw="cuts" />
                    {/if}
                    <Gcode cutList={toolpath} draw="points" />
                    <Gcode cutList={optimizedToolpath} draw="travel" />
                {/if}
            </div>

            <div class="controls">
                <div class="sorting">
                    <div>
                        <label for="iterations" >iterations</label>
                        <input id="iterations" min=1 type=number bind:value={iterations} />
                    </div>
                    <button on:click={iterOptimize} disabled={isSorted}>sort</button>
                    
                    {#if progress && progress != 100}
                        <div>
                            <progress id="progress" max="100" value={progress}></progress>
                        </div>
                    {/if}
                </div>

                <div>
                    <table>
                        <tr><th>initial length</th><td>{Math.round(totalDistance)} mm</td></tr>
                        <tr><th>initial travel</th><td>{tour && Math.round(initialTravelDistance)} mm</td></tr>
                        <tr><th>optimized travel</th><td>{tour && Math.round(tour.cost)} mm</td></tr>
                        <tr><th>travel saved</th><td>{ tour && Math.round(100 - 100 * tour.cost / initialTravelDistance)}%</td></tr>
                        <tr><th>total saved</th><td>{ tour && Math.round(100 - 100 * (totalDistance - initialTravelDistance + tour.cost) / totalDistance)}%</td></tr>
                    </table>
                    <!-- G1 / cutting:  -->
                    
                    <br>{file.name} - {fileSize(file.size)} <br>
                    <button on:click={download}>download</button>
                </div>
            </div>
        </section>
        <div>
            <input id="displayCuts" type=checkbox bind:checked={displayCuts} />
            <label for="displayCuts" >show carving</label>
        </div>
    {/if}

    <p>Copyright R.Veldkamp, Q42 2022</p>   
</main>

<style>
    main {
        max-width: 900px;
        margin: auto;
    }
    .dropzone {
        background-color: rgb(198, 198, 198);
    }

    .dropzone.hide {
        position: absolute;
        display: none;
    }

    section {
        background-color:rgb(238 238 238);
        display: flex;
        justify-content: space-between;
        padding: 10px;
    }
    
    :global(.gcode-wrapper  *) {
        position: absolute;
    }

    :global(.gcode-wrapper  :last-child) {
        position: static;
    }

    .controls {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .sorting {
        display: flex;
        flex-direction: column;
    }

    table {
        text-align: left;
    }

    table td {
        text-align: right;
    }

    /* .gcode-wrapper:nth-child(2) {
        position: absolute;
    } */
</style>