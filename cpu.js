
function Cpu() {
  this.pc = 0;
  this.sp = 0;
  //R0-R7
  this.regs = [0,0,0,0,0,0,0,0];
  this.ram = [0,1,2,3,4,5,6,7];
}

Cpu.prototype.tick = function() {
  var pcRam = this.ram[this.pc];

  this.regs[0] = pcRam;

  this.pc = (this.pc + 1) & 0xFFFF;

};
