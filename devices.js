'use strict';

/*
//Base Device
function Device() {
  this.name = 'EMPTY';
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
 * constructor(name)
 * reset()
 * read()
 * write(data)
 * draw(ctx, x1, y1, x2, y2)
*/

function DeviceNull(name) {
  this.name = name;
  this.value = 0;
}

DeviceNull.prototype.reset = function() { };

DeviceNull.prototype.read = function() { return this.value; };

DeviceNull.prototype.write = function(data) { this.value = data & 0xFFFF };

DeviceNull.prototype.draw = function(ctx, x1, y1, x2, y2) { };

function DeviceDisplay(name) {
  this.name = name;
}

DeviceDisplay.prototype.reset = function() { };

DeviceDisplay.prototype.read = function() { };

DeviceDisplay.prototype.write = function(data) { };

DeviceDisplay.prototype.draw = function(ctx, x1, y1, x2, y2) { };



//only export if we're in the non-browser node environment
if (typeof window === 'undefined') {
  module.exports = DeviceNull;
}