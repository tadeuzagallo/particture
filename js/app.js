'use strict';

var dat = require('dat-gui');

var options = {
  speed: 3,
  trail: 0.01,
  ammout: 1000,
  collision: true,
  image: 'at-the-moulin-rouge'
};

var gui = new dat.GUI();
gui.add(options, 'speed', 1, 10);
gui.add(options, 'trail', 0.001, 0.5);
gui.add(options, 'ammout', 1, 3000);
var imageSelect = gui.add(options, 'image', [
  'at-the-moulin-rouge',
  'the-starry-night',
  'senecio',
  'mother-and-child',
  'the-bathers',
  'still-life-with-a-guitar'
]);
gui.add(options, 'collision');

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

  return {
    get width() {
      return canvas.width;
    },
    get height() {
      return canvas.height;
    },
    line: line,
    setStroke: setColor('strokeStyle'),
    setFill: setColor('fillStyle'),
    fade: fade,
    render: render
  };
})();

class Particle {
  constructor() {
    this.lastX = this.x = Math.random() * Canvas.width;
    this.lastY = this.y = Math.random() * Canvas.height;

    this.vx = Math.random() - 0.5;
    this.vy = Math.random() - 0.5;
  }

  move() {
    this.lastX = this.x;
    this.lastY = this.y;

    this.x += this.vx * options.speed;
    this.y += this.vy * options.speed;

    if (this.x > Canvas.width) {
      this.x = Canvas.width;
      this.vx *= -1;
    } else if (this.x < 0) {
      this.x = 0;
      this.vx *= -1;
    }

    if (this.y > Canvas.height) {
      this.y = Canvas.height;
      this.vy *= -1;
    } else if (this.y < 0) {
      this.y = 0;
      this.vy *= -1;
    }
  }

  render() {
    Canvas.line(this.lastX, this.lastY, this.x, this.y);
  }

}

class ParticleSystem {
  constructor(count) {
    this.data = [];
    this.set = [];
    this.count = count;
    this.preview = document.querySelector('.preview');
    this.loadImage();

    while (count--) {
      this.set.push(new Particle());
    }
  }

  render() {
    this.each(p => p.move());

    if (options.collision) {
      this.checkCollisions();
    }

    this.each(p => {
      var index = (Math.round(p.y) * 4 * Canvas.width) + (Math.round(p.x) * 4);
      Canvas.setStroke(this.data[index], this.data[index+1], this.data[index+2], this.data[index+3] / 255);
      p.render();
    });
  }

  each(callback) {
    for (var i = 0; i < options.ammout; i++) {
      callback(this.set[i]);
    }
  }

  checkCollisions() {
    for (var i = 0; i < options.ammout - 1; i++) {
      var a = this.set[i];
      for (var j = i + 1; j < options.ammout; j++) {
        var b = this.set[j];
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
  }

  loadImage() {
    this.preview.onload = () => {
      this.data = Canvas.render(this.preview);
    };
    this.preview.src = 'images/' + options.image + '.jpg';
  }
}

var system = new ParticleSystem(3000);
Canvas.setStroke(37, 165, 48, 1);
imageSelect.onChange(() => system.loadImage());

var render = () => {
  Canvas.fade();
  system.render();
  window.requestAnimationFrame(render);
};

window.requestAnimationFrame(render);
