import chroma from 'chroma-js';

console.clear();

const $prevCan = document.querySelector('canvas');

if ($prevCan) {
  $prevCan.parentElement().removeChild($prevCan);
}

const $can = document.createElement('canvas');
const ctx = $can.getContext('2d');

const w = window.innerWidth * .8;
const h = window.innerWidth * .8;

$can.width = w;
$can.height = h;

if (window.devicePixelRatio > 1) {
  const canWidth = $can.width;
  const canHeight = $can.height;

  $can.width = canWidth * window.devicePixelRatio;
  $can.height = canHeight * window.devicePixelRatio;
  $can.style.width = canWidth;
  $can.style.height = canHeight;

  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

document.querySelector('body').appendChild($can);

const pixelsX = 30;
const pixelsY = 30;

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

    this.hasCollision = false;
    this.collisions = [];
  }

  getCollisions () {

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

function doesPixelCollide (x1, y1, x2, y2) {
  const touchesTop = y1 - 1 === y2 && x1 === x2;
  const touchesLeft = x1 - 1 === x2 && y1 === y2;
  const touchesRight = x1 + 1 === x2 && y1 === y2;
  const touchesBottom = y1 + 1 === y2 && x1 === x2;

  return [touchesTop, touchesRight, touchesBottom, touchesLeft];
};

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
  ctx.fillRect(x, y, pixelsize, pixelsize)
}

let pointerdown = false;

const $doc = document.querySelector('html');

let canRect = $can.getBoundingClientRect();
let scale = canRect.width / w;

window.addEventListener('resize', () => {
  canRect = $can.getBoundingClientRect();
  scale = canRect.width / w;
});

function updateCollisions (x, y) {
  const pixelUp = !!y && pixelMatrix[y - 1][x];
  const pixelRight = pixelsX - 1 !== x && pixelMatrix[y][x + 1];
  const pixelDown = pixelsY - 1 !== y && pixelMatrix[y + 1][x];
  const pixelLeft = !!x && pixelMatrix[y][x - 1];

  console.log(pixelUp, pixelRight, pixelDown, pixelLeft);

  /*
  pixelList.forEach(pixel => {
    if ( pixel.color ) { // pixel has an actual color
      // current collisions

      const collisionsArray = doesPixelCollide(x, y, pixel.x, pixel.y);

      // has any collisions
      if ( collisionsArray.filter(collide => collide).lenght ) {
        pixel.hasCollisions = true;
        pixel.collisions = collisionsArray;
      }
    };
  });*/
}

function addPixelList(x, y, color) {
  const pixel = new Pixel(color, x, y);
  pixelMatrix[y][x] = pixel;
}

function draw (mouseEvent) {
  const x = Math.floor((mouseEvent.offsetX / canRect.width) * pixelsX);
  const y = Math.floor((mouseEvent.offsetY / canRect.height) * pixelsY);

  addPixelList(x,y, currentColor);
  updateCollisions(x, y);

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
