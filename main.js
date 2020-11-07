import chroma from 'chroma-js';

const $favicon = document.querySelector('[rel="icon"]');
let cubes = Array.from(document.querySelectorAll('.cube'));
let $doc = document.querySelector('body');
let gridSize = 8;
let currentColor = `hsl(${Math.random() * 360},${Math.random() * 100}%,${Math.random() * 100}%)`;
let currentMode = 'edit';
$doc.classList.add('mode--' + currentMode);
$doc.classList.add('view--cubes');
let colorMode = 'lab';


const $canvas = document.createElement('canvas');
const ctx = $canvas.getContext('2d');
const pixelSize = 16;
$canvas.width = pixelSize * gridSize * 2;
$canvas.height = pixelSize * gridSize * 2;
//$doc.appendChild($canvas);
//$canvas.toDataURL();

const $saveBtn = document.querySelector('.js-save');

function setMode (mode) {
  currentMode = mode;
  $doc.classList.remove('mode--erase', 'mode--draw', 'mode--edit');
  $doc.classList.add('mode--' + mode);
}

document.querySelector('.js-erase').addEventListener('click', () => {
  setMode('erase');
}, true);

document.querySelector('.js-edit').addEventListener('click', () => {
  setMode('edit');
}, true);

/*document.querySelector('.js-draw').addEventListener('click', () => {
  setMode('draw');
}, true);
*/

document.querySelector('.js-mix-mode').addEventListener('change', (e) => {
  colorMode = e.target.value;
  Array.from($doc.querySelectorAll('.filled')).forEach($el => {
    currentColor = $el.style.getPropertyValue('--bg');
    filledNbr(parseInt($el.getAttribute('data-i')), $el);
  })
})

const $modesTrigger = document.querySelector('.js-view-modes--trigger');

document.addEventListener('click', (e) => {
  const $target = e.target;
  if ($target.matches('.js-view-mode')) {
    const mode = $target.getAttribute('data-mode');
    if( $doc.classList.contains('view--' + mode) ) {
      $modesTrigger.toggleAttribute('aria-expanded');
    }
    const classNames = [];
    Array.from(document.querySelectorAll('.js-view-mode')).forEach($e => {
      classNames.push('view--' + $e.getAttribute('data-mode'));
    });
    classNames.forEach((cls) => {
      $doc.classList.remove(cls);
    });
    $doc.classList.add( 'view--' + mode )
  } else if ($target.matches('.js-view-modes--trigger')) {
    $target.toggleAttribute('aria-expanded');
  } else if ($target.matches('.js-outlined')) {
    $doc.classList.toggle('outlined');
  }

  if ( $modesTrigger.hasAttribute('aria-expanded') ) {
      $doc.classList.add('subnav-visible');
  } else {
      $doc.classList.remove('subnav-visible');
  }
}, true);

document.addEventListener('input', (e) => {
  const $target = e.target;
  if ($target.matches('.js-color')) {
    const $parent = $target.parentElement;
    currentColor = $target.value;
    filledNbr(parseInt($parent.getAttribute('data-i')), $parent);
  }
});

const coords = cubes.map(($cube, i) => {
  return {
    $el: $cube,
    x: i % gridSize,
    y: Math.floor(i / gridSize),
    color: null,
  }
});


function updatePNG () {
  $saveBtn.src = $canvas.toDataURL();
  $favicon.href = $canvas.toDataURL();
}

let timer;

function filledNbr (i, $el, eraseMode) {
  clearTimeout(timer);
  timer = setTimeout(updatePNG, 500);
  if (!$el.matches('.cube')) return;

  let color = currentColor;
  let colors = {};

  if (eraseMode) {
    color = null;
    $el.classList.remove('filled')
  } else {
    $el.classList.add('filled')
  }

  $el.style.setProperty('--bg', color || 'transparent');
  coords[i].color = color;

  if (i > 0) { // left
    if ( coords[i-1].color ) {
      if (color) {
        let col = chroma.mix(color, coords[i-1].color, 0.5, colorMode);
        coords[i-1].$el.style.setProperty('--mix-right', col);
        $el.style.setProperty('--mix-left', col);
        colors.left = col;
      } else {
        coords[i-1].$el.style.removeProperty('--mix-right');
        $el.style.removeProperty('--mix-left');
        colors.left = null;
      }
    }
  }

  if (i < coords.length - 2 && ((i+1)%gridSize)) { //right
    if ( coords[i+1].color ) {
      if(color) {
        let col = chroma.mix(color, coords[i+1].color, 0.5, colorMode);
        coords[i+1].$el.style.setProperty('--mix-left', col);
        $el.style.setProperty('--mix-right', col);
        colors.right = col;
      } else {
        coords[i+1].$el.style.removeProperty('--mix-left');
        $el.style.removeProperty('--mix-right');
        colors.right = null;
      }
    }
  }

  if (Math.floor(i/gridSize)) { //top
    if ( coords[i-gridSize].color ) {
      if(color) {
        let col = chroma.mix(color, coords[i-gridSize].color, 0.5, colorMode);
        coords[i-gridSize].$el.style.setProperty('--mix-bottom', col);
        $el.style.setProperty('--mix-top', col);
        colors.top = col;
      } else {
        coords[i-gridSize].$el.style.removeProperty('--mix-bottom');
        $el.style.removeProperty('--mix-top');
        colors.top = null;
      }
    }
  }

  if (i + 1 < coords.length - gridSize) { //bottom
    if ( coords[i+gridSize].color ) {
      if(color) {
        let col = chroma.mix(color, coords[i+gridSize].color, 0.5, 'lab');
        coords[i+gridSize].$el.style.setProperty('--mix-top', col);
        $el.style.setProperty('--mix-bottom', col);
        colors.bottom = col;
      } else {
        coords[i+gridSize].$el.style.removeProperty('--mix-top');
        $el.style.removeProperty('--mix-bottom');
        colors.bottom = null;
      }
    }
  }

  coords.forEach(el => {
    if(el.color != color) return;

    let paintMethod = 'clearRect';

    if (el.color) {
      ctx.fillStyle = el.color;
      paintMethod = 'fillRect';
    }

    ctx[paintMethod](el.x/gridSize * pixelSize * gridSize * 2, el.y/gridSize * pixelSize * gridSize * 2, pixelSize, pixelSize);

    Object.keys(colors).forEach(key => {
      if ( key === 'top') {
        ctx.fillStyle = colors[key];
        ctx[paintMethod](el.x/gridSize * pixelSize * gridSize * 2, el.y/gridSize * pixelSize * gridSize * 2 - pixelSize, pixelSize, pixelSize);

      } else if ( key === 'bottom') {
        ctx.fillStyle = colors[key];
        ctx[paintMethod](el.x/gridSize * pixelSize * gridSize * 2, el.y/gridSize * pixelSize * gridSize * 2 + pixelSize, pixelSize, pixelSize);
      } else if ( key === 'left') {
        ctx.fillStyle = colors[key];
        ctx[paintMethod](el.x/gridSize * pixelSize * gridSize * 2 - pixelSize, el.y/gridSize * pixelSize * gridSize * 2, pixelSize, pixelSize);
      } else {
        ctx.fillStyle = colors[key];
        ctx[paintMethod](el.x/gridSize * pixelSize * gridSize * 2 + pixelSize, el.y/gridSize * pixelSize * gridSize * 2, pixelSize, pixelSize);

      }
    })
  })
}

document.querySelector('.cubes').addEventListener('click', (e) => {
  const $el = e.target;
  currentColor = `hsl(${Math.random() * 360},${Math.random() * 100}%,${Math.random() * 100}%)`
  if (currentMode === 'draw' || currentMode === 'edit') {
    filledNbr(parseInt($el.getAttribute('data-i')), $el);
  } else if ( currentMode === 'erase') {
    filledNbr(parseInt($el.getAttribute('data-i')), $el, true);
  }
}, true);



filledNbr(27, coords[27].$el);
setTimeout(() => {
  currentColor = `hsl(${Math.random() * 360},${Math.random() * 100}%,${Math.random() * 100}%)`;
  filledNbr(35, coords[35].$el);
},500);
setTimeout(() => {
  currentColor = `hsl(${Math.random() * 360},${Math.random() * 100}%,${Math.random() * 100}%)`;
  filledNbr(36, coords[36].$el);
},1000);
setTimeout(() => {
  currentColor = `hsl(${Math.random() * 360},${Math.random() * 100}%,${Math.random() * 100}%)`;
  filledNbr(28, coords[28].$el);
},1500);
