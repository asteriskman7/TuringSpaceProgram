var assert = require('assert');
var Assembler = require('../assembler.js');

var dut = new Assembler();

var seed = Math.floor(Math.random() * 10000);  //this should be the only use of Math.random() in this file
Math.random = function() {throw "NEVER USE Math.random() IN TESTS"};
//seed = 9038;

var iterations = 1;

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

function rndSpace() {
  var result = '';
  var count = rndRange(1,4);
  var i;
  for (i = 0; i < count; i++) {
    result += rnd1bit() ? ' ' : '\t';
  }
  return result;
}

function rndStr(l) {
  var result = '';
  do {
    result = (result + ((sinrnd() + 1).toString(36).substr(2))).substr(0,l);
  } while (result.length < l);

  return result;
}

function rndTxt(l) {
  var result = '';
  do {
    result = (result + ((sinrnd() + 1).toString(36).substr(2))).substr(0,l);
  } while (result.length < l);

  var spaces = rndRange(1, Math.floor(l / 6));
  var si;
  while (spaces > 0) {
    si = rndRange(0,l-1);
    result = result.substr(0,si) + ' ' + result.substr(si+1);
    spaces--;
  }

  return result;
}

function rndRange(min, max) {
  return Math.floor(sinrnd() * (max - min + 1) + min);
}

function rndReg() {
  var regList = Object.keys(dut.regMap);
  var regIndex = rndRange(0, regList.length - 1);
  var regName = regList[regIndex];
  return {index: regIndex, name: regName};
}

function rndConst(forceMask) {
  var C = rnd16bit();
  var CVal;
  var mask; 
  var CStr;

  if (rnd1bit()) {
    //use a mask
    if (rnd1bit()) {
      //use 8 bit mask
      if (rnd1bit()) {
        mask = '.h';
        CVal = (C & 0xFF00) >> 8;
      } else {
        mask = '.l';
        CVal = C & 0xFF;
      }
    } else {
      //use 4 bit mask
      switch (rndRange(0,3)) {
        case 0: 
          mask = '.ll';
          CVal = (C & 0x000F);
          break;
        case 1:
          mask = '.lh';
          CVal = (C & 0x00F0) >> 4;
          break;
        case 2:
          mask = '.hl';
          CVal = (C & 0x0F00) >> 8;
          break;
        case 3:
          mask = '.hh';
          CVal = (C & 0xF000) >> 12;
          break;
      }
    }
  } else {
    CVal = C;
    mask = '';
  }
  //apply the forceMask to make sure CVal is not larger than the op can hold
  //console.log('pre forceMask CVal = ' + CVal);
  CVal = CVal & forceMask;

  switch (rndRange(0,3)) {
    case 0: //dec
      CStr = C.toString(10) + mask;
      //console.log('dec');
      break;
    case 1: //hex
      CStr = '0x' + C.toString(16) + mask;
      //console.log('hex');
      break;
    case 2: //ascii
      //CStr = '"'; //"this comment to fix syntax highlighting 
      if (rnd1bit() || ((C & 0xFF) < 0x20)) {
        CStr = '\\x' + ('00' + (C & 0xFF).toString(16)).substr(-2);
      } else {
        CStr = String.fromCharCode(C);
      }
      if (C > 0xFF) {
        if (rnd1bit() || ((C & 0xFF00) < 0x2000)) {
          CStr = '\\x' + ('00' + ((C & 0xFF00) >> 8).toString(16)).substr(-2) + CStr;
        } else {
          CStr = String.fromCharCode((C & 0xFF00) >> 8) + CStr;
        }
      }
      CStr = '"' + CStr + '"' + mask; 
      //console.log('ascii and C=' + C + ' and cval=' + CVal);
      break;
    case 3: //label
      CStr = ':' + rndStr(rndRange(1, 32));
      dut.labelMap = {};
      dut.labelMap[CStr] = C;
      //console.log('label ' + CStr + ' = ' + C + ' mask=' + mask);
      CStr += mask;
      //console.log('label');
      break;
  }

  //console.log('rndConst returning ' + CStr + ' with a value of ' + CVal);

  return {str: CStr, val: CVal};
}       

function rndCodeFormat(a) {
  var comment = rnd1bit() ? ';' + rndTxt(rndRange(0,64)) : '';
  var label = rnd1bit() ? rndSpace() + ':' + rndStr(rndRange(1, 32)) : '';
  var result = label + rndSpace();
  var i;
  for (i = 0; i < a.length; i++) {
    result += a[i] + rndSpace();
  }
  result += comment;
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
    before(function() {
      dut = new Assembler();
    });
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
      //don't let one of the characters be a new line
      var illegalAscii = [];
      illegalAscii[0x0A] = true;
      illegalAscii['"'.charCodeAt(0)] = true; //"fix highlighting
      var s = '';
      if (rnd1bit() | (illegalAscii[value & 0xFF] === true)) {
        s = String.fromCharCode(value & 0xFF);
      } else {
        s = '\\x' + ('00' + value.toString(16)).substr(-2);
      }
      if (value > 0xFF) {
        if (rnd1bit() | (illegalAscii[(value & 0xFF00) >> 8] === true)) {
          s = '\\x' + ('00' + ((value >> 8) & 0xFF).toString(16)).substr(-2) + s;
        } else {
          s = String.fromCharCode((value >> 8) & 0xFF) + s;
        }
      }
      //console.log('value is ' + value);
      //console.log('ascii is ' + s);
      assert.equal(dut.stringToInt('"' + s + '"' + mask), result);
    });
    it('should convert label correctly', function() {
      var label = ':' + rndStr(rndRange(1, 32));
      dut.labelMap = {};
      dut.labelMap[label] = value;
      assert.equal(dut.stringToInt(label + mask), result);
    });
  });

  var tests = [
    {
      name: 'ld',
      test: function() {
        var op = 'ld';
        var rega = rndReg();
        var regb = rndReg();
        var code = rndCodeFormat([op, rega.name, regb.name]);
        var binary = 0x0000 | (rega.index << 4) | (regb.index);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'ldl',
      test: function() {
        var op = 'ldl';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x0200 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'ldh',
      test: function() {
        var op = 'ldh';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x0300 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'ldr',
      test: function() {
        var op = 'ldr';
        var rega = rndReg();
        var regb = rndReg();
        var code = rndCodeFormat([op, rega.name, regb.name]);
        var binary = 0x0400 | (rega.index << 4) | (regb.index);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'str',
      test: function() {
        var op = 'str';
        var rega = rndReg();
        var regb = rndReg();
        var code = rndCodeFormat([op, rega.name, regb.name]);
        var binary = 0x0500 | (rega.index << 4) | (regb.index);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'ldrc',
      test: function() {
        var op = 'ldrc';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x0600 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'strc',
      test: function() {
        var op = 'strc';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x0700 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'pop',
      test: function() {
        var op = 'pop';
        var rega = rndReg();
        var code = rndCodeFormat([op, rega.name]);
        var binary = 0x0C00 | (rega.index << 4);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'push',
      test: function() {
        var op = 'push';
        var rega = rndReg();
        var code = rndCodeFormat([op, rega.name]);
        var binary = 0x0D00 | (rega.index << 4);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'ior',
      test: function() {
        var op = 'ior';
        var rega = rndReg();
        var constant = rndConst(0x000F);
        var code = rndCodeFormat([op, rega.name, constant.str]);
        var binary = 0x1000 | (rega.index << 4) | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'iow',
      test: function() {
        var op = 'iow';
        var rega = rndReg();
        var constant = rndConst(0x000F);
        var code = rndCodeFormat([op, constant.str, rega.name]);
        var binary = 0x1100 | (constant.val << 4) | rega.index;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'add',
      test: function() {
        var op = 'add';
        var rega = rndReg();
        var regb = rndReg();
        var code = rndCodeFormat([op, rega.name, regb.name]);
        var binary = 0x2000 | (rega.index << 4) | (regb.index);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'addc',
      test: function() {
        var op = 'addc';
        var rega = rndReg();
        var constant = rndConst(0x000F);
        var code = rndCodeFormat([op, rega.name, constant.str]);
        var binary = 0x2100 | (rega.index << 4) | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'sub',
      test: function() {
        var op = 'sub';
        var rega = rndReg();
        var regb = rndReg();
        var code = rndCodeFormat([op, rega.name, regb.name]);
        var binary = 0x2200 | (rega.index << 4) | (regb.index);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'subc',
      test: function() {
        var op = 'subc';
        var rega = rndReg();
        var constant = rndConst(0x000F);
        var code = rndCodeFormat([op, rega.name, constant.str]);
        var binary = 0x2300 | (rega.index << 4) | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'and',
      test: function() {
        var op = 'and';
        var rega = rndReg();
        var regb = rndReg();
        var code = rndCodeFormat([op, rega.name, regb.name]);
        var binary = 0x2400 | (rega.index << 4) | (regb.index);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'or',
      test: function() {
        var op = 'or';
        var rega = rndReg();
        var regb = rndReg();
        var code = rndCodeFormat([op, rega.name, regb.name]);
        var binary = 0x2500 | (rega.index << 4) | (regb.index);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'xor',
      test: function() {
        var op = 'xor';
        var rega = rndReg();
        var regb = rndReg();
        var code = rndCodeFormat([op, rega.name, regb.name]);
        var binary = 0x2600 | (rega.index << 4) | (regb.index);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'not',
      test: function() {
        var op = 'not';
        var rega = rndReg();
        var code = rndCodeFormat([op, rega.name]);
        var binary = 0x2700 | (rega.index << 4);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'sftr',
      test: function() {
        var op = 'sftr';
        var rega = rndReg();
        var regb = rndReg();
        var code = rndCodeFormat([op, rega.name, regb.name]);
        var binary = 0x2800 | (rega.index << 4) | (regb.index);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'sftrs',
      test: function() {
        var op = 'sftrs';
        var rega = rndReg();
        var regb = rndReg();
        var code = rndCodeFormat([op, rega.name, regb.name]);
        var binary = 0x2900 | (rega.index << 4) | (regb.index);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'sftl',
      test: function() {
        var op = 'sftl';
        var rega = rndReg();
        var regb = rndReg();
        var code = rndCodeFormat([op, rega.name, regb.name]);
        var binary = 0x2A00 | (rega.index << 4) | (regb.index);
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'jmp',
      test: function() {
        var op = 'jmp';
        var code = rndCodeFormat([op]);
        var binary = 0x3000; 
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'jmp0',
      test: function() {
        var op = 'jmp0';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x3000 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'jmp1',
      test: function() {
        var op = 'jmp1';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x3100 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'jmpf',
      test: function() {
        var op = 'jmpf';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x3200 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'jmpb',
      test: function() {
        var op = 'jmpb';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x3300 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'call0',
      test: function() {
        var op = 'call0';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x3400 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'call1',
      test: function() {
        var op = 'call1';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x3500 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'ret0',
      test: function() {
        var op = 'ret0';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x3600 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'ret1',
      test: function() {
        var op = 'ret1';
        var constant = rndConst(0x00FF);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x3700 | constant.val;
        return {code: code, result: [binary]};
      }
    },
    {
      name: 'int',
      test: function() {
        var op = 'int';
        var constant = rndConst(0x000F);
        var code = rndCodeFormat([op, constant.str]);
        var binary = 0x3800 | (constant.val << 4);
        return {code: code, result: [binary]};
      }
    },
  ];

  var testcase;
  var testNum;
  for (testNum = 0; testNum < tests.length; testNum++) {
    testcase = tests[testNum];
    for (var i = 0; i < iterations; i++) {

      describe(testcase.name + ' (' + i + ')', function() {
        var testInfo; 
        var testCode; 
        var testResult;
        var testHex;
        var rc;
        //propagate this information into this function
        var testcaseNum = testNum;
        var testcase = tests[testcaseNum];
        before (function() {
          dut = new Assembler();
          testInfo = testcase.test();
          testCode = testInfo.code;
          testResult = testInfo.result;
          testHex = arrayToHex(testResult);
          rc = dut.assemble(testCode);
        });
        it('should have correct ram', function() {
          assert.deepEqual(dut.ram, testResult); 
        });
        it('should have correct hex', function() {
          assert.equal(dut.hex, testHex);
        });

        //todo: make this work more automatically. i.e. don't require manual generation of debug array
        //it('should have debug equal to "' + testCode + '"', function() {
        //});
        
        it('should have empty return code', function() {
          assert.equal(rc, '');
        });
      });

    }
  }

});
