'use strict';

/*
Level Tree

Part 1 - kid
learn the basics of the cpu and assembly language culmanating in use of physics system
1 loading registers and ram
2 using alu
3 using jump and call/ret
4 using devices for I/O
5 using devices to control simple physics system

Part 2 - intern
learn how to use the physics system in more detail culmanating in ?
1 
2
3
4
5

Part 3 - TASA engineer
use the physics system to run a series of programs to help Turings visit the stars
1
2
3
4
5

*/

var levels = {};

levels.level0 = function(cpu, physics) {
  this.cpu = cpu;
  this.physics = physics;
};

levels.level0.prototype.init = function() {
  console.log('init level 0');
};

levels.level0.prototype.postAsm = function() {
  
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
};

levels.level1.prototype.postAsm = function() {
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

levels.level2 = function(cpu, physics) {
  this.cpu = cpu;
  this.physics = physics;
}

levels.level2.prototype.init = function() {
  //add some physics bodies
  console.log('level2 init');
  this.physics.new(0, 0, 1e4, 'planet', {name: 'planet0'});
  this.physics.new(50, 50, 10, 'body', {name: 'body0', xv: 0, yv: 0});
}

levels.level2.prototype.postAsm = function() {}

levels.level2.prototype.check = function() {
  //check if certain physics body location is correct
  if (this.physics.objects['body0'] === undefined) {
    return 1;
  }
  return 0;
}