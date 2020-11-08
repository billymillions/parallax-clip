import { intersection } from 'polygon-clipping';

type Point = [number, number];
type Poly = Array<Point>;

const doResize = true;
const padding = .2;
const gutter = .2;
const numTriangles = 3;
const backgroundFill = "#FFCC00";
const foregroundFill = "#CCFF00";
const intersectionFill = "#00CCFF";

function resizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    let minDimension = Math.min(window.innerWidth, window.innerHeight);
    if (!doResize) {
        minDimension = canvas.width;
    }
    canvas.width = minDimension;
    canvas.height = minDimension;
    // i don't know why i chose to do scale this way
    ctx.setTransform(minDimension, 0, 0, minDimension, 0, 0);
}

function genTriangles(translate: Point, numTriangles: number, padding: number, gutter: number): Array<Poly> {
    let drawArea = 1 - 2 * gutter;
    let sideLength = drawArea / (numTriangles * (padding + 1));
    let padded = padding * sideLength;
    let translateScale = 2 * gutter;
    let yLength = sideLength * (3 ** .5) / 2;
    let yGutter = (1 - (yLength + sideLength * padding) * 3) / 2

    let polys = new Array(numTriangles * numTriangles);
    for (let i = 0; i < numTriangles; i++) {
        for (let j = 0; j < numTriangles; j++) {
            let offsetX = gutter + translate[0] * translateScale + i * (padded + sideLength);
            let offsetY = yGutter + translate[1] * translateScale + j * (padded + yLength);
            polys[i*numTriangles + j] = [
                [offsetX, offsetY + yLength],
                [offsetX + sideLength / 2, offsetY],
                [offsetX + sideLength, offsetY + yLength]  
            ];
        }
    }
    return polys;
}

function genIntersections(poly: Poly, polys: Array<Poly>): Array<Poly> {
    return intersection([poly], polys.map(x => [x])).map(x => x[0]);
}


function drawPoly(ctx: CanvasRenderingContext2D, poly: Poly, fill: string) {
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (var p of poly.slice(1)) {
        ctx.lineTo(p[0], p[1]);
    }
    ctx.fillStyle = fill;
    ctx.fill()
    ctx.closePath();
}

function draw (ctx: CanvasRenderingContext2D, translate: Point) {
    let canvas = ctx.canvas;
    let x = translate[0];
    let y = translate[1];

    let background = genTriangles(translate, numTriangles,  padding, gutter)
    let foreground = genTriangles([x / 2, y / 2], numTriangles, padding, gutter);
    // shouldn't i be able to calculate intersect on `background.concat(foreground)` rather than this reduce?
    let intersections = background.map(x => genIntersections(x, foreground)).reduce((p, cur) => p.concat(cur));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let p of background) {
        drawPoly(ctx, p, backgroundFill);
    }
    for (let p of foreground) {
        drawPoly(ctx, p, foregroundFill);
    }
    for (let p of intersections) {
        drawPoly(ctx, p, intersectionFill);
    }
}

function main() {
    let canvas = <HTMLCanvasElement>document.querySelectorAll('canvas')[0];
    let ctx = canvas.getContext('2d');

    resizeCanvas(canvas, ctx);
    draw(ctx, [0,0]);

    let translateX = 0;
    let translateY = 0;

    window.addEventListener('mousemove', function (e) {
        var center = [];

        translateX = -(e.clientX / window.innerWidth - .5);
        translateY = -(e.clientY / window.innerHeight - .5);

        requestAnimationFrame(()=> {
            draw(ctx, [translateX, translateY]);
        })
    }); 

    window.addEventListener('resize', () => {
        resizeCanvas(canvas, ctx);
        requestAnimationFrame(()=> {
            draw(ctx, [translateX, translateY]);
        })
    });
}

main();