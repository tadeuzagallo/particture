(function (window, document) {
  'use strict';

  var options = {
    speed: 3,
    trail: 0.01,
    ammount: 1500,
    collision: true,
    image: 'the-bathers',
    running: true
  };

  var width = 640;
  var height = 400;

  var canvas = document.querySelector('canvas');
  var context = canvas.getContext('2d');

  var preview = document.querySelector('.preview');

  var particles = [];
  var data = [];

  var gui = new dat.GUI(); // jshint ignore: line
  gui.add(options, 'speed', 1, 10);
  gui.add(options, 'trail', 0.001, 0.5);
  var ammountSelect = gui.add(options, 'ammount', 1, 6000).step(1);
  var imageSelect = gui.add(options, 'image', [
    'the-bathers',
    'at-the-moulin-rouge',
    'the-starry-night',
    'senecio',
    'mother-and-child',
    'still-life-with-a-guitar'
  ]);
  gui.add(options, 'collision');
  gui.add(options, 'running');

  var stats = new Stats(); // jshint ignore: line
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '0px';
  document.body.appendChild(stats.domElement);

  function fadeCanvas() {
    context.fillStyle = 'rgba(0,0,0,'+options.trail+')';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  function renderImage(image) {
    width = canvas.width = image.width;
    height = canvas.height = image.height;
    context.drawImage(image, 0, 0);

    var data = context.getImageData(0, 0, image.width, image.height).data;
    context.clearRect(0, 0, image.width, image.height);
    return data;
  }


  function createParticle() {
    var x = Math.random() * width;
    var y = Math.random() * height;

    return {
      lastX: x,
      lastY: y,
      x: x,
      y: y,
      vx: Math.random() - 0.5,
      vy: Math.random() - 0.5
    };
  }

  function moveParticle(p) {
    var lastX = p.x;
    var lastY = p.y;

    var vx = p.vx;
    var vy = p.vy;

    var x = lastX + p.vx * options.speed;
    var y = lastY + p.vy * options.speed;

    if (x > width) {
      x = width;
      vx *= -1;
    } else if (x < 0) {
      x = 0;
      vx *= -1;
    }

    if (y > height) {
      y = height;
      vy *= -1;
    } else if (y < 0) {
      y = 0;
      vy *= -1;
    }

    return {
      lastX: lastX,
      lastY: lastY,
      x: x,
      y: y,
      vx: vx,
      vy: vy
    };
  }

  function linearPosition(p) {
    return p.y * width + p.x;
  }

  var scaleSystem = function (count) {
    var l  = particles.length;

    if (count < l) {
      particles = particles.slice(0, count);
    } else if (count > l) {
      for (var i = l; i < count; i++) {
        particles.push(createParticle());
      }
    }
  };

  function checkCollision (a, b) {
    if (Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1) {
      var tanA = a.vy / a.vx;
      var tanB = b.vy / b.vx;

      var v1 = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
      var v2 = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

      var aangle, bangle;

      if (tanA === 0) {
        aangle = (a.vy > 0 ? 1 : -1) * Math.PI / 2;
      } else {
        aangle = Math.atan(tanA);
      }

      if (tanB === 0) {
        bangle = (b.vy > 0 ? 1 : -1) * Math.PI / 2;
      } else {
        bangle = Math.atan(tanB);
      }

      if (a.vx < 0) {
        aangle += Math.PI;
      }
      if (b.vx < 0) {
        bangle += Math.PI;
      }

      var phi;
      var dx = a.vx - b.vx;
      var dy = a.vy - b.vy;
      if (dx === 0) {
        phi = Math.PI / 2;
      } else {
        phi = Math.atan2(dy, dx);
      }

      var v1xr = v1 * Math.cos(aangle - phi);
      var v1yr = v1 * Math.sin(aangle - phi);
      var v2xr = v2 * Math.cos(bangle - phi);
      var v2yr = v2 * Math.sin(bangle - phi);

      a.vx = v2xr;
      a.vy = v1yr;
      b.vx = v1xr;
      b.vy = v2yr;
    }
  }

  function loadImage() {
    preview.onload = function () {
      data = renderImage(preview);
    };
    preview.src = 'images/' + options.image + '.jpg';
  }

  var resize = function (ammount) {
    scaleSystem(ammount);
  };

  imageSelect.onChange(loadImage);
  ammountSelect.onChange(resize);

  resize(options.ammount);
  loadImage();

  var render = function () {
    if (options.running) {
      stats.begin();

      fadeCanvas();

      if (options.collision) {
        particles = particles.sort(function (pa, pb) {
          return linearPosition(pa) - linearPosition(pb);
        });
      }

      var w = width;
      for (var i = 0, l = particles.length; i < l; i++) {
        var pa = particles[i];
        var pb = particles[i+1];

        if (pb && options.collision) {
          checkCollision(pa, pb);
        }

        var p = moveParticle(pa);
        particles[i] = p;
        var index = (Math.round(p.y) * 4 * w) + (Math.round(p.x) * 4);

        var r = data[index];
        var g = data[index+1];
        var b = data[index+2];

        context.strokeStyle = 'rgb('+r+', '+g+', '+b+')';
        context.beginPath();
        context.moveTo(p.lastX, p.lastY);
        context.lineTo(p.x, p.y);
        context.closePath();
        context.stroke();
      }

      stats.end();
    }

    window.requestAnimationFrame(render);
  };

  window.addEventListener('DOMContentLoaded', function () {
    window.requestAnimationFrame(render);
  }, false);
})(window, document);
