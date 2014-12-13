(function (window, document, dat, Stats) {
  'use strict';

  var options = {
    speed: 3,
    trail: 0.01,
    ammount: 1500,
    collision: true,
    image: 'the-bathers',
    running: true
  };

  var gui = new dat.GUI();
  gui.add(options, 'speed', 1, 10);
  gui.add(options, 'trail', 0.001, 0.5);
  var ammountSelect = gui.add(options, 'ammount', 1, 3000).step(1);
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

  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '0px';

  document.body.appendChild( stats.domElement );

  var Canvas = (function () {
    var canvas = document.querySelector('canvas');
    var context = canvas.getContext('2d');

    var line = (fromX, fromY, toX, toY) => {
      context.beginPath();
      context.moveTo(fromX, fromY);
      context.lineTo(toX, toY);
      context.closePath();
      context.stroke();
    };

    var setColor = (property) => {
      return (r, g, b, a) => {
        context[property] = `rgba(${r}, ${g}, ${b}, ${a})`;
      };
    };

    var fade = () => {
      setColor('fillStyle')(0, 0, 0, options.trail);
      context.fillRect(0, 0, canvas.width, canvas.height);
    };

    var render = (image) => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);

      var range = [0, 0, image.width, image.height];
      var data = context.getImageData(...range).data;
      context.clearRect(...range);
      return data;
    };

    var getWidth = () => {
      return canvas.width;
    };

    var getHeight = () => {
      return canvas.height;
    };

    return {
      line: line,
      setStroke: setColor('strokeStyle'),
      setFill: setColor('fillStyle'),
      fade: fade,
      render: render,
      getWidth: getWidth,
      getHeight: getHeight
    };
  })();

  class Particle {
    constructor() {
      this.lastX = this.x = Math.random() * Canvas.getWidth();
      this.lastY = this.y = Math.random() * Canvas.getHeight();

      this.vx = Math.random() - 0.5;
      this.vy = Math.random() - 0.5;
    }

    move() {
      this.lastX = this.x;
      this.lastY = this.y;

      this.x += this.vx * options.speed;
      this.y += this.vy * options.speed;

      if (this.x > Canvas.getWidth()) {
        this.x = Canvas.getWidth();
        this.vx *= -1;
      } else if (this.x < 0) {
        this.x = 0;
        this.vx *= -1;
      }

      if (this.y > Canvas.getHeight()) {
        this.y = Canvas.getHeight();
        this.vy *= -1;
      } else if (this.y < 0) {
        this.y = 0;
        this.vy *= -1;
      }
    }

    render() {
      Canvas.line(this.lastX, this.lastY, this.x, this.y);
    }

    linearPosition() {
      return this.y * Canvas.getWidth() + this.x;
    }

  }

  class ParticleSystem {
    constructor(count) {
      this.data = [];
      this._set = [];
      this.set = [];
      this.count = count;
      this.preview = document.querySelector('.preview');
      this.loadImage();

      while (count--) {
        this._set.push(new Particle());
      }
    }

    render() {
      if (options.collision) {
        this.checkCollisions();
      }

      var w = Canvas.getWidth();
      for (var i = 0, l = this.set.length; i < l; i++) {
        var p = this.set[i];
        p.move();
        var index = (Math.round(p.y) * 4 * w) + (Math.round(p.x) * 4);
        Canvas.setStroke(this.data[index], this.data[index+1], this.data[index+2], this.data[index+3] / 255);
        p.render();
      }
    }

    checkCollisions() {
      this.set = this.set.sort((pa, pb) => {
        return pa.linearPosition() - pb.linearPosition();
      });

      for (var i = 0, l = this.set.length - 1; i < l; i++) {
        let a = this.set[i];
        let b = this.set[i+1];

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
    }

    loadImage() {
      this.preview.onload = () => {
        this.data = Canvas.render(this.preview);
      };
      this.preview.src = 'images/' + options.image + '.jpg';
    }
  }

  var system = new ParticleSystem(3000);
  var resize = (ammount) => {
    system.set = system._set.slice(0, ammount);
  };

  Canvas.setStroke(37, 165, 48, 1);
  imageSelect.onChange(() => system.loadImage());
  ammountSelect.onChange(resize);
  resize(options.ammount);

  var render = () => {
    if (options.running) {
      stats.begin();

      Canvas.fade();
      system.render();

      stats.end();
    }

    window.requestAnimationFrame(render);
  };

  window.requestAnimationFrame(render);
})(window, document, require('dat-gui'), require('stats-js'));
