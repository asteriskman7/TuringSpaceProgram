'use strict';

function Physics() {
  this.objects = {};
  //this.objects.test1 = {name: 'test one', draw: function() {}};
  //this.objects.test2 = {name: 'test two', draw: function() {}};
}

Physics.prototype.tick = function(delta) {
  var o1Name;
  var o2Name;
  var o1;
  var o2;
  var r2;
  var dx;
  var dy;
  var f;
  var theta;
  for(o1Name in this.objects) {
    o1 = this.objects[o1Name];
    if (o1.movable === true) {
      for (o2Name in this.objects) {
        o2 = this.objects[o2Name];
        if (o1Name !== o2Name) {          
          //generate forces
          dx = o2.x - o1.x;
          dy = o2.y - o1.y;
          r2 = dx * dx + dy * dy;
          f = (o1.mass * o2.mass) / r2;
          theta = Math.atan2(dy, dx);
          o1.xf += f * Math.cos(theta);
          o1.yf += f * Math.sin(theta);
          if (r2 < (23*23)) {
            o1.destroy = true;
            console.log('set destroy 1');
          }
        }
      }
    }    
  }
  
  for (o1Name in this.objects) {
    //apply forces
    o1 = this.objects[o1Name];
    //a=f/m
    if (o1.movable) {
      o1.xv += o1.xf * delta / o1.mass;
      o1.yv += o1.yf * delta / o1.mass;
      o1.x += o1.xv * delta;
      o1.y += o1.yv * delta;
      console.log(o1Name + ' x=' + o1.x);
      o1.xf = 0;
      o1.yf = 0;
    }
  }
     
  for (o1 in this.objects) {
    //destroy marked objects
    if (this.objects[o1].destroy === true) {
      delete this.objects[o1];
    }
  }
};

Physics.prototype.draw = function(ctx, w, h) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  var obj;
  for (obj in this.objects) {
    this.objects[obj].draw(ctx);
  }
};

Physics.prototype.new = function(x, y, mass, type, config) {
  console.log('new object ' + config.name);
  switch (type) {
    case 'planet':
      this.objects[config.name] = {
        name: config.name,
        draw: function(ctx) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, 20, 0, 2 * Math.PI, false);
          ctx.fillStyle = 'green';
          ctx.fill();
        },
        movable: false,
        destroy: false,
        mass: mass,
        x: x,
        y: y,
        xv: 0,
        yv: 0,
        xf: 0,
        yf: 0
      }
      break;
    case 'body':
      this.objects[config.name] = {
        name: config.name,
        draw: function(ctx) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, 3, 0, 2 * Math.PI, false);
          ctx.fillStyle = '#808080';
          ctx.fill();
        },
        movable: true,
        destroy: false,
        mass: mass,
        x: x,
        y: y,
        xv: config.xv,
        yv: config.yv,
        xf: 0,
        yf: 0        
      }
      break;
    default:
      console.log('ERROR: Unable to create new physics body type ' + type);
  }
}