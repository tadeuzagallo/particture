'use strict';

var Canvas = (() => {
  var canvas = document.querySelector('canvas');
  var context = canvas.getContext('2d');

  var width = canvas.width;
  var height = canvas.height;
  var opacity = 0.2;

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
    setColor('fillStyle')(0, 0, 0, opacity);
    context.fillRect(0, 0, width, height);
  };

  return {
    width: width,
    height: height,
    line: line,
    setStroke: setColor('strokeStyle'),
    setFill: setColor('fillStyle'),
    fade: fade
  };
})();

class Particle {
  constructor() {
    this.velocity = 10;

    this.lastX = this.x = Math.random() * Canvas.width;
    this.lastY = this.y = Math.random() * Canvas.height;

    this.vx = Math.random() - 0.5;
    this.vy = Math.random() - 0.5;
  }

  move() {
    this.lastX = this.x;
    this.lastY = this.y;

    this.x += this.vx * this.velocity;
    this.y += this.vy * this.velocity;

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
    this.set = [];
    this.count = count;

    while (count--) {
      this.set.push(new Particle());
    }
  }

  render() {
    this.set.forEach(p => p.move());
    this.set.forEach(p => p.render());
  }
}


var system = new ParticleSystem(100);
Canvas.setStroke(37, 165, 48, 1);

var render = () => {
  Canvas.fade();
  system.render();
  window.requestAnimationFrame(render);
};

window.requestAnimationFrame(render);
