var assert = require('assert');
var Cpu = require('../cpu.js');

var dut = new Cpu();

var seed = Math.floor(Math.random() * 10000);

function sinrnd() {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}


function rnd16bit () {
  return Math.floor(sinrnd() * 0x10000);
}

var iterations = 1;
var i;


console.log('Seed=' + seed);

describe('Cpu', function() {
  describe('class', function() {
    it('should be a function', function() {
      assert.equal(typeof Cpu, 'function');
    });
    it('should have a tick method', function() {
      assert.equal(typeof Cpu.prototype.tick, 'function');
    });
    it('should have a readRam method', function() {
      assert.equal(typeof Cpu.prototype.readRam, 'function');
    });
  });

  describe('object', function() {
    it('should have 16 regs', function() {
      assert.equal(dut.regs.length, 16);
    });
    it('should start with pc=0', function() {
      assert.equal(dut.regs[8], 0);
    });
    it('should have an empty ram array', function() {
      assert.equal(toString.call(dut.ram), '[object Array]');
      assert.equal(dut.ram.length, 0);
    });
    it('should have a runtimeError callback', function() {
      assert.equal(typeof dut.runtimeError, 'function');
    });
  });


  for (i = 0; i < iterations; i++) {

    describe('ld ('+i+')', function() {
      var expectedVal = rnd16bit();
      var srcReg = rnd16bit() & 0x7;
      var dstReg = rnd16bit() & 0x7;
      before(function() {
        dut = new Cpu();
        dut.ram[0] = 0x0000 | srcReg | (dstReg << 4);
        dut.regs[srcReg] = expectedVal;
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + dstReg, function() {
        assert.equal(dut.regs[dstReg], expectedVal);
      });
      it('should contain ' + expectedVal + ' in Reg' + srcReg, function() {
        assert.equal(dut.regs[srcReg], expectedVal);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('ldl ('+i+')', function() {
      var origVal = rnd16bit();
      var constVal = rnd16bit() & 0xFF;
      var expectedVal = (origVal & 0xFF00) | constVal;
      var dstReg = 0;
      //console.log('Reg ' + dstReg + ' start ' + origVal + ' const ' + constVal + ' expectedVal ' + expectedVal);
      before(function() {
        dut = new Cpu();
        dut.ram[0] = 0x0200 | constVal;
        dut.regs[dstReg] = origVal;
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + dstReg, function() {
        assert.equal(dut.regs[dstReg], expectedVal);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('ldh ('+i+')', function() {
      var origVal = rnd16bit();
      var constVal = rnd16bit() & 0xFF00;
      var expectedVal = (origVal & 0x00FF) | constVal;
      var dstReg = 0;
      //console.log('Reg ' + dstReg + ' start ' + origVal + ' const ' + constVal + ' expectedVal ' + expectedVal);
      before(function() {
        dut = new Cpu();
        dut.ram[0] = 0x0300 | (constVal >> 8);
        dut.regs[dstReg] = origVal;
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + dstReg, function() {
        assert.equal(dut.regs[dstReg], expectedVal);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('ldr ('+i+')', function() {
      var origVal = rnd16bit();
      var ramAddr = (rnd16bit() + 1) & 0xFFFF; //make sure to not write addr 0 where this opcode will be
      var expectedVal = rnd16bit();
      var dstReg = rnd16bit() & 0x0007;
      var addrReg; 
      do {
        addrReg = rnd16bit() & 0x0007;
      } while (addrReg == dstReg);

      before(function() {
        dut = new Cpu();
        dut.ram[0] = 0x0400 | (dstReg << 4) | (addrReg);
        dut.ram[ramAddr] = expectedVal;
        dut.regs[dstReg] = origVal;
        dut.regs[addrReg] = ramAddr;
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + dstReg, function() {
        assert.equal(dut.regs[dstReg], expectedVal);
      });
      it('should contain ' + expectedVal + ' in Ram[' + ramAddr + ']', function() {
        assert.equal(dut.ram[ramAddr], expectedVal);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('str ('+i+')', function() {
      var origVal = rnd16bit();
      var ramAddr = (rnd16bit() + 1) & 0xFFFF; //make sure to not write addr 0 where this opcode will be
      var expectedVal = rnd16bit();
      var srcReg = rnd16bit() & 0x0007;
      var addrReg; 
      do {
        addrReg = rnd16bit() & 0x0007;
      } while (addrReg == srcReg);

      before(function() {
        dut = new Cpu();
        dut.ram[0] = 0x0500 | (addrReg << 4) | (srcReg);
        dut.ram[ramAddr] = origVal;
        dut.regs[srcReg] = expectedVal;
        dut.regs[addrReg] = ramAddr;
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + srcReg, function() {
        assert.equal(dut.regs[srcReg], expectedVal);
      });
      it('should contain ' + expectedVal + ' in Ram[' + ramAddr + ']', function() {
        assert.equal(dut.ram[ramAddr], expectedVal);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('ldrc ('+i+')', function() {
      var origVal = rnd16bit();
      var expectedVal = rnd16bit();
      var segAddr = (rnd16bit() + 1) & 0xFFFF; //make sure to not write addr 0 where this opcode will be
      var constAddr = rnd16bit() & 0x00FF;
      var ramAddr = (segAddr + constAddr) & 0xFFFF;


      before(function() {
        dut = new Cpu();
        dut.ram[0] = 0x0600 | constAddr;
        dut.ram[ramAddr] = expectedVal;
        dut.regs[0] = origVal;
        dut.regs[dut.regMap.SEG] = segAddr;
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expectedVal + ' in Ram[' + ramAddr + ']', function() {
        assert.equal(dut.ram[ramAddr], expectedVal);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('strc ('+i+')', function() {
      var origVal = rnd16bit();
      var expectedVal = rnd16bit();
      var segAddr = (rnd16bit() + 1) & 0xFFFF; //make sure to not write addr 0 where this opcode will be
      var constAddr = rnd16bit() & 0x00FF;
      var ramAddr = (segAddr + constAddr) & 0xFFFF;


      before(function() {
        dut = new Cpu();
        dut.ram[0] = 0x0700 | constAddr;
        dut.ram[ramAddr] = origVal;
        dut.regs[0] = expectedVal;
        dut.regs[dut.regMap.SEG] = segAddr;
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expectedVal + ' in Ram[' + ramAddr + ']', function() {
        assert.equal(dut.ram[ramAddr], expectedVal);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('pop ('+i+')', function() {
      var origVal = rnd16bit();
      var expectedVal = rnd16bit();
      var spStartAddr = (rnd16bit() + 1) & 0xFFFF; //make sure to not write data where this opcode will be
      var spEndAddr = (spStartAddr + 1) & 0xFFFF;
      var dstReg = rnd16bit() & 0x0007;

      before(function() {
        dut = new Cpu();
        dut.regs[dstReg] = origVal;
        dut.ram[0] = 0x0C00 | (dstReg << 4);
        dut.ram[spStartAddr] = expectedVal;
        dut.regs[dut.regMap.SP] = spStartAddr;
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + dstReg, function() {
        assert.equal(dut.regs[dstReg], expectedVal);
      });
      it('should contain ' + expectedVal + ' in Ram[' + spStartAddr + ']', function() {
        assert.equal(dut.ram[spStartAddr], expectedVal);
      });
      it('should contain ' + spEndAddr + ' in SP', function() {
        assert.equal(dut.regs[dut.regMap.SP], spEndAddr);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('push ('+i+')', function() {
      var origVal = rnd16bit();
      var expectedVal = rnd16bit();
      var spStartAddr = (rnd16bit() + 1) & 0xFFFF; //make sure to not write data where this opcode will be
      if (spStartAddr === 1) {spStartAddr = 2;}
      var spEndAddr = (spStartAddr - 1 ) & 0xFFFF;
      var srcReg = rnd16bit() & 0x0007;

      before(function() {
        dut = new Cpu();
        dut.regs[srcReg] = expectedVal;
        dut.ram[0] = 0x0D00 | (srcReg << 4);
        dut.ram[spEndAddr] = origVal;
        dut.regs[dut.regMap.SP] = spStartAddr;
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + srcReg, function() {
        assert.equal(dut.regs[srcReg], expectedVal);
      });
      it('should contain ' + expectedVal + ' in Ram[' + spEndAddr + ']', function() {
        assert.equal(dut.ram[spEndAddr], expectedVal);
      });
      it('should contain ' + spEndAddr + ' in SP', function() {
        assert.equal(dut.regs[dut.regMap.SP], spEndAddr);
      });
    });

  }

});

