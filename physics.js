'use strict';

function Physics() {
  
}

Physics.prototype.tick = function(delta) {
  /* jshint unused: false */
};

Physics.prototype.draw = function(ctx, w, h) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
};