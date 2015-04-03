'use strict';

var levels = {};

levels.level0 = function(cpu, physics) {
  this.cpu = cpu;
  this.physics = physics;
};

levels.level0.prototype.init = function() {
  console.log('init level 0');
};

levels.level0.prototype.check = function() {
  //return 0 if the level is not complete
  //return 1 if the level has been won
  //return -1 if the level has been lost
  if (this.cpu.regs[this.cpu.regMap.R1] === 0xABCD) {
    return 1;
  } else if (this.cpu.cycles > 20) {
    return -1;
  }
  return 0;
};

levels.level1 = function(cpu, physics) {
  this.cpu = cpu;
  this.physics = physics;
};

levels.level1.prototype.init = function() {
  this.cpu.devices[0] = new DeviceNull('Dev16Seg-0', 0, this.cpu);
  this.cpu.ram[0x1000] = 0x1024;
  this.cpu.ram[0x1024] = 0xC001;
  this.cpu.ram[0x2000] = 0x0000;
};

levels.level1.prototype.check = function() {
  if (this.cpu.cycles > 40) {
    return -1;
  } else if (this.cpu.ram[0x2000] === 0xC001) {
    return 1;
  } else {
    return 0;
  }
};