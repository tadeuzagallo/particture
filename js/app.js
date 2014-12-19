// jshint bitwise: false
// jshint camelcase: false

(function (window, document) {
  'use strict';

  var options = {
    speed: 3,
    trail: 0.013,
    ammount: 3000,
    collision: true,
    image: 'the-bathers',
    running: true,
    zoom: 1,
    resolution: 4
  };

  var incs = new Uint32Array([1391376, 463792, 198768, 86961, 33936, 13776, 4592, 1968, 861, 336, 112, 48, 21, 7, 3, 1]);

  if (window.location.hash === '#webcam') {
    options.image = 'use your webcam';
  }

  var buffer = new ArrayBuffer(1<<21);
  var pos = new Uint16Array(15000);

  var width = 533;
  var height = 400;

  var canvas = document.querySelector('canvas');
  var context = canvas.getContext('2d');

  var _canvas = document.createElement('canvas');
  var _context = _canvas.getContext('2d');

  var preview = document.querySelector('.preview');
  var video = document.querySelector('video');
  var webcam = document.querySelector('.webcam');

  var isVideo = false;
  var isFirefox = /firefox/i.test(navigator.userAgent);
  var timeout = isFirefox ? 1000 : 0;

  var particles = [];
  var data = [];

  var gui = new dat.GUI(); // jshint ignore: line
  gui.add(options, 'speed', 1, 10);
  var trailSelect = gui.add(options, 'trail', 0.01, 0.5);
  var ammountSelect = gui.add(options, 'ammount', 1, 15000).step(1);
  var imageSelect = gui.add(options, 'image', [
    'use your webcam',
    'the-bathers',
    'at-the-moulin-rouge',
    'the-starry-night',
    'senecio',
    'mother-and-child',
    'still-life-with-a-guitar'
  ]);
  var zoomSelect = gui.add(options, 'zoom', {
    '25%': 0.25,
    '50%': 0.5,
    '100%': 1,
    '150%': 1.5,
    '200%': 2,
  });
  var resolutionSelect = gui.add(options, 'resolution', {
    low: 5,
    medium: 4,
    high: 3
  });
  gui.add(options, 'collision');
  var runningSelect = gui.add(options, 'running');

  var stats = new Stats(); // jshint ignore: line
  stats.domElement.style.position = 'fixed';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '0px';
  document.body.appendChild(stats.domElement);

  function fadeCanvas() {
    context.fillRect(0, 0, width, height);
  }

  function renderImage(image, preventClear) {
    var res = options.resolution;
    var id;
    var c;
    var ctx;

    if (preventClear) {
      c = _canvas;
      ctx = _context;
    } else {
      c = canvas;
      ctx = context;
    }

    width = c.width = image.width * options.zoom;
    height = c.height = image.height * options.zoom;
    ctx.drawImage(image, 0, 0, width, height);
    id = ctx.getImageData(0, 0, width, height).data;

    var l = id.length >> 2;
    var d = new Uint16Array(buffer, 0, l);

    for (var i = 0, j = 0; i < l; i++, j += 4) {
      d[i] = ((id[j] >> res) << 10) | ((id[j+1] >> res) <<5) | (id[j+2] >> res);
    }

    ctx.clearRect(0, 0, width, height);
    data = d;
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

    if (x >= width) {
      x = width-1;
      vx = -vx;
    } else if (x < 0) {
      x = 0;
      vx = -vx;
    }

    if (y >= height) {
      y = height-1;
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
      while (--l) {
        var j = Math.random() * l >> 0;
        var tmp = particles[l];
        particles[l] = particles[j];
        particles[j] = tmp;
      }
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

  function loadImage(image) {
    if (image === 'use your webcam') {
      var _running = options.running;

      isVideo = true;
      canvas.width = video.width;
      canvas.height = video.height;
      options.running = false;

      preview.style.display = 'none';
      video.style.display = '';

      navigator.getUserMedia = ( navigator.getUserMedia ||
                                navigator.webkitGetUserMedia ||
                                navigator.mozGetUserMedia ||
                                navigator.msGetUserMedia);
      navigator.getUserMedia({ video: true }, function (localMediaStream) {
        var video = document.querySelector('video');
        video.src = window.URL.createObjectURL(localMediaStream);
        video.onloadedmetadata = function () {
          setTimeout(function () {
            options.running = _running;
          }, timeout);
        };
      }, function(err) { console.error(err); });

      return;
    } else {
      isVideo = false;
      preview.style.display = '';
      video.style.display = 'none';
    }

    function onload() {
      renderImage(preview, false);
      trailChanged(options.trail);
    }
    preview.src = 'images/' + image + '.jpg';

    if (preview.complete) {
      onload();
    } else {
      preview.onload = onload;
    }
  }

  function trailChanged(trail) {
    context.fillStyle = 'rgba(0,0,0,'+trail+')';
  }

  trailSelect.onChange(trailChanged);
  imageSelect.onChange(loadImage);
  ammountSelect.onChange(scaleSystem);
  zoomSelect.onChange(function (zoom) {
    options.zoom = parseFloat(zoom);
    loadImage(options.image);
  });
  runningSelect.onChange(function (running) {
    if (running) {
      video.play();
    } else {
      video.pause();
    }
  });
  resolutionSelect.onChange(function (res) {
    options.resolution = parseInt(res, 10);
    if (!isVideo) {
      renderImage(preview, true);
    }
  });

  trailChanged(options.trail);
  scaleSystem(options.ammount);
  loadImage(options.image);

  function render() {
    var i, j, len;

    if (options.running) {
      stats.begin();

      if (isVideo) {
        renderImage(video, true);
        trailChanged(options.trail);
      }

      fadeCanvas();

      var l = options.ammount;

      if (options.collision) {
        for (i = 0; i < l; i++) {
          pos[i] = linearPosition(particles[i]);
        }

        for (var k = 0; k < 16; k++) {
          for (i = incs[k]; i < l; i++) {
            var v = pos[i];
            var v_ = particles[i];
            j = i;

            while (j >= i && pos[j - i] > v) {
              pos[j] = pos[j-i];
              particles[j] = particles[j-i];
              j -= i;
            }

            pos[j] = v;
            particles[j] = v_;
          }
        }
      }

      var draws = {};
      for (i = 0; i < l; i++) {
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

        var res = options.resolution;
        var c = 'rgb('+(r << res)+', '+(g << res)+', '+(b << res)+')';
        context.strokeStyle = c;
        context.beginPath();
        for (j = 0, len = ps.length; j < len; j++) {
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

  webcam.onclick = function (e) {
    e.preventDefault();
    options.image = 'use your webcam';
    loadImage(options.image);
    imageSelect.updateDisplay();
  };

  window.requestAnimationFrame(render);
})(window, document);
