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
  var trailSelect = gui.add(options, 'trail', 0.001, 0.5);
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
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  function renderImage(image) {
    width = canvas.width = image.width;
    height = canvas.height = image.height;
    context.drawImage(image, 0, 0);

    var data = context.getImageData(0, 0, image.width, image.height).data;
    var l = data.length >> 2;
    var d = new Uint16Array(l);
    for (var i = 0, j = 0; i < l; i++, j += 4) {
      d[i] = ((data[j] >> 3) << 10) | ((data[j+1] >> 3) <<5) | (data[j+2] >> 3);
    }
    context.clearRect(0, 0, image.width, image.height);
    return d;
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
      vx = -vx;
    } else if (x < 0) {
      x = 0;
      vx = -vx;
    }

    if (y > height) {
      y = height;
      vy = -vy;
    } else if (y < 0) {
      y = 0;
      vy = -vy;
    }

    return {
      lastX: lastX,
      lastY: lastY,
      x: x,
      y: y,
      vx: vx,
      vy: vy,
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

  function findAnAngle(vx, vy) {
    if (vy > 0) {
      return Math.atan2(vy, vx);
    } else {
      return Math.PI + Math.PI + Math.atan2(vy, vx);
    }
  }

  function checkCollision (a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    if (dx * dx + dy * dy <= 1) {
      var phi;

      if (dx === 0) {
        phi = Math.PI / 2;
      } else {
        phi = Math.atan2(dy, dx);
      }

      var aang = findAnAngle(a.vx, a.vy);
      var bang = findAnAngle(b.vx, b.vy);

      var v1 = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
      var v2 = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

      var s_phi = Math.sin(phi);
      var c_phi = Math.cos(phi);
      var s_a_phi = Math.sin(aang-phi);
      var s_b_phi = Math.sin(bang-phi);
      var c_a_phi = Math.cos(aang-phi);
      var c_b_phi = Math.cos(bang-phi);
      var s_phi_pi2 = Math.sin(phi+Math.PI / 2);
      var c_phi_pi2 = Math.cos(phi+Math.PI / 2);

      a.vx = v2 * c_b_phi * c_phi + v1 * s_a_phi * c_phi_pi2;
      a.vy = v2 * c_b_phi * s_phi + v1 * s_a_phi * s_phi_pi2;
      b.vx = v1 * c_a_phi * c_phi + v2 * s_b_phi * c_phi_pi2;
      b.vy = v1 * c_a_phi * s_phi + v2 * s_b_phi * s_phi_pi2;
    }
  }

  function loadImage() {
    preview.onload = function () {
      data = renderImage(preview);
      trailChanged(options.trail);
    };
    preview.src = 'images/' + options.image + '.jpg';
  }

  function resize(ammount) {
    scaleSystem(ammount);
  }

  function trailChanged(trail) {
    context.fillStyle = 'rgba(0,0,0,'+trail+')';
  }

  trailSelect.onChange(trailChanged);
  imageSelect.onChange(loadImage);
  ammountSelect.onChange(resize);

  trailChanged(options.trail);
  resize(options.ammount);
  loadImage();

  function render() {
    if (options.running) {
      stats.begin();

      fadeCanvas();

      if (options.collision) {
        particles = particles.sort(function (pa, pb) {
          return linearPosition(pa) - linearPosition(pb);
        });
      }

      var draws = {};
      for (var i = 0, l = particles.length; i < l; i++) {
        var pa = particles[i];
        var pb = particles[i+1];

        if (pb && options.collision) {
          checkCollision(pa, pb);
        }

        var p = moveParticle(pa);
        particles[i] = p;

        var index = ((p.y>>0)*width)+(p.x>>0);

        var x = data[index];
        if ('undefined' === typeof draws[x]) {
          draws[x] = [];
        }
        draws[x].push(p);
      }

      var colors = Object.keys(draws);
      for (var y = 0, ll = colors.length; y < ll; y++) {
        var color = colors[y];
        var ps = draws[color];

        var r = color >> 10;
        var g = (color >> 5) & 31;
        var b = color & 31;

        var c = 'rgb('+r * 8+', '+g * 8+', '+b*8+')';
        context.strokeStyle = c;
        context.beginPath();
        for (var j = 0, len = ps.length; j < len; j++) {
          var particle = ps[j];
          context.moveTo(particle.lastX, particle.lastY);
          context.lineTo(particle.x, particle.y);
        }
        context.stroke();
      }

      stats.end();
    }

    window.requestAnimationFrame(render);
  }

  window.addEventListener('DOMContentLoaded', function () {
    window.requestAnimationFrame(render);
  }, false);
})(window, document);
