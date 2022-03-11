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
    let totalDistance = 0;
    let iterations = 42;
    let curIter = 0;
    let displayCuts = true;
    let displayZChanges = true;
    let displayTravel = true;
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

    // onMount(async () => {
    //     const response = await fetch('/schaakbord.nc');
    //     file = await response.blob();
    //     await updateGcode( file );
    // });

</script>

<main>
    <a href="https://blog.q42.nl/passietijd/"><img class='passietijd-logo' src='passietijd_project.png' /></a>
    <h1>GCODE sort</h1>
    <p>GCode toolpaths too long? Reduce travel by sorting the cuts. Should work with Easel.</p>
    <!-- <p>Re-order the operations in a GCODE file to reduce the time spent moving the bit (G0) vs cutting or carving (G1)</p> -->
    <!-- <p>WARNING: this changes the order of the cuts</p>
    <p>assumes: absolute mode</p> -->

    
    <div class="dropzone" class:hide="{!!toolpath}">
        <FileDrop on:filedrop={onFileDrop} fileLimit=1 >
            &nbsp;
        </FileDrop>
    </div>
    
    
    {#if toolpath}
        <section>
            <div class="gcode-wrapper">
                {#if toolpath}
                    {#if displayCuts}
                        <Gcode cutList={toolpath} draw="cuts" />
                    {/if}
                    {#if displayZChanges}
                        <Gcode cutList={toolpath} draw="points" />
                    {/if}
                    {#if displayTravel}
                        <Gcode cutList={optimizedToolpath} draw="travel" />
                    {/if}
                {/if}
            </div>

            <div class="controls">
                <div class="sorting">
                    <div>
                        <label for="iterations" >iterations</label>
                        <input id="iterations" min=1 type=number bind:value={iterations} disabled={isSorted} />
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
                    <table>
                        <tr><td><label for="displayCuts" >show carving</label></td> <td><input id="displayCuts" type=checkbox bind:checked={displayCuts} /></td></tr> 
                        <tr><td><label for="displayZChanges" >show z changes</label></td> <td><input id="displayZChanges" type=checkbox bind:checked={displayZChanges} /></td></tr> 
                        <tr><td><label for="displayTravel">show travel</label></td> <td><input id="displayTravel" type="checkbox" bind:checked={displayTravel} /></td></tr>
                    </table>
                    
                    <button on:click={download} disabled={!isSorted} >download {file.name} - {fileSize(file.size)}</button>
                </div>
            </div>
        </section>
        
    {/if}

    <article>
        <img class="preview" width=200 src="gcode_sort.gif" />
        <h2 id="what-is-it-">What is it?</h2>
        
<p>This tool will optimize a toolpath&#39;s total distance and therefore it will reduce the total run time. It does this by re-ordering the cuts such that the &#39;travel&#39; distance (ie &#39;not cutting&#39;) is minimized.</p>
<h2 id="how-to-use-it-">How to use it?</h2>
<p>Drag &#39;n drop your gcode file.
Press the &#39;sort&#39; button.
Check the preview if the design still looks good.
If so, click on the download button for the optimized file.</p>
<h2 id="why-did-i-create-this-">Why did I create this?</h2>
<p>I was routing a design for a friend, the chessboard in the example, and we noticed how inefficient the toolpath was. We were joking that even a random order would have been more efficient and it was probably true.
So I created this tool to address that, albeit after the job was already done. So I guess it was more for the fun of it ;-)</p>
<h2 id="caveats">Caveats</h2>
<ul>
<li><p>It was created to work with gcode files from Easel. It will most likely not work with gcode files from other sources. This is because gcode is a very loose standard and it is impossible to be compatible with all possible flavors.</p>
</li>
<li><p>It may also not work properly with some other gcode files from Easel as I have only tested with a handful files so far :-)</p>
</li>
<li><p>In short: I give no guarantees that it will work properly so please be careful.</p>
</li>
</ul>

    </article>
    <footer>
        <p>Made with <span title='passion'>❤️</span> by <a href="https://twitter.com/remcoder">Remco</a> @ <a href='https://www.q42.nl/en'>Q42</a></p>
        <p><a href='https://github.com/Q42/gcode-sort'>source</a> - <a href='https://github.com/Q42/gcode-sort/issues/new'>report an issue</a></p>
        <img src="https://logo.q42.com/q42-logo.svg" height=42 />
    </footer>
</main>

<style>
    h1,h2,a {
        color: #84bc2d;
    }
    img.preview {
        float: right;
        margin: 10px;
    }

    img.passietijd-logo {
        position: absolute;
        transform: rotate(45deg);
        right:10px;
        top:10px;
        width: 200px;
    }
    main {
        max-width: 900px;
        margin: auto;
    }
    :global(.dropzone p ) {
        box-sizing: border-box;
        height: 100%;
        background-color: inherit !important;
        outline: 0px !important;
        border-width: 5px !important;
    }

    :global(.dropzone p span ) {
        color: inherit !important;
    }
    .dropzone {
        /* background-color: rgb(198, 198, 198); */
        
        box-sizing: border-box;
        height: 512px;
    }

    .dropzone.hide {
        position: absolute;
        display: none;
    }

    section {
        /* background-color:rgb(238 238 238); */
        background-color:  rgb(67 67 67);
        display: flex;
        justify-content: space-between;
        padding: 20px;
        border-radius: 10px;
    }
    .gcode-wrapper {
        height: 512px;
    }

    :global(.gcode-wrapper  *) {
        position: absolute;
    }

    :global(.gcode-wrapper  :last-child) {
        xposition: static;
    }

    .controls {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        max-width: 260px;
    }

    .sorting {
        display: flex;
        flex-direction: column;
    }

    .sorting label, .sorting input {
        width: 49%;
    }

    .sorting label {
        display: inline-block;
    }

    table {
        text-align: left;
        width: 100%;
    }

    table  input {
        margin: 0;
    }

    table th+td, table td+td  {
        text-align: right;
    }

    /* .gcode-wrapper:nth-child(2) {
        position: absolute;
    } */

    footer {
        margin-top: 60px;
        text-align: center;
    }
    footer img {
        display: block;
        margin: auto;
    }
</style>