<script>
    import { onMount, afterUpdate } from 'svelte';
    export let cutList = null;
    export let draw = null;
    let canvas;
    let ctx;

    function drawAll() {
        if (draw == 'cuts') {
            ctx.strokeStyle = 'orange';
            drawCuts();
        }

        if (draw == 'travel') {
            ctx.strokeStyle = 'red';
            drawMoves();
        }
        
        if (draw == 'points') {
            drawPoints();
        }
    }

    function drawPoints() {
        let prev = {x:0, y:0};
        drawPoint(prev.x, prev.y, "green");
        for (const cut of cutList) {
            const point = parseLine(cut.move);
            drawPoint(point.x, point.y, "blue");
            prev = point;
        }
    }
    function drawMoves() {
        let prev = {x:0, y:0};
        for (const cut of cutList) {
            const point = parseLine(cut.move);
            drawLine(prev, point, 'black');
            // console.log(prev, point);
            prev = point;
        }
    }

    function drawCuts() {
        let prev = {x:0, y:0};
        for (const cut of cutList) {
            const point = parseLine(cut.move);
            drawCut(point, cut.cutLines);
            prev = point;
        }
    }

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

    function drawLine(p1, p2, color) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
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
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
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
