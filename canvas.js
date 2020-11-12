import chroma from 'chroma-js';
import anime from 'animejs/lib/anime.es.js';

console.clear();

// app & canvas setup
//-------------------------------

const w = window.innerWidth * .8;
const h = window.innerWidth * .8;

const pixelsX = 9;
const pixelsY = 9;

const pixelsize = w / pixelsX;
const $container = document.querySelector('[data-convas-container]');

const $can = document.createElement('canvas');
const ctx = $can.getContext('2d');

const $interssectionCan = document.createElement('canvas');
const intersectionCtx = $interssectionCan.getContext('2d');

$can.width = w;
$can.height = h;


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


// draws grid line background
function drawGrid (lineSize = 1, color = 'rgba(0,0,0,.07)') {
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



// global edit mode draw
//-------------------------------
let editModes = ['draw', 'drawHueShift', 'eraze'];
let editMode = 'draw';

document.querySelector('body').addEventListener('pointerdown', (e) => {
  if (e.target.matches('[data-mode]')) {
    editMode = e.target.dataset.mode;
  }
});

// global color mixin mode
const colorModes = ['lab', 'hsl', 'hsv', 'hsi', 'lch', 'rgb', 'lrgb'];
let currentColorMode = colorModes[0];

// pixel grid
// create an array of array for each x and y coordinate
// a matrix!
const pixelMatrix = new Array(pixelsY).fill('').map(y => new Array(pixelsX).fill(false));

// pixel class
class Pixel {
  constructor (color, x, y, isDry = false) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.isPaintDry = isDry;
  }

  get collidingPixels () {
    const y = this.y;
    const x = this.x;

    const pixelUp = !!y && pixelMatrix[y - 1][x];
    const pixelRight = pixelsX - 1 !== x && pixelMatrix[y][x + 1];
    const pixelDown = pixelsY - 1 !== y && pixelMatrix[y + 1][x];
    const pixelLeft = !!x && pixelMatrix[y][x - 1];

    let colliding = [pixelUp, pixelRight, pixelDown, pixelLeft];

    colliding = colliding.map(collidingPixel => (
      collidingPixel.isPaintDry ? collidingPixel : false
    ));

    return colliding;
  }

  get isColliding () {
    return this.collidingPixels.reduce((isColliding, collision) => (rem && !!collision), false);
  }

  dryPaint () {
    this.isPaintDry = true;
  }

  eraze (size = pixelsize) {
    ctx.clearRect(this.x * size, this.y * size, size, size);
  }

  draw (size = pixelsize, opacity = 1) {
    ctx.fillStyle = this.color.alpha(opacity).hex();
    ctx.fillRect(this.x * size, this.y * size, size, size);
  }

  drawIntersections () {
    this.collidingPixels.forEach(intersectinPixel => {
      if (intersectinPixel) {
          this._drawIntersection(
            intersectinPixel
          );
        }
    });
  }
  _drawIntersection (
    otherPixel,
    size = pixelsize,
    opacity = 1,
    colormode = currentColorMode
  ) {
    const intersectionColor = chroma.mix(this.color, otherPixel.color, opacity * .5, colormode);

    intersectionCtx.fillStyle = intersectionColor.hex();
    intersectionCtx.save();
    intersectionStyles[interesectionStlye](this, otherPixel, size, 1);
    intersectionCtx.restore();
  }

  destroy () {

  }
};

let currentColor = chroma(
  `hsl(${Math.round(Math.random() * 360)},${Math.round(Math.random() * 100)}%,${Math.round(Math.random() * 100)}%)`
);

const intersectionStyles = {
  'rhombus': (pixel1, pixel2, pixelSize, scaleFactor) => {
    intersectionCtx.translate(
      (pixel1.x + pixel2.x) * pixelSize / 2 + (pixelSize / 2),
      (pixel1.y + pixel2.y) * pixelSize / 2
    );

    intersectionCtx.rotate(45 * Math.PI / 180);

    const scale = pixelsize / Math.sqrt(Math.pow(pixelsize, 2) * 2) ;

    intersectionCtx.scale(scale, scale);

    intersectionCtx.scale(scaleFactor, scaleFactor);

    intersectionCtx.translate(
      pixelSize - scaleFactor * pixelSize,
      pixelSize - scaleFactor * pixelSize
    );

    intersectionCtx.fillRect(
      0,
      0,
      pixelsize,
      pixelsize
    )
  },
  'circle': (pixel1, pixel2, pixelSize) => {},
  'pixel': (pixel1, pixel2, pixelSize) => {},
  'emboss': (pixel1, pixel2, pixelSize) => {},
};
let interesectionStlye = Object.keys(intersectionStyles)[0];

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

function translateFromPXtoMatrix (x, y) {
  return [
    Math.floor((x / canRect.width) * pixelsX),
    Math.floor((y / canRect.width) * pixelsY),
  ];
}


let prevX = null, prevY = null;
let wasLastPixelAnOtherColor = false;
let lastColor = false;

function draw (mouseEvent) {
  const [x, y] = translateFromPXtoMatrix(mouseEvent.offsetX, mouseEvent.offsetY);

  if (prevX !== x || prevY !== y) {
    prevX = x;
    prevY = y;

    //currentColor = chroma(currentColor).set('hsl.h', '+20');
  } else {
    return; // dont do anything if you did not move
  }

  let replacePixel = false;

  let pixel;

  wasLastPixelAnOtherColor = false;

  if (pixelMatrix[y][x]) {
    replacePixel = true;
    pixel = pixelMatrix[y][x];
    pixel.isPaintDry = true;
    lastColor = pixel.color;
    wasLastPixelAnOtherColor = pixel.color.hex() !== currentColor.hex();

    pixel.color = currentColor;
  } else {
    pixel = addPixelList(x, y, currentColor);
  }


  //updateCollisions(x, y);



  const animation = []
  pixel.drawIntersections();

  let transform = {
    opacity: 0,
  };

  animation.push(
    anime({
      targets: transform,
      scale: 1,
      opacity: 1,
      duration: 300,
      autoplay: false,
      easing: 'linear',
      update: function () {
        if (replacePixel) {
          pixel.eraze();
        }
        pixel.draw(pixelsize, transform.opacity);
      }
    })
  );

  animation.forEach(anim => anim.play());
};

$can.addEventListener('pointerdown', (e) => {
  pointerdown = true;
  currentColor = chroma.random();
  draw(e);
});

function dryAllThePixels (gradientTo = false) {
  let inc = 1;
  return pixelMatrix.forEach(
      (y, i) => (
        y.forEach((x, j) => {
          if (x && gradientTo && !x.isPaintDry) {
            x.color = chroma.mix(x.color, gradientTo, inc -= .1, currentColorMode);
            console.log(x.color.hex())
            x.draw();
          }
          x && x.dryPaint()
        }
      )
    )
  );
};

function createPixelGradient () {

}

$doc.addEventListener('pointerup', (e) => {
  pointerdown = false;
  prevX = null;
  prevY = null;


  dryAllThePixels(wasLastPixelAnOtherColor && lastColor);

});

$can.addEventListener('pointermove', e => {
  if (!pointerdown) return;
  draw(e);
});
