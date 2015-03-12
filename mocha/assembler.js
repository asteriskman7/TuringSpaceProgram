var assert = require('assert');
var Assembler = require('../assembler.js');

var dut = new Assembler();

var seed = Math.floor(Math.random() * 10000);
//seed = 6167;

function sinrnd() {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}


function rnd16bit() {
  return Math.floor(sinrnd() * 0x10000);
}

function rnd1bit() {
  return Math.floor(sinrnd() * 2);
}

function rndStr(l) {
  var result = '';
  do {
    result = (result + ((Math.random() + 1).toString(36).substr(2))).substr(0,l);
  } while (result.length < l);
  return result;
}

function arrayToHex (a) {
  var hex = '';
  var i;
  var aval;
  for (i = 0; i < a.length; i++) {
    aval = a[i] | 0;
    hex += ('0000' + aval.toString(16)).substr(-4);
  }
  return hex;
}

function bin2hex(b) {
  var result = '';
  for (var i = 0; i < b.length; i++) {
    result += ('00' + b.charCodeAt(i).toString(16)).substr(-2) + ' ';
  }
  return result;
}

var iterations = 1;
var i;


console.log('Seed=' + seed);

describe('Assembler', function() {
  describe('class', function() {
    it('should be a function', function() {
      assert.equal(typeof Assembler, 'function');
    });
    it('should have an assemble method', function() {
      assert.equal(typeof Assembler.prototype.assemble, 'function');
    });
    it('should have a stringToInt method', function() {
      assert.equal(typeof Assembler.prototype.stringToInt, 'function');
    });
  });

  describe('object', function() {
    it('should have an empty ram array', function() {
      assert.equal(toString.call(dut.ram), '[object Array]');
      assert.equal(dut.ram.length, 0);
    });
    it('should have an empty hex string', function() {
      assert.equal(typeof dut.hex, 'string');
      assert.equal(dut.hex.length, 0);
    });
    it('should have an empty label map', function() {
      assert.equal(typeof dut.labelMap, 'object');
      assert.equal(Object.keys(dut.labelMap).length, 0);
    });
    it('should have a regMap', function() {
      assert.equal(typeof dut.regMap, 'object');
    });
  });

  describe('stringToInt', function() {
    var value = rnd16bit();
    var mask;
    var result;
    if (rnd1bit()) {
      if (rnd1bit()) {
        mask = '.h';
        result = (value & 0xFF00) >> 8;
      } else {
        mask = '.l';
        result = (value & 0x00FF);
      }
    } else {
      mask = '';
      result = value;
    }
    it('should convert base 10 correctly', function() {
      assert.equal(dut.stringToInt(value.toString(10) + mask), result);
    });
    it('should convert base 16 correctly', function() {
      assert.equal(dut.stringToInt('0x' + value.toString(16) + mask), result);
    });
    it('should convert ascii correctly', function() {
      var s = String.fromCharCode(value & 0xFF);
      if (value > 0xFF) {
        s = String.fromCharCode((value >> 8) & 0xFF) + s;
      }
      assert.equal(dut.stringToInt('"' + s + '"' + mask), result);
    });
    it('should convert label correctly', function() {
      var label = ':' + rndStr(rnd16bit() & 0xF + 1);
      dut.labelMap = {};
      dut.labelMap[label] = value;
      assert.equal(dut.stringToInt(label + mask), result);
    });
  });

  var tests = [
    {
      name: 'ld',
      test: function() {return {code: 'ld R1 R2; comment', result: [0x0012]};},
    }
  ];

  var testcase;
  var testNum;
  for (testNum = 0; testNum < tests.length; testNum++) {
    testcase = tests[testNum];
    for (var i = 0; i < iterations; i++) {

      describe(testcase.name + ' (' + i + ')', function() {
        var testInfo = testcase.test();
        var testCode = testInfo.code;
        var testResult = testInfo.result;
        var testHex = arrayToHex(testResult);
        var rc;
        before(function() {
          dut = new Assembler();
          rc = dut.assemble(testCode);
        });
        it('should have ram equal to ' + testResult.toString(), function() {
          assert.deepEqual(dut.ram, testResult); 
        });
        it('should have hex equal to ' + testHex, function() {
          assert.equal(dut.hex, testHex);
        });
        it('should have return code ""', function() {
          assert.equal(rc, '');
        });
      });

    }
  }

});
/*

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

  for (i = 0; i < iterations; i++) {

    describe('add ('+i+')', function() {
      var origVal = rnd16bit();
      var aVal = rnd16bit();
      var bVal = rnd16bit();
      var regA = rnd16bit() & 0x0007;
      var regB = rnd16bit() & 0x0007;
      if (regB === regA) {bVal = aVal;}
      if (regA === 0) {aVal = origVal;}
      if (regB === 0) {bVal = origVal;}
      var expectedVal = (aVal + bVal) & 0xFFFF;
      var expA;
      var expB;
      if (regA === 0) {expA = expectedVal;} else {expA = aVal;}
      if (regB === 0) {expB = expectedVal;} else {expB = bVal;}

      var zeroFlag = (expectedVal === 0)|0;
      var negFlag = ((expectedVal & 0x8000) === 0x8000)|0;
      var carryFlag = (((aVal + bVal) & 0x10000) === 0x10000)|0
      var expectedFlag = zeroFlag | (negFlag << 1) | (carryFlag << 2);
      before(function() {
        dut = new Cpu();
        dut.regs[0] = origVal;
        dut.regs[regA] = aVal;
        dut.regs[regB] = bVal;
        dut.ram[0] = 0x2000 | (regA << 4) | (regB);
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expA + ' in Reg' + regA, function() {
        assert.equal(dut.regs[regA], expA);
      });
      it('should contain ' + expB + ' in Reg' + regB, function() {
        assert.equal(dut.regs[regB], expB);
      });
      it('should contain ' + expectedFlag + ' in AF', function() {
        assert.equal(dut.regs[dut.regMap.AF], expectedFlag);  
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('addc ('+i+')', function() {
      var origVal = rnd16bit();
      var aVal = rnd16bit();
      var bVal = rnd16bit() & 0x000F;
      var regA = rnd16bit() & 0x0007;
      if (regA === 0) {aVal = origVal;}
      var expectedVal = (aVal + bVal) & 0xFFFF;
      var expA;
      var expB;
      if (regA === 0) {expA = expectedVal;} else {expA = aVal;}

      var zeroFlag = (expectedVal === 0)|0;
      var negFlag = ((expectedVal & 0x8000) === 0x8000)|0;
      var carryFlag = (((aVal + bVal) & 0x10000) === 0x10000)|0
      var expectedFlag = zeroFlag | (negFlag << 1) | (carryFlag << 2);
      before(function() {
        dut = new Cpu();
        dut.regs[0] = origVal;
        dut.regs[regA] = aVal;
        dut.ram[0] = 0x2100 | (regA << 4) | (bVal);
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expA + ' in Reg' + regA, function() {
        assert.equal(dut.regs[regA], expA);
      });
      it('should contain ' + expectedFlag + ' in AF', function() {
        assert.equal(dut.regs[dut.regMap.AF], expectedFlag);  
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('sub ('+i+')', function() {
      var origVal = rnd16bit();
      var aVal = rnd16bit();
      var bVal = rnd16bit();
      var regA = rnd16bit() & 0x0007;
      var regB = rnd16bit() & 0x0007;
      if (regB === regA) {bVal = aVal;}
      if (regA === 0) {aVal = origVal;}
      if (regB === 0) {bVal = origVal;}
      var expectedVal = (aVal - bVal) & 0xFFFF;
      var expA;
      var expB;
      if (regA === 0) {expA = expectedVal;} else {expA = aVal;}
      if (regB === 0) {expB = expectedVal;} else {expB = bVal;}

      var zeroFlag = (expectedVal === 0)|0;
      var negFlag = ((expectedVal & 0x8000) === 0x8000)|0;
      var carryFlag = (((aVal - bVal) & 0x10000) === 0x10000)|0
      var expectedFlag = zeroFlag | (negFlag << 1) | (carryFlag << 2);
      before(function() {
        dut = new Cpu();
        dut.regs[0] = origVal;
        dut.regs[regA] = aVal;
        dut.regs[regB] = bVal;
        dut.ram[0] = 0x2200 | (regA << 4) | (regB);
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expA + ' in Reg' + regA, function() {
        assert.equal(dut.regs[regA], expA);
      });
      it('should contain ' + expB + ' in Reg' + regB, function() {
        assert.equal(dut.regs[regB], expB);
      });
      it('should contain ' + expectedFlag + ' in AF', function() {
        assert.equal(dut.regs[dut.regMap.AF], expectedFlag);  
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('subc ('+i+')', function() {
      var origVal = rnd16bit();
      var aVal = rnd16bit();
      var bVal = rnd16bit() & 0x000F;
      var regA = rnd16bit() & 0x0007;
      if (regA === 0) {aVal = origVal;}
      var expectedVal = (aVal - bVal) & 0xFFFF;
      var expA;
      var expB;
      if (regA === 0) {expA = expectedVal;} else {expA = aVal;}

      var zeroFlag = (expectedVal === 0)|0;
      var negFlag = ((expectedVal & 0x8000) === 0x8000)|0;
      var carryFlag = (((aVal + bVal) & 0x10000) === 0x10000)|0
      var expectedFlag = zeroFlag | (negFlag << 1) | (carryFlag << 2);
      before(function() {
        dut = new Cpu();
        dut.regs[0] = origVal;
        dut.regs[regA] = aVal;
        dut.ram[0] = 0x2300 | (regA << 4) | (bVal);
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expA + ' in Reg' + regA, function() {
        assert.equal(dut.regs[regA], expA);
      });
      it('should contain ' + expectedFlag + ' in AF', function() {
        assert.equal(dut.regs[dut.regMap.AF], expectedFlag);  
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('and ('+i+')', function() {
      var origVal = rnd16bit();
      var aVal = rnd16bit();
      var bVal = rnd16bit();
      var regA = rnd16bit() & 0x0007;
      var regB = rnd16bit() & 0x0007;
      if (regB === regA) {bVal = aVal;}
      if (regA === 0) {aVal = origVal;}
      if (regB === 0) {bVal = origVal;}
      var expectedVal = (aVal & bVal);
      var expA;
      var expB;
      if (regA === 0) {expA = expectedVal;} else {expA = aVal;}
      if (regB === 0) {expB = expectedVal;} else {expB = bVal;}

      var zeroFlag = (expectedVal === 0)|0;
      var negFlag = ((expectedVal & 0x8000) === 0x8000)|0;
      var carryFlag = (((aVal & bVal) & 0x10000) === 0x10000)|0
      var expectedFlag = zeroFlag | (negFlag << 1) | (carryFlag << 2);
      before(function() {
        dut = new Cpu();
        dut.regs[0] = origVal;
        dut.regs[regA] = aVal;
        dut.regs[regB] = bVal;
        dut.ram[0] = 0x2400 | (regA << 4) | (regB);
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expA + ' in Reg' + regA, function() {
        assert.equal(dut.regs[regA], expA);
      });
      it('should contain ' + expB + ' in Reg' + regB, function() {
        assert.equal(dut.regs[regB], expB);
      });
      it('should contain ' + expectedFlag + ' in AF', function() {
        assert.equal(dut.regs[dut.regMap.AF], expectedFlag);  
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('or ('+i+')', function() {
      var origVal = rnd16bit();
      var aVal = rnd16bit();
      var bVal = rnd16bit();
      var regA = rnd16bit() & 0x0007;
      var regB = rnd16bit() & 0x0007;
      if (regB === regA) {bVal = aVal;}
      if (regA === 0) {aVal = origVal;}
      if (regB === 0) {bVal = origVal;}
      var expectedVal = (aVal | bVal);
      var expA;
      var expB;
      if (regA === 0) {expA = expectedVal;} else {expA = aVal;}
      if (regB === 0) {expB = expectedVal;} else {expB = bVal;}

      var zeroFlag = (expectedVal === 0)|0;
      var negFlag = ((expectedVal & 0x8000) === 0x8000)|0;
      var carryFlag = (((aVal | bVal) & 0x10000) === 0x10000)|0
      var expectedFlag = zeroFlag | (negFlag << 1) | (carryFlag << 2);
      before(function() {
        dut = new Cpu();
        dut.regs[0] = origVal;
        dut.regs[regA] = aVal;
        dut.regs[regB] = bVal;
        dut.ram[0] = 0x2500 | (regA << 4) | (regB);
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expA + ' in Reg' + regA, function() {
        assert.equal(dut.regs[regA], expA);
      });
      it('should contain ' + expB + ' in Reg' + regB, function() {
        assert.equal(dut.regs[regB], expB);
      });
      it('should contain ' + expectedFlag + ' in AF', function() {
        assert.equal(dut.regs[dut.regMap.AF], expectedFlag);  
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('xor ('+i+')', function() {
      var origVal = rnd16bit();
      var aVal = rnd16bit();
      var bVal = rnd16bit();
      var regA = rnd16bit() & 0x0007;
      var regB = rnd16bit() & 0x0007;
      if (regB === regA) {bVal = aVal;}
      if (regA === 0) {aVal = origVal;}
      if (regB === 0) {bVal = origVal;}
      var expectedVal = (aVal ^ bVal);
      var expA;
      var expB;
      if (regA === 0) {expA = expectedVal;} else {expA = aVal;}
      if (regB === 0) {expB = expectedVal;} else {expB = bVal;}

      var zeroFlag = (expectedVal === 0)|0;
      var negFlag = ((expectedVal & 0x8000) === 0x8000)|0;
      var carryFlag = (((aVal ^ bVal) & 0x10000) === 0x10000)|0
      var expectedFlag = zeroFlag | (negFlag << 1) | (carryFlag << 2);
      before(function() {
        dut = new Cpu();
        dut.regs[0] = origVal;
        dut.regs[regA] = aVal;
        dut.regs[regB] = bVal;
        dut.ram[0] = 0x2600 | (regA << 4) | (regB);
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expA + ' in Reg' + regA, function() {
        assert.equal(dut.regs[regA], expA);
      });
      it('should contain ' + expB + ' in Reg' + regB, function() {
        assert.equal(dut.regs[regB], expB);
      });
      it('should contain ' + expectedFlag + ' in AF', function() {
        assert.equal(dut.regs[dut.regMap.AF], expectedFlag);  
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('not ('+i+')', function() {
      var origVal = rnd16bit();
      var aVal = rnd16bit();
      var regA = rnd16bit() & 0x0007;
      if (regA === 0) {aVal = origVal;}
      var expectedVal = (~aVal) & 0xFFFF;
      var expA;
      if (regA === 0) {expA = expectedVal;} else {expA = aVal;}

      var zeroFlag = (expectedVal === 0)|0;
      var negFlag = ((expectedVal & 0x8000) === 0x8000)|0;
      var carryFlag = 0;
      var expectedFlag = zeroFlag | (negFlag << 1) | (carryFlag << 2);
      before(function() {
        dut = new Cpu();
        dut.regs[0] = origVal;
        dut.regs[regA] = aVal;
        dut.ram[0] = 0x2700 | (regA << 4);
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expA + ' in Reg' + regA, function() {
        assert.equal(dut.regs[regA], expA);
      });
      it('should contain ' + expectedFlag + ' in AF', function() {
        assert.equal(dut.regs[dut.regMap.AF], expectedFlag);  
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('sftr ('+i+')', function() {
      var origVal = rnd16bit();
      var aVal = rnd16bit();
      var bVal = rnd16bit() & 0x001F;
      var regA = rnd16bit() & 0x0007;
      var regB = rnd16bit() & 0x0007;
      if (regB === regA) {aVal = bVal;}
      if (regA === 0) {aVal = origVal;}
      if (regB === 0) {bVal = origVal;}
      var expectedVal;
      if (bVal > 15) {
        expectedVal = 0;
      } else {
        expectedVal = (aVal >>> bVal);
      }
      var expA;
      var expB;
      if (regA === 0) {expA = expectedVal;} else {expA = aVal;}
      if (regB === 0) {expB = expectedVal;} else {expB = bVal;}

      var zeroFlag = (expectedVal === 0)|0;
      var negFlag = ((expectedVal & 0x8000) === 0x8000)|0;
      var carryFlag = 0;
      var expectedFlag = zeroFlag | (negFlag << 1) | (carryFlag << 2);
      before(function() {
        dut = new Cpu();
        dut.regs[0] = origVal;
        dut.regs[regA] = aVal;
        dut.regs[regB] = bVal;
        dut.ram[0] = 0x2800 | (regA << 4) | (regB);
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expA + ' in Reg' + regA, function() {
        assert.equal(dut.regs[regA], expA);
      });
      it('should contain ' + expB + ' in Reg' + regB, function() {
        assert.equal(dut.regs[regB], expB);
      });
      it('should contain ' + expectedFlag + ' in AF', function() {
        assert.equal(dut.regs[dut.regMap.AF], expectedFlag);  
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('sftrs ('+i+')', function() {
      var origVal = rnd16bit();
      var aVal = rnd16bit();
      var bVal = rnd16bit() & 0x001F;
      var regA = rnd16bit() & 0x0007;
      var regB = rnd16bit() & 0x0007;
      if (regB === regA) {aVal = bVal;}
      if (regA === 0) {aVal = origVal;}
      if (regB === 0) {bVal = origVal;}
      var expectedVal;
      if (bVal > 15) {
        expectedVal = 0;
      } else {
        expectedVal = (aVal >>> bVal);
      }
      if ( (aVal & 0x8000) === 0x8000) {
        //must sign extend
        //the bval msb must be set to 1
        expectedVal = (expectedVal | (0xFFFF0000 >> bVal)) & 0xFFFF;
      }

      var expA;
      var expB;
      if (regA === 0) {expA = expectedVal;} else {expA = aVal;}
      if (regB === 0) {expB = expectedVal;} else {expB = bVal;}

      var zeroFlag = (expectedVal === 0)|0;
      var negFlag = ((expectedVal & 0x8000) === 0x8000)|0;
      var carryFlag = 0;
      var expectedFlag = zeroFlag | (negFlag << 1) | (carryFlag << 2);
      before(function() {
        dut = new Cpu();
        dut.regs[0] = origVal;
        dut.regs[regA] = aVal;
        dut.regs[regB] = bVal;
        dut.ram[0] = 0x2900 | (regA << 4) | (regB);
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expA + ' in Reg' + regA, function() {
        assert.equal(dut.regs[regA], expA);
      });
      it('should contain ' + expB + ' in Reg' + regB, function() {
        assert.equal(dut.regs[regB], expB);
      });
      it('should contain ' + expectedFlag + ' in AF', function() {
        assert.equal(dut.regs[dut.regMap.AF], expectedFlag);  
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('sftl ('+i+')', function() {
      var origVal = rnd16bit();
      var aVal = rnd16bit();
      var bVal = rnd16bit() & 0x001F;
      var regA = rnd16bit() & 0x0007;
      var regB = rnd16bit() & 0x0007;
      if (regB === regA) {aVal = bVal;}
      if (regA === 0) {aVal = origVal;}
      if (regB === 0) {bVal = origVal;}
      var expectedVal;
      var carryFlag;
      if (bVal > 15) {
        expectedVal = 0;
        carryFlag = aVal !== 0;
      } else {
        expectedVal = (aVal << bVal) & 0xFFFF;
        carryFlag = ((aVal << bVal) & 0xFFFF0000) !== 0;
      }

      var expA;
      var expB;
      if (regA === 0) {expA = expectedVal;} else {expA = aVal;}
      if (regB === 0) {expB = expectedVal;} else {expB = bVal;}

      var zeroFlag = (expectedVal === 0)|0;
      var negFlag = ((expectedVal & 0x8000) === 0x8000)|0;
      var expectedFlag = zeroFlag | (negFlag << 1) | (carryFlag << 2);
      before(function() {
        dut = new Cpu();
        dut.regs[0] = origVal;
        dut.regs[regA] = aVal;
        dut.regs[regB] = bVal;
        dut.ram[0] = 0x2A00 | (regA << 4) | (regB);
        dut.tick();
      });
      it('should contain ' + expectedVal + ' in Reg' + 0, function() {
        assert.equal(dut.regs[0], expectedVal);
      });
      it('should contain ' + expA + ' in Reg' + regA, function() {
        assert.equal(dut.regs[regA], expA);
      });
      it('should contain ' + expB + ' in Reg' + regB, function() {
        assert.equal(dut.regs[regB], expB);
      });
      it('should contain ' + expectedFlag + ' in AF', function() {
        assert.equal(dut.regs[dut.regMap.AF], expectedFlag);  
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('jmp ('+i+')', function() {
      var startAddr = rnd16bit();
      var jumpAddr = rnd16bit();

      before(function() {
        dut = new Cpu();
        dut.regs[dut.regMap.JD] = jumpAddr;
        dut.ram[startAddr] = 0x3000;
        dut.regs[dut.pci] = startAddr;
        dut.tick();
      });
      it('should contain ' + jumpAddr + ' in PC', function() {
        assert.equal(dut.regs[dut.pci], jumpAddr);
      });
      it('should contain ' + jumpAddr + ' in JD', function() {
        assert.equal(dut.regs[dut.regMap.JD], jumpAddr);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('jmp0 ('+i+')', function() {
      var startAddr = rnd16bit();
      var jumpAddr = rnd16bit();
      var jumpMask = rnd16bit() & 0x00FF;
      var realMask = rnd16bit() & 0x00FF;

      //50% of the time, make sure we get a jump
      if ((rnd16bit() & 0x1) === 0) {
        jumpMask = (~realMask) & 0x00FF;
      }

      var shouldJump = (jumpMask & realMask) === 0;
      var finalPC;
      if (shouldJump) {
        finalPC = jumpAddr;
      } else {
        finalPC = startAddr + 1;
      }  

      before(function() {
        dut = new Cpu();
        dut.regs[dut.regMap.JD] = jumpAddr;
        dut.ram[startAddr] = 0x3000 | jumpMask;
        dut.regs[dut.regMap.AF] = realMask;
        dut.regs[dut.pci] = startAddr;
        dut.tick();
      });
      it('should contain ' + finalPC + ' in PC', function() {
        assert.equal(dut.regs[dut.pci], finalPC);
      });
      it('should contain ' + jumpAddr + ' in JD', function() {
        assert.equal(dut.regs[dut.regMap.JD], jumpAddr);
      });
    });

  }  

  for (i = 0; i < iterations; i++) {

    describe('jmp1 ('+i+')', function() {
      var startAddr = rnd16bit();
      var jumpAddr = rnd16bit();
      var jumpMask = rnd16bit() & 0x00FF;
      var realMask = rnd16bit() & 0x00FF;

      //50% of the time, make sure we get a jump
      if ((rnd16bit() & 0x1) === 0) {
        jumpMask = (~realMask) & 0x00FF;
      }

      var shouldJump = (jumpMask & realMask) !== 0;
      var finalPC;
      if (shouldJump) {
        finalPC = jumpAddr;
      } else {
        finalPC = startAddr + 1;
      }  

      before(function() {
        dut = new Cpu();
        dut.regs[dut.regMap.JD] = jumpAddr;
        dut.ram[startAddr] = 0x3100 | jumpMask;
        dut.regs[dut.regMap.AF] = realMask;
        dut.regs[dut.pci] = startAddr;
        dut.tick();
      });
      it('should contain ' + finalPC + ' in PC', function() {
        assert.equal(dut.regs[dut.pci], finalPC);
      });
      it('should contain ' + jumpAddr + ' in JD', function() {
        assert.equal(dut.regs[dut.regMap.JD], jumpAddr);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('jmpf ('+i+')', function() {
      var startAddr = rnd16bit();
      var jumpLength = rnd16bit() & 0x00FF;
      var finalAddr = (startAddr + jumpLength) & 0xFFFF;
      var JDVal = rnd16bit();

      before(function() {
        dut = new Cpu();
        dut.regs[dut.regMap.JD] = JDVal;
        dut.ram[startAddr] = 0x3200 | jumpLength;
        dut.regs[dut.pci] = startAddr;
        dut.tick();
      });
      it('should contain ' + finalAddr + ' in PC', function() {
        assert.equal(dut.regs[dut.pci], finalAddr);
      });
      it('should contain ' + JDVal + ' in JD', function() {
        assert.equal(dut.regs[dut.regMap.JD], JDVal);
      });
    });

  }  

  for (i = 0; i < iterations; i++) {

    describe('jmpb ('+i+')', function() {
      var startAddr = rnd16bit();
      var jumpLength = rnd16bit() & 0x00FF;
      var finalAddr = (startAddr - jumpLength) & 0xFFFF;
      var JDVal = rnd16bit();

      before(function() {
        dut = new Cpu();
        dut.regs[dut.regMap.JD] = JDVal;
        dut.ram[startAddr] = 0x3300 | jumpLength;
        dut.regs[dut.pci] = startAddr;
        dut.tick();
      });
      it('should contain ' + finalAddr + ' in PC', function() {
        assert.equal(dut.regs[dut.pci], finalAddr);
      });
      it('should contain ' + JDVal + ' in JD', function() {
        assert.equal(dut.regs[dut.regMap.JD], JDVal);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('call0 ('+i+')', function() {
      var startAddr = rnd16bit();
      var jumpAddr = rnd16bit();
      var jumpMask = rnd16bit() & 0x00FF;
      var realMask = rnd16bit() & 0x00FF;
      var stackStart = rnd16bit();
      var stackEnd;
      var origStackValue = rnd16bit();
      var ramEnd;

      //50% of the time, make sure we get a jump
      if ((rnd16bit() & 0x1) === 0) {
        jumpMask = (~realMask) & 0x00FF;
      }

      var shouldJump = (jumpMask & realMask) === 0;
      var finalPC;
      if (shouldJump) {
        finalPC = jumpAddr;
        stackEnd = stackStart - 1;
        ramEnd = (startAddr+1) & 0xFFFF;
      } else {
        finalPC = startAddr + 1;
        stackEnd = stackStart;
        ramEnd = origStackValue;
      }  

      before(function() {
        dut = new Cpu();
        dut.regs[dut.regMap.JD] = jumpAddr;
        dut.ram[startAddr] = 0x3400 | jumpMask;
        dut.regs[dut.regMap.AF] = realMask;
        dut.regs[dut.pci] = startAddr;

        dut.regs[dut.regMap.SP] = stackStart;
        dut.ram[stackEnd] = origStackValue;

        dut.tick();
      });
      it('should contain ' + finalPC + ' in PC', function() {
        assert.equal(dut.regs[dut.pci], finalPC);
      });
      it('should contain ' + jumpAddr + ' in JD', function() {
        assert.equal(dut.regs[dut.regMap.JD], jumpAddr);
      });
      it('should contain ' + stackEnd + ' in SP', function() {
        assert.equal(dut.regs[dut.regMap.SP], stackEnd);
      });
      it('should contain ' + ramEnd + ' in RAM ' + stackEnd, function() {
        assert.equal(dut.ram[stackEnd], ramEnd);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('call1 ('+i+')', function() {
      var startAddr = rnd16bit();
      var jumpAddr = rnd16bit();
      var jumpMask = rnd16bit() & 0x00FF;
      var realMask = rnd16bit() & 0x00FF;
      var stackStart = rnd16bit();
      var stackEnd;
      var origStackValue = rnd16bit();
      var ramEnd;

      //50% of the time, make sure we get a jump
      if ((rnd16bit() & 0x1) === 0) {
        jumpMask = (~realMask) & 0x00FF;
      }

      var shouldJump = (jumpMask & realMask) !== 0;
      var finalPC;
      if (shouldJump) {
        finalPC = jumpAddr;
        stackEnd = stackStart - 1;
        ramEnd = (startAddr+1) & 0xFFFF;
      } else {
        finalPC = startAddr + 1;
        stackEnd = stackStart;
        ramEnd = origStackValue;
      }  

      before(function() {
        dut = new Cpu();
        dut.regs[dut.regMap.JD] = jumpAddr;
        dut.ram[startAddr] = 0x3500 | jumpMask;
        dut.regs[dut.regMap.AF] = realMask;
        dut.regs[dut.pci] = startAddr;

        dut.regs[dut.regMap.SP] = stackStart;
        dut.ram[stackEnd] = origStackValue;

        dut.tick();
      });
      it('should contain ' + finalPC + ' in PC', function() {
        assert.equal(dut.regs[dut.pci], finalPC);
      });
      it('should contain ' + jumpAddr + ' in JD', function() {
        assert.equal(dut.regs[dut.regMap.JD], jumpAddr);
      });
      it('should contain ' + stackEnd + ' in SP', function() {
        assert.equal(dut.regs[dut.regMap.SP], stackEnd);
      });
      it('should contain ' + ramEnd + ' in RAM ' + stackEnd, function() {
        assert.equal(dut.ram[stackEnd], ramEnd);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('ret0 ('+i+')', function() {
      var startAddr = rnd16bit();
      var jumpAddr = rnd16bit();
      var jumpMask = rnd16bit() & 0x00FF;
      var realMask = rnd16bit() & 0x00FF;
      var stackStart = rnd16bit();
      var stackEnd;
      var origStackValue = rnd16bit();
      var ramEnd;
      var JDend = rnd16bit();

      //50% of the time, make sure we get a jump
      if ((rnd16bit() & 0x1) === 0) {
        jumpMask = (~realMask) & 0x00FF;
      }

      var shouldJump = (jumpMask & realMask) === 0;
      var finalPC;
      if (shouldJump) {
        finalPC = jumpAddr;
        stackEnd = stackStart + 1;
        ramEnd = origStackValue;
      } else {
        finalPC = startAddr + 1;
        stackEnd = stackStart;
        ramEnd = jumpAddr;
      }  

      before(function() {
        dut = new Cpu();
        dut.regs[dut.regMap.JD] = JDend;
        dut.ram[startAddr] = 0x3600 | jumpMask;
        dut.regs[dut.regMap.AF] = realMask;
        dut.regs[dut.pci] = startAddr;

        dut.regs[dut.regMap.SP] = stackStart;
        dut.ram[stackEnd] = origStackValue;
        dut.ram[stackStart] = jumpAddr;

        dut.tick();
      });
      it('should contain ' + finalPC + ' in PC', function() {
        assert.equal(dut.regs[dut.pci], finalPC);
      });
      it('should contain ' + JDend + ' in JD', function() {
        assert.equal(dut.regs[dut.regMap.JD], JDend);
      });
      it('should contain ' + stackEnd + ' in SP', function() {
        assert.equal(dut.regs[dut.regMap.SP], stackEnd);
      });
      it('should contain ' + ramEnd + ' in RAM ' + stackEnd, function() {
        assert.equal(dut.ram[stackEnd], ramEnd);
      });
    });

  }

  for (i = 0; i < iterations; i++) {

    describe('int ('+i+')', function() {
      var startAddr = rnd16bit();
      var intNum = rnd16bit() & 0xF;
      var jumpAddr = intNum;
      var JDend = rnd16bit();

      before(function() {
        dut = new Cpu();
        dut.regs[dut.regMap.JD] = JDend;
        dut.ram[startAddr] = 0x3800 | (intNum << 4);
        dut.regs[dut.pci] = startAddr;
        dut.tick();
      });
      it('should contain ' + jumpAddr + ' in PC', function() {
        assert.equal(dut.regs[dut.pci], jumpAddr);
      });
      it('should contain ' + JDend + ' in JD', function() {
        assert.equal(dut.regs[dut.regMap.JD], JDend);
      });
    });

  }
  
});
*/
