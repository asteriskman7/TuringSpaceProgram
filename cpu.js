
function Cpu() {
  //R0-R7, PC, SP, AF, IM, SEG, JD, ?, ?, ?, ZERO
  this.regs = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  this.ram = [0,1,0,2,0,3,0,4,0,5,0,6];

  //overwrite this function for custom handling of cpu errors
  this.runtimeError = function(msg) {};
}

//cause the cpu to execute a single instruction
Cpu.prototype.tick = function() {
  var pcRam = this.readRam(this.pc);

  //decode opcode in pcRam
  //for now, all opcodes mean load next word into R0
  var constVal = this.readRam(this.pc + 1);  
  this.regs[0] = constVal;
  this.pc = (this.pc + 1) & 0xFFFF;
  this.pc = (this.pc + 1) & 0xFFFF;

};

Cpu.prototype.readRam = function(addr) {
  //return 0 if the ram address has not been initialized
  return this.ram[addr] || 0;
};

module.exports = Cpu;

