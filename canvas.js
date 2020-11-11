import chroma from 'chroma-js';
import anime from 'animejs/lib/anime.es.js';

console.clear();

let editMode = 'draw';

document.querySelector('body').addEventListener('pointerdown', (e) => {
  if (e.target.matches('[data-mode]')) {
    editMode = e.target.dataset.mode;
  }
})

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

const pixelsX = 9;
const pixelsY = 9;

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

    return [pixelUp, pixelRight, pixelDown, pixelLeft];
  }

  get isColliding () {
    return this.collidingPixels.reduce((isColliding, collision) => (rem && !!collision), false);
  }

  destroy () {
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
    intersectionCtx.translate(pixelSize - scaleFactor * pixelSize, pixelSize - scaleFactor * pixelSize)


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

function drawPixel (pixel, size = pixelsize, opacity = 1, clearRect = true) {
  if ( clearRect || editMode !== 'eraze' ) {
    ctx.clearRect(pixel.x * size, pixel.y * size, size, size);
  }
  if ( editMode !== 'eraze' ) {
    ctx.fillStyle = currentColor.alpha(opacity).hex();
    ctx.fillRect(pixel.x * size, pixel.y * size, size, size);
  }
}

function drawIntersection(pixel1, pixel2, size = pixelsize, opacity = 1) {
  const intersectionColor = chroma.mix(pixel1.color, pixel2.color, opacity * .5, currentColorMode);
  //intersectionColor.alpha(opacity);

  intersectionCtx.fillStyle = intersectionColor.hex();
  intersectionCtx.save();
  intersectionStyles[interesectionStlye](pixel1, pixel2, size, 1);
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

function translateFromPXtoMatrix (x, y) {
  return [
    Math.floor((x / canRect.width) * pixelsX),
    Math.floor((y / canRect.width) * pixelsY),
  ];
}

let prevX = null, prevY = null;

function draw (mouseEvent) {
  const [x, y] = translateFromPXtoMatrix(mouseEvent.offsetX, mouseEvent.offsetY);

  let replacePixel = false;

  if (pixelMatrix[y][x]) {
    replacePixel = true;
  }

  if (prevX !== x || prevY !== y) {
    prevX = x;
    prevY = y;
    //currentColor = chroma(currentColor).set('hsl.h', '+20');
  }


  const pixel = addPixelList(x, y, currentColor);
  //updateCollisions(x, y);



  const animation = []
  pixel.collidingPixels.forEach((intersectinPixel) => {
    if (intersectinPixel) {
      //drawIntersection(pixel, intersectinPixel, pixelsize);

      let intersectTransform = {
        scale: 1,
        opacity: 0,
      };

      animation.push(anime({
        targets: intersectTransform,
        scale: 1,
        delay: 300,
        opacity: 1,
        autoplay: false,
        duration: 300,
        easing: 'linear',
        update: function () {
          drawIntersection(
            pixel,
            intersectinPixel,
            pixelsize,
            intersectTransform.opacity
          );
        }
      }));

    };
  })

  let transform = {
    scale: 1,
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
        drawPixel(
          pixel,
          pixelsize,
          transform.opacity,
          !replacePixel
        )
        /* // animate with scale
        drawPixel(
          ((pixelsize * .5) - (pixelsize * 0.5 * transform.scale)) + x * pixelsize + transform.scale,
          ((pixelsize * .5) - (pixelsize * 0.5 * transform.scale)) + y * pixelsize + transform.scale,
          transform.scale * pixelsize,
          transform.opacity
        )
        */
      }
    })
  );

  /*drawPixel(
    x * pixelsize, y * pixelsize
  );*/

  animation.forEach(anim => anim.play());
};

$can.addEventListener('pointerdown', (e) => {
  pointerdown = true;
  currentColor = chroma.random();
  draw(e);
});


$doc.addEventListener('pointerup', (e) => {
  pointerdown = false;
  procesLine();
});

$can.addEventListener('pointermove', e => {
  if (!pointerdown) return;
  draw(e);
});
