<script>
    import { onMount, afterUpdate } from 'svelte';
    import { parseLine } from './parser';
    export let cutList = null;
    export let draw = null;
    let canvas;
    let ctx;

    function drawAll() {
        if (draw == 'cuts') {
            ctx.strokeStyle = '#a3751b';
            drawCuts();
        }

        if (draw == 'travel') {
            ctx.strokeStyle = 'red';
            drawMoves();
        }
        
        if (draw == 'points') {
            ctx.fillStyle = '#84bc2d';
            ctx.strokeStyle = '#84bc2d';
            drawPoints();
        }
    }

    function drawPoints() {
        let prev = {x:0, y:0};
        drawPoint(prev.x, prev.y, "green");
        for (const cut of cutList) {
            const point = cut.parsedMove; // parseLine(cut.move);
            drawPoint(point.x, point.y, "blue");
            prev = point;
        }
    }
    function drawMoves() {
        let prev = {x:0, y:0};
        for (const cut of cutList) {
            const point = cut.parsedMove; //parseLine(cut.move);
            drawLine(prev, point, 'black');
            // console.log(prev, point);
            prev = point;
        }
    }

    function drawCuts() {
        let prev = {x:0, y:0};
        for (const cut of cutList) {
            const point = cut.parsedMove; // parseLine(cut.move);
            drawCut(point, cut.cutLines);
            prev = point;
        }
    }

    function drawLine(p1, p2, color) {
        ctx.beginPath();
        ctx.moveTo(Math.round(p1.x), Math.round(p1.y));
        ctx.lineTo(Math.round(p2.x), Math.round(p2.y));
        ctx.stroke();
    }

    function drawCut(start, lines) {
        ctx.moveTo(start.x, start.y);
        for (const line of lines) {
            const point = parseLine(line);
            if (point.x === undefined || point.y === undefined) {
                continue;
            }

            ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
    }

    function drawPoint(x,y, color) {
        const radius = 2;

        ctx.beginPath();
        ctx.arc(Math.round(x), Math.round(y), radius, 0, Math.round(2 * Math.PI), false);
        ctx.fill();
        ctx.stroke();
    }
    
    // init canvas
    onMount(() => {
        console.log('mount gcode', draw)
        ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;
        ctx.lineWidth = 1;
        ctx.scale(1,-1);
        ctx.translate(0, -canvas.height);
        ctx.translate(10,10);

        drawAll(cutList);
    });

	afterUpdate(() => {
        if (cutList && ctx) {
            canvas.getContext('2d').clearRect(0,0,canvas.width, canvas.height)
            drawAll(cutList);
        }
	});
</script>

<canvas bind:this={canvas}></canvas>

<style>
    canvas {
        /* outline: 1px solid red; */
        /* background-color: rgb(215, 215, 215); */
    }    
</style>
