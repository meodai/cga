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

const pixelsX = 6;
const pixelsY = 6;

const pixelsize = w / pixelsX;

const pixelList = (new Array(pixelsX * pixelsY)).fill('').map((d, i) => {
  return {
    x: i % pixelsX,
    y: Math.floor(i / pixelsY),
    color: null,
  }
});

const connectionList = (new Array((pixelsX - 1) * (pixelsY - 1)))
.fill('').map((d, i) => {
  return {
    x: i % (pixelsX - 1),
    y: Math.floor(i / (pixelsY - 1)),
    color: null,
  }
});

function doesCollide (x1, y1, x2, y2) {
  const touchesX = (x1 - 1 === x2 || x1 + 1 === x2) && y1 === y2;
  const touchesY = (y1 - 1 === y2 || y1 + 1 === y2) && x1 === x2;

  return touchesX || touchesY;
}

console.log(connectionList)

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

console.log(canRect.width)

$can.addEventListener('pointerdown', (e) => {

  pointerdown = true;
  currentColor = chroma.random();

  const x = Math.floor((e.offsetX / canRect.width) * pixelsX) * pixelsize;
  const y = Math.floor((e.offsetY / canRect.height) * pixelsY) * pixelsize;

  drawPixel(
    x,
    y
    );
  });

  $doc.addEventListener('pointerup', (e) => {
    pointerdown = false;
  });

  $can.addEventListener('pointermove', e => {
    if (!pointerdown) return;

    const x = Math.floor((e.offsetX / canRect.width) * pixelsX) * pixelsize;
    const y = Math.floor((e.offsetY / canRect.height) * pixelsY) * pixelsize;

    drawPixel(
      x,
      y
      );
    });
