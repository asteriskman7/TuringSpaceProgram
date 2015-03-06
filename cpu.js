'use strict';

function Cpu() {
  //random seed used in this.rnd16bit();
  this.seed = 1;


  //R0-R7, PC, SP, AF, IM, SEG, JD, ?, ZERO
  this.regs = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  this.regMap = {
    R0: 0, 
    R1: 1,
    R2: 2,
    R3: 3,
    R4: 4,
    R5: 5,
    R6: 6,
    R7: 7,
    PC: 8,
    SP: 9,
    AF: 10,
    IM: 11,
    SEG: 12,
    JD: 13,
    ZERO: 15
  };

  this.reset();

  //overwrite this function for custom handling of cpu errors
  this.runtimeError = function(msg) {console.log(msg);};

}

Cpu.prototype.reset = function() {
  this.ram = [];
  this.pci = this.regMap.PC;

  var i;

  for (i = 0; i <= 7; i++) {
    this.regs[i] = this.rnd16bit();
  }

  this.regs[this.regMap.PC] = 0;
  this.regs[this.regMap.SP] = 0;
  this.regs[this.regMap.AF] = this.rnd16bit();
  this.regs[this.regMap.IM] = this.rnd16bit();
  this.regs[this.regMap.SEG] = this.rnd16bit();
  this.regs[this.regMap.JD] = this.rnd16bit();
  this.regs[this.regMap.ZERO] = 0;
  
};

//cause the cpu to execute a single instruction
Cpu.prototype.tick = function() {
  var opcode = this.readRam(this.regs[this.pci]);

  //decode opcode in pcRam
  var opClass = (opcode & 0xF000);
  var opCmd = (opcode & 0x0F00);
  var opArgA = (opcode & 0x00F0) >> 4;
  var opArgB = (opcode & 0x000F);
  var const8 = (opArgA << 4) | opArgB;

  var pcJump = false;
  var ramAddr;

  switch (opClass) {
    case 0x0000: //load/store
      switch (opCmd) {
        case 0x0000: //ld
          this.regs[opArgA] = this.regs[opArgB];
          break;
        case 0x0200: //ldl
          this.regs[0] = (this.regs[0] & 0xFF00) | const8;
          break;
        case 0x0300: //ldh
          this.regs[0] = (this.regs[0] & 0x00FF) | (const8 << 8);
          break;
        case 0x0400: //ldr
          this.regs[opArgA] = this.readRam(this.regs[opArgB]);
          break;
        case 0x0500: //str
          this.ram[this.regs[opArgA]] = this.regs[opArgB];
          break;
        case 0x0600: //ldrc
          ramAddr = (this.regs[this.regMap.SEG] + const8) & 0xFFFF;
          this.regs[0] = this.readRam(ramAddr);
          break;
        case 0x0700: //strc
          ramAddr = (this.regs[this.regMap.SEG] + const8) & 0xFFFF;
          this.ram[ramAddr] = this.regs[0];
          break;
        case 0x0C00: //pop
          this.regs[opArgA] = this.readRam(this.regs[this.regMap.SP]);
          this.regs[this.regMap.SP] = (this.regs[this.regMap.SP] + 1) & 0xFFFF;
          break;
        case 0x0D00: //push
          this.regs[this.regMap.SP] = (this.regs[this.regMap.SP] - 1) & 0xFFFF;
          this.ram[this.regs[this.regMap.SP]] = this.regs[opArgA];
          break;
        default:
          this.opcodeError(opcode);
      }
      break;
    case 0x1000: //IO
      break;
    case 0x2000: //ALU
      break;
    case 0x3000: //JUMP
      break;
    default:
      this.opcodeError(opcode);
  }

  if (!pcJump) {
    this.regs[this.pci] += 1;
  }

};

Cpu.prototype.readRam = function(addr) {
  //return 0 if the ram address has not been initialized
  return this.ram[addr] || 0;
};

Cpu.prototype.rnd16bit = function() {
  var x = Math.sin(this.seed++) * 10000;
  var rnd = x - Math.floor(x);
  return Math.floor(rnd * 0x10000);
};

Cpu.prototype.opcodeError = function(opcode) {
  this.runtimeError('Illegal opcode ' + opcode.toString(16) + ' at ' + this.regs[this.pci].toString(16));
};


//only export if we're in the non-browser node environment
if (typeof window === 'undefined') {
  module.exports = Cpu;
} 

