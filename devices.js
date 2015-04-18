'use strict';

/*
//Base Device
function Device(name, id, cpu) {
  this.name = name;
  this.id = id;
  this.cpu = cpu;
};

Device.prototype.reset = function() { };

Device.prototype.read = function() { };

Device.prototype.write = function(data) { };

Device.prototype.draw = function(ctx, x1, y1, x2, y2) { };

 * To create a 'class' inheriting from Device:
 * function DeviceType() { };
 * DeviceType.prototype = Object.create(Device.prototype);
 * 
 *
*/

/* All devices must have the following:
 * properties:
 * name - string
 * functions:
 * constructor(name, id, cpu)
 * reset()
 * read()
 * write(data)
 * draw(ctx, x, y, w, h) - assusme a ctx.save() prefix and ctx.restore() suffix
*/

function DeviceNull(name, id, cpu) {
  this.name = name;
  this.id = id;
  this.cpu = cpu;
  this.value = 0;
}

DeviceNull.prototype.reset = function() { };

DeviceNull.prototype.read = function() { return this.value; };

DeviceNull.prototype.write = function(data) { this.value = data & 0xFFFF; };

DeviceNull.prototype.draw = function(ctx, w, h) {
  
  //ctx.fillStyle = 'rgb(' + ((this.value & 0x0F00) >> 4) + ',' + ((this.value & 0x00F0) >> 0) + ',' + ((this.value & 0x000F) << 4)+ ')';
  //ctx.fillStyle = '#FFFFFF';
  //ctx.fillRect(0,0,w,h);
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(0,0,w,h);
  ctx.font = '10px courier';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.fillText(this.name, w/2, h/2);

  //ctx.fillStyle = '#FFFFFF';
  //ctx.fillRect(0,0,w,h);
  
};

function Device16Seg(name, id, cpu) {
  this.name = name;
  this.id = id;
  this.cpu = cpu;
  this.baseAddress = 0x8000 | (id << 11);
}

Device16Seg.prototype.reset = function() { };

Device16Seg.prototype.read = function() { };

Device16Seg.prototype.write = function(data) { 
  /* jshint unused: false */
};

Device16Seg.prototype.draw = function(ctx, w, h) {
  
  /*
   * 01234567890123456789
   */

  var charWidth = 6;
  var charHeight = 12;  
  var hChars = Math.floor(w / charWidth);
  var vChars = Math.floor(h / charHeight);

  var totalChars = hChars * vChars;
  var i;
  var curChar;
  var charX;
  var charY;
  var char;

  ctx.fillStyle = '#00FF00';
  ctx.fillRect(0, 0, w, h); 
  ctx.font = '10px courier';
  ctx.textBaseline = 'top';
  
  
  for (i = 0; i < totalChars; i++) {
    curChar = this.cpu.ram[this.baseAddress + i] & 0x00FF;
    charX = Math.floor(i % hChars) * charWidth;
    charY = Math.floor(i / hChars) * charHeight;
    //ctx.fillStyle = '#00FF00';
    //ctx.fillRect(charX, charY, charWidth, charHeight);
    //ctx.font = '10px courier';
    //ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    char = (curChar < 32) || (curChar > 126) ? '?' : String.fromCharCode(curChar);
    ctx.fillText(char, charX, charY);
    //ctx.fillText((i % 16).toString(16), charX, charY);
  }
};



//only export if we're in the non-browser node environment
if (typeof window === 'undefined') {
  module.exports = DeviceNull;
}