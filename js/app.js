// jshint bitwise: false
// jshint camelcase: false

(function (window, document) {
  'use strict';

  var options = {
    speed: 3,
    trail: 0.013,
    ammount: 3000,
    collision: true,
    image: window.location.hash === '#webcam' ? 'use your webcam' : 'the-bathers',
    running: true,
    zoom: 1,
    resolution: 4,
    isVideo: false
  };

  var maxParticles = 60000;
  var incs = new Uint32Array([1391376, 463792, 198768, 86961, 33936, 13776, 4592, 1968, 861, 336, 112, 48, 21, 7, 3, 1]);
  var buffer = new ArrayBuffer(1<<21);

  var pos = new Uint32Array(maxParticles);
  var lastxArray = new Float64Array(maxParticles);
  var lastyArray = new Float64Array(maxParticles);
  var xArray = new Float64Array(maxParticles);
  var yArray = new Float64Array(maxParticles);
  var vxArray = new Float64Array(maxParticles);
  var vyArray = new Float64Array(maxParticles);
  var colorsArray = new Uint32Array(maxParticles);
  var size = 0;
  var particles = new Uint16Array(maxParticles);

  var width = 533;
  var height = 400;

  var canvas = document.querySelector('canvas');
  var context = canvas.getContext('2d');

  var _canvas = document.createElement('canvas');
  var _context = _canvas.getContext('2d');

  var preview = document.querySelector('.preview');
  var video = document.querySelector('video');
  var webcam = document.querySelector('.webcam');

  var data = [];

  function fadeCanvas() {
    context.fillRect(0, 0, width, height);
  }

  function renderImage(image, preventClear) {
    var res = options.resolution;
    var id;
    var c;
    var ctx;
    var i, j, l, d, w, h;

    if (preventClear) {
      c = _canvas;
      ctx = _context;
    } else {
      c = canvas;
      ctx = context;
    }

    w = c.width = image.width * options.zoom;
    h = c.height = image.height * options.zoom;
    ctx.drawImage(image, 0, 0, w, h);
    id = ctx.getImageData(0, 0, w, h).data;

    l = id.length >> 2;
    d = new Uint16Array(buffer, 0, l);

    for (i = 0, j = 0; i < l; i++, j += 4) {
      d[i] = ((id[j] >> res) << 10) | ((id[j+1] >> res) <<5) | (id[j+2] >> res);
    }

    ctx.clearRect(0, 0, w, h);
    data = d;
    width = w;
    height = h;
  }

  function createParticle() {
    var x = Math.random() * width;
    var y = Math.random() * height;

    lastxArray[size] = x;
    lastyArray[size] = y;
    xArray[size] = x;
    yArray[size] = y;
    vxArray[size] = Math.random() - 0.5;
    vyArray[size] = Math.random() - 0.5;
    particles[size] = size;

    size++;
  }

  function moveParticle(i) {
    var lastX = xArray[i];
    var lastY = yArray[i];

    var vx = vxArray[i];
    var vy = vyArray[i];

    var x = lastX + vx * options.speed;
    var y = lastY + vy * options.speed;

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

    lastxArray[i] = lastX;
    lastyArray[i] = lastY;
    xArray[i] = x;
    yArray[i] = y;
    vxArray[i] = vx;
    vyArray[i] = vy;
    colorsArray[i] = data[(y>>0)*width+(x>>0)];
  }

  var scaleSystem = function (count) {
    size = 0;
    for (var i = 0; i < count; i++) {
      createParticle();
    }
  };

  function findAnAngle(vx, vy) {
    if (vy > 0) {
      return Math.atan2(vy, vx);
    } else if (vx === 0) {
      return (vy > 0 ? Math.PI : -Math.PI) / 2;
    } else if (vy === 0) {
      return Math.PI;
    } else {
      return Math.PI + Math.PI + Math.atan2(vy, vx);
    }
  }

  function checkCollision (a, b) {
    var ax = xArray[a];
    var ay = yArray[a];
    var bx = xArray[b];
    var by = yArray[b];

    var dx = ax - bx;
    var dy = ay - by;
    if (dx * dx + dy * dy <= 1) {
      var phi;
      var avx = vxArray[a];
      var avy = vyArray[a];
      var bvx = vxArray[b];
      var bvy = vyArray[b];

      if (dx === 0) {
        phi = Math.PI / 2;
      } else {
        phi = Math.atan2(dy, dx);
      }

      var aang = findAnAngle(avx, avy);
      var bang = findAnAngle(bvx, bvy);

      var v1 = Math.sqrt(avx * avx + avy * avy);
      var v2 = Math.sqrt(bvx * bvx + bvy * bvy);

      var s_phi = Math.sin(phi);
      var c_phi = Math.cos(phi);
      var s_a_phi = Math.sin(aang-phi);
      var s_b_phi = Math.sin(bang-phi);
      var c_a_phi = Math.cos(aang-phi);
      var c_b_phi = Math.cos(bang-phi);
      var s_phi_pi2 = Math.sin(phi+Math.PI / 2);
      var c_phi_pi2 = Math.cos(phi+Math.PI / 2);

      vxArray[a] = v2 * c_b_phi * c_phi + v1 * s_a_phi * c_phi_pi2;
      vyArray[a] = v2 * c_b_phi * s_phi + v1 * s_a_phi * s_phi_pi2;
      vxArray[b] = v1 * c_a_phi * c_phi + v2 * s_b_phi * c_phi_pi2;
      vyArray[b] = v1 * c_a_phi * s_phi + v2 * s_b_phi * s_phi_pi2;
    }
  }

  function loadImage(image) {
    if (image === 'use your webcam') {
      var _running = options.running;

      options.isVideo = true;
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
          }, /firefox/i.test(navigator.userAgent) ? 1000 : 0);
        };
      }, function(err) { console.error(err); });

      return;
    } else {
      options.isVideo = false;
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

  var imageSelect = (function () {
    var gui = new dat.GUI(); // jshint ignore: line

    gui.add(options, 'speed', 1, 10);

    var listeners = {
      trail: gui.add(options, 'trail', 0.01, 0.5),
      ammount: gui.add(options, 'ammount', 1, maxParticles).step(1),
      image: gui.add(options, 'image', [
        'use your webcam',
        'the-bathers',
        'at-the-moulin-rouge',
        'the-starry-night',
        'senecio',
        'mother-and-child',
        'still-life-with-a-guitar'
      ]),
      zoom: gui.add(options, 'zoom', {
        '25%': 0.25,
        '50%': 0.5,
        '100%': 1,
        '150%': 1.5,
        '200%': 2,
      }),
      resolution: gui.add(options, 'resolution', {
        low: 5,
        medium: 4,
        high: 3
      })
    };

    gui.add(options, 'collision');
    listeners.running = gui.add(options, 'running');

    listeners.trail.onChange(trailChanged);
    listeners.image.onChange(loadImage);
    listeners.ammount.onChange(scaleSystem);
    listeners.zoom.onChange(function (zoom) {
      options.zoom = parseFloat(zoom);
      loadImage(options.image);
    });
    listeners.running.onChange(function (running) {
      if (running) {
        video.play();
      } else {
        video.pause();
      }
    });
    listeners.resolution.onChange(function (res) {
      options.resolution = parseInt(res, 10);
      if (!options.isVideo) {
        renderImage(preview, true);
      }
    });

    return listeners.image;
  })();

  var stats = (function () {
    var stats = new Stats(); // jshint ignore: line
    stats.domElement.style.position = 'fixed';
    stats.domElement.style.right = '0px';
    stats.domElement.style.bottom = '0px';
    document.body.appendChild(stats.domElement);

    return stats;
  })();

  trailChanged(options.trail);
  scaleSystem(options.ammount);
  loadImage(options.image);


  var count = new Uint16Array(1<<16);
  var draws = new Uint16Array(maxParticles);
  function render() {
    var res = options.resolution;
    var ctx = context;
    var i, j, k, l = size;
    var v, p;
    var color, r, g, b;

    if (options.running) {
      stats.begin();

      if (options.isVideo) {
        renderImage(video, true);
        trailChanged(options.trail);
      }

      fadeCanvas();

      if (options.collision) {
        var tmp;
        for (k = 0; k < 16; k++) {
          for (i = incs[k]; i < l; i++) {
            v = pos[particles[i]];
            j = i;

            while (j >= i && pos[particles[j - i]] > v) {
              tmp = particles[j];
              particles[j] = particles[j - 1];
              particles[j - 1] = tmp;
              j -= i;
            }

          tmp = particles[j];
          particles[j] = particles[i];
          particles[i] = tmp;
          }
        }
      }

      for (i = 1; i < 1<<16; i++) {
        count[i] = 0;
      }
      for (i = 0; i < l; i++) {
        p = particles[i];
        if (i+1 < l && options.collision) {
          checkCollision(p, particles[i+1]);
        }

        moveParticle(p);
        color = colorsArray[p];

        count[color]++;
      }

      for (i = 1; i < 1<<16; i++) {
        count[i] += count[i-1];
      }

      for (i = 0; i < l; i++) {
        draws[--count[colorsArray[particles[i]]]] = particles[i];
      }

      var prevColor = -1;
      for (i = 0; i < l; i++) {
        p = draws[i];
        color = colorsArray[p];

        if (color !== prevColor) {
          ctx.stroke();

          r = color >> 10;
          g = (color >> 5) & 31;
          b = color & 31;

          ctx.strokeStyle = 'rgb('+(r << res)+', '+(g << res)+', '+(b << res)+')';
          ctx.beginPath();
          prevColor = color;
        }

        var lastX = lastxArray[p];
        var lastY = lastyArray[p];
        var x = xArray[p];
        var y = yArray[p];

        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
      }

      ctx.stroke();
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
