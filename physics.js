'use strict';

function Physics() {
  this.objects = {};
  this.objects.test1 = {name: 'test one', draw: function() {}};
  this.objects.test2 = {name: 'test two', draw: function() {}};
}

Physics.prototype.tick = function(delta) {
  /* jshint unused: false */
  var o1;
  var o2;
  for(o1 in this.objects) {
    for (o2 in this.objects) {
      if (o1 !== o2) {
        //console.log('tick ' + o1 + ' vs ' + o2);
        //generate forces
      }
    }    
  }
  
  for (o1 in this.objects) {
    //apply forces
  }
  
  for (o1 in this.objects) {
    //delete objects
  }
};

Physics.prototype.draw = function(ctx, w, h) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  var obj;
  for (obj in this.objects) {
    this.objects[obj].draw();
  }
};