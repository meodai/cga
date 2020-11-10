import chroma from 'chroma-js';

console.clear();

const $container = document.querySelector('[data-convas-container]');

const $can = document.createElement('canvas');
const ctx = $can.getContext('2d');

const $interssectionCan = document.createElement('canvas');
const intersectionCtx = $interssectionCan.getContext('2d');

const w = window.innerWidth * .8;
const h = window.innerWidth * .8;

$can.width = w;
$can.height = h;

const colorModes = ['lab', 'hsl', 'hsv', 'hsi', 'lch', 'rgb', 'lrgb'];
let currentColorMode = colorModes[0];

if (window.devicePixelRatio > 1) {
  const canWidth = $can.width;
  const canHeight = $can.height;

  $can.width = canWidth * window.devicePixelRatio;
  $can.height = canHeight * window.devicePixelRatio;
  $can.style.width = canWidth;
  $can.style.height = canHeight;

  $interssectionCan.width = canWidth * window.devicePixelRatio;
  $interssectionCan.height = canHeight * window.devicePixelRatio;
  $interssectionCan.style.width = canWidth;
  $interssectionCan.style.height = canHeight;

  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  intersectionCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

$container.appendChild($can);
$container.appendChild($interssectionCan);

const pixelsX = 10;
const pixelsY = 10;

const pixelsize = w / pixelsX;

// create an array of array for each x and y coordinate
// a matrix!
const pixelMatrix = new Array(pixelsY).fill('').map(y => new Array(pixelsX).fill(false));

const pixelList = (new Array(pixelsX * pixelsY)).fill('').map((d, i) => {
  const y = Math.floor(i / pixelsY)
  const x = i % pixelsX;
  const pixelObj = false;

  pixelMatrix[x][y] = pixelObj;

  return null;
});

class Pixel {
  constructor (color, x, y) {
    this.x = x;
    this.y = y;
    this.color = color;
  }

  get collidingPixels () {
    const y = this.y;
    const x = this.x;

    const pixelUp = !!y && pixelMatrix[y - 1][x];
    const pixelRight = pixelsX - 1 !== x && pixelMatrix[y][x + 1];
    const pixelDown = pixelsY - 1 !== y && pixelMatrix[y + 1][x];
    const pixelLeft = !!x && pixelMatrix[y][x - 1];

    return [pixelUp, pixelRight, pixelDown, pixelLeft]
  }

  get isColliding () {
    return this.collidingPixels.reduce((isColliding, collision) => (rem && !!collision), false);
  }
};



const connectionList = (new Array((pixelsX - 1) * (pixelsY - 1)))
.fill('').map((d, i) => {
  return {
    x: i % (pixelsX - 1),
    y: Math.floor(i / (pixelsY - 1)),
    color: null,
  }
});

function drawGrid (lineSize = 2, color = '#212121') {
  ctx.lineWidth = lineSize;
  ctx.strokeStyle = color;

  for (let x = 0; x < pixelsX + 1; x++) {
    ctx.beginPath();
    ctx.moveTo(x * pixelsize, 0);
    ctx.lineTo(x * pixelsize, h);
    ctx.closePath();
    ctx.stroke();
  }
  for (let y = 0; y < pixelsY + 1; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * pixelsize);
    ctx.lineTo(w, y * pixelsize);
    ctx.closePath();
    ctx.stroke();
  }
}

drawGrid();

let currentColor = chroma.random();

function drawPixel(x, y) {
  ctx.fillStyle = currentColor.hex();
  ctx.fillRect(x, y, pixelsize, pixelsize);
}

function drawIntersection(pixel1, pixel2, pixelSize) {
  const intersectionColor = chroma.mix(pixel1.color, pixel2.color, 0.5, currentColorMode);
  intersectionCtx.save();

  intersectionCtx.fillStyle = intersectionColor.hex();

  intersectionCtx.translate(
    (pixel1.x + pixel2.x) * pixelSize / 2 + (pixelSize / 2),
    (pixel1.y + pixel2.y) * pixelSize / 2
  );

  intersectionCtx.rotate(45 * Math.PI / 180);

  let scale = pixelsize / Math.sqrt(Math.pow(pixelsize, 2) * 2) ;

  intersectionCtx.fillRect(
    0,
    0,
    pixelsize * scale,
    pixelsize * scale
  )

  intersectionCtx.restore();
}

let pointerdown = false;

const $doc = document.querySelector('html');

let canRect = $can.getBoundingClientRect();
let scale = canRect.width / w;

window.addEventListener('resize', () => {
  canRect = $can.getBoundingClientRect();
  scale = canRect.width / w;
});

function addPixelList(x, y, color) {
  const pixel = new Pixel(color, x, y);
  pixelMatrix[y][x] = pixel;
  return pixel;
}

function translateFromMatrixToPixels (x, y) {
  return [
    Math.floor((x / canRect.width) * pixelsX),
    Math.floor((y / canRect.width) * pixelsY),
  ];
}

function draw (mouseEvent) {
  const [x, y] = translateFromMatrixToPixels(mouseEvent.offsetX, mouseEvent.offsetY);

  const pixel = addPixelList(x, y, currentColor);
  //updateCollisions(x, y);
  pixel.collidingPixels.forEach((intersectinPixel) => {
    if (intersectinPixel) {
      drawIntersection(pixel, intersectinPixel, pixelsize);
    };
  })

  drawPixel(
    x * pixelsize, y * pixelsize
  );
};

$can.addEventListener('pointerdown', (e) => {
  pointerdown = true;
  currentColor = chroma.random();
  draw(e);
});

$doc.addEventListener('pointerup', (e) => {
  pointerdown = false;
});

$can.addEventListener('pointermove', e => {
  if (!pointerdown) return;
  draw(e);
});
