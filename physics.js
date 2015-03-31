'use strict';

function Physics() {
  
}

Physics.prototype.tick = function(delta) {
  
};

Physics.prototype.draw = function(ctx, w, h) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  console.log('physics display');
}