'use strict';

function bin2hex(b) {
  var result = '';
  for (var i = 0; i < b.length; i++) {
    result += ('00' + b.charCodeAt(i).toString(16)).substr(-2) + ' ';
  }
  return result;
}

function Assembler() {
  this.ram = [];
  this.debug = [];
  this.hex = '';
  this.labelMap = {};
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
    REG_UNDEF14: 14,
    ZERO: 15
  };
}

//take a string as input, assemble and enter the result in this.ram and this.hex
//if there are any error messages, return a non-empty string describing the error
Assembler.prototype.assemble = function(code) {

  var lines = code.split("\n");
  
  var rawLine;
  var lineNum;
  var line;
  var currentLabel;
  var addr = 0xFFFF;
  var splitLine;
  var cmd;

  var rega;
  var regb;
  var constant;

  var asciiLength;
  var asciiLengthStart;
  var asciiLengthEnd;

  for (lineNum = 0; lineNum < lines.length; lineNum++) {
    rawLine = lines[lineNum];
    line = rawLine;
    currentLabel = undefined;

    line = line.replace(/^\s+/, ''); //only trim left so we don't disturb ascii directives

    if (line[0] === '.') {
      //don't want to clean a directive line immediately in case it contains formatted strings

      console.log('directive!');
      switch (line.split(/\s/)[0]) {
        case '.addr':
          line = this.cleanLine(line);
          addr = parseInt(line.split(' ')[1]);
          addr = (addr - 1) & 0xFFFF; //subtract 1 off because actual instructions will increment the addr themselves
          if (isNaN(addr)) {
            return 'ERROR: Unrecognized integer "' + line.split(' ')[1] + '" in .addr on line ' + lineNum;
          }
          break;
        case '.ascii':
          break;
        case '.hex':
          break;
        case '.int':
          break;
        default:
          return 'ERROR: Unknown directive "' + line.split(/\s/)[0] + '" found on line ' + lineNum;
      }

    } else {
      //ascii constants can be corrupted by cleanLine
      //double spaces, tabs, semicolons will all be broken
      line = this.cleanLine(line);
      //console.log('cleanLine=' + line);

      splitLine = line.split(' ');

      if (line[0] === ':') {
        //line is labeled
        currentLabel = splitLine[0];
        splitLine = splitLine.slice(1);
        if (this.labelMap[currentLabel] !== undefined) {
          return 'ERROR: Redefinition of ' + currentLabel + ' on line ' + lineNum + ' after being originally defined on line ' + labelMap[currentLabel];
        } else {
          this.labelMap[currentLabel] = addr;
        }
      }

      cmd = splitLine[0];
      rega = this.regMap[splitLine[1]]; 
      regb = this.regMap[splitLine[2]];
      constant = this.stringToInt(splitLine[1]);

      switch (cmd) {
        case 'ld':
          if ((rega === undefined) || (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x0000 | (rega << 4) | regb; 
            this.debug[addr] = rawLine;
          }
          break;
        case 'ldl':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x0200 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'ldh':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x0300 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'ldr':
          if ((rega === undefined) || (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x0400 | (rega << 4) | regb; 
            this.debug[addr] = rawLine;
          }
          break;
        case 'str':
          if ((rega === undefined) || (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x0500 | (rega << 4) | regb; 
            this.debug[addr] = rawLine;
          }
          break;
        case 'ldrc':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x0600 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'strc':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x0700 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'pop':
          if ((rega === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '')
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x0C00 | (rega << 4); 
            this.debug[addr] = rawLine;
          }
          break;
        case 'push':
          if ((rega === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '')
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x0D00 | (rega << 4); 
            this.debug[addr] = rawLine;
          }
          break;
        case 'ior':
          if ((rega === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '')
          } else {
            constant = this.stringToInt(splitLine[2]);
            if (isNaN(constant)) {
              return 'ERROR: Illegal constant "' + splitLine[2] + '" on line ' + lineNum;
            } else {
              addr = (addr + 1) & 0xFFFF;
              this.ram[addr] = 0x1000 | (rega << 4) | (constant & 0x0F); 
              this.debug[addr] = rawLine;
            }
          }
          break;
        case 'iow':
          if ((regb === undefined)) {
            //console.log('iow line=' + line);
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (regb === undefined ? splitLine[2] : '')
          } else {
            if (isNaN(constant)) {
              return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
            } else {
              addr = (addr + 1) & 0xFFFF;
              this.ram[addr] = 0x1100 | ((constant & 0x0F) << 4) | regb; 
              this.debug[addr] = rawLine;
            }
          }
          break;
        case 'add':
          if ((rega === undefined) || (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x2000 | (rega << 4) | regb; 
            this.debug[addr] = rawLine;
          }
          break;
        case 'addc':
          if ((rega === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '')
          } else {
            constant = this.stringToInt(splitLine[2]);
            if (isNaN(constant)) {
              return 'ERROR: Illegal constant "' + splitLine[2] + '" on line ' + lineNum;
            } else {
              addr = (addr + 1) & 0xFFFF;
              this.ram[addr] = 0x2100 | (rega << 4) | (constant & 0x0F); 
              this.debug[addr] = rawLine;
            }
          }
          break;
        case 'sub':
          if ((rega === undefined) || (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x2200 | (rega << 4) | regb; 
            this.debug[addr] = rawLine;
          }
          break;
        case 'subc':
          if ((rega === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '')
          } else {
            constant = this.stringToInt(splitLine[2]);
            if (isNaN(constant)) {
              return 'ERROR: Illegal constant "' + splitLine[2] + '" on line ' + lineNum;
            } else {
              addr = (addr + 1) & 0xFFFF;
              this.ram[addr] = 0x2300 | (rega << 4) | (constant & 0x0F); 
              this.debug[addr] = rawLine;
            }
          }
          break;
        case 'and':
          if ((rega === undefined) || (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x2400 | (rega << 4) | regb; 
            this.debug[addr] = rawLine;
          }
          break;
        case 'or':
          if ((rega === undefined) || (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x2500 | (rega << 4) | regb; 
            this.debug[addr] = rawLine;
          }
          break;
        case 'xor':
          if ((rega === undefined) || (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x2600 | (rega << 4) | regb; 
            this.debug[addr] = rawLine;
          }
          break;
        case 'not':
          if ((rega === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x2700 | (rega << 4); 
            this.debug[addr] = rawLine;
          }
          break;
        case 'sftr':
          if ((rega === undefined) || (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x2800 | (rega << 4) | regb; 
            this.debug[addr] = rawLine;
          }
          break;
        case 'sftrs':
          if ((rega === undefined) || (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x2900 | (rega << 4) | regb; 
            this.debug[addr] = rawLine;
          }
          break;
        case 'sftl':
          if ((rega === undefined) || (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x2A00 | (rega << 4) | regb; 
            this.debug[addr] = rawLine;
          }
          break;
        case 'jmp': 
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x3000;
          this.debug[addr] = rawLine;
          break;
        case 'jmp0':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x3000 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'jmp1':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x3100 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'jmpf':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x3200 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'jmpb':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x3300 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'call0':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x3400 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'call1':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x3500 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'ret0':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x3600 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'ret1':
          //console.log('ret1 constant "' + splitLine[1] + '" =' + constant);
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x3700 | (constant & 0xFF);
          this.debug[addr] = rawLine;
          break;
        case 'int':
          if (isNaN(constant)) {
            return 'ERROR: Illegal constant "' + splitLine[1] + '" on line ' + lineNum;
          }
          addr = (addr + 1) & 0xFFFF;
          this.ram[addr] = 0x3800 | ((constant & 0xF) << 4);
          this.debug[addr] = rawLine;
          break;
        default:
          return 'ERROR: Unknown command "' + cmd + '" on line ' + lineNum;
      }

    }

    this.genHex();

  }

  return '';
};

Assembler.prototype.cleanLine = function(line) {
  //remove all comments
  line = line.replace(/;.*/, '');

  //convert all tabs to spaces
  line = line.replace(/[\t]/g,' ');

  //collapse all spaces into single spaces
  line = line.replace(/[ ]{2,}/g,' ');

  //remove leading and trailing whitespace
  line = line.trim();

  return line;
};

Assembler.prototype.stringToInt = function(string) {
  var mask = 0xFFFF;
  var shift = 0;
  var value;
  var hex;

  //console.log('sti: ' + string);
  //console.log('in STI labelMap: ' + JSON.stringify(this.labelMap));
  if (string === undefined) {
    return NaN;
  }

  if (string.search(/\.l$/) !== -1) {
    mask = 0x00FF;
    string = string.substr(0,string.length-2);
  } else if (string.search(/\.h$/) !== -1) {
    mask = 0xFF00;
    shift = 8;
    string = string.substr(0,string.length-2);
  } else if (string.search(/\.ll$/) !== -1) {
    mask = 0x000F;
    shift = 0;
    string = string.substr(0,string.length-3);
  } else if (string.search(/\.lh$/) !== -1) {
    mask = 0x00F0;
    shift = 4;
    string = string.substr(0,string.length-3);
  } else if (string.search(/\.hl$/) !== -1) {
    mask = 0x0F00;
    shift = 8;
    string = string.substr(0,string.length-3);
  } else if (string.search(/\.hh$/) !== -1) {
    mask = 0xF000;
    shift = 12;
    string = string.substr(0,string.length-3);
  }

  //console.log('main string=' + string);
  if (string.search(/^0x[0-9a-f]{1,4}$/i) !== -1) {
    value = parseInt(string, 16);
  } else if (string.search(/^[0-9]+$/) !== -1) {
    value = parseInt(string, 10);
//} else if (string.search(/^".{1,2}"$/) !== -1) {
//  value = string.charCodeAt(1);
//  if (string.length === 4) {
//    value = (value << 8) | string.charCodeAt(2);
//  }
  } else if (string.search(/^"[^"]{1,8}"$/) !== -1) {  //"fix syntax highlighting
    //console.log('sti ascii');
    string = string.substr(1,string.length - 2);
    if (string.substr(0,2) === '\\x') {
      hex = string.substr(2,2);
      //console.log('h1=' + hex);
      if (hex.length != 2) {
        return NaN;
      }
      value = parseInt('0x' + hex, 16);
      string = string.substr(4);
      //console.log('hv=' + value + ' rs=' + string);
    } else {
      value = string.charCodeAt(0);
      string = string.substr(1);
      //console.log('a1 = ' + value + ' rs=' + string);
    }
    if (string.length > 0) {
      if (string.substr(0,2) === '\\x') {
        hex = string.substr(2,2);  
        //console.log('h2=' + hex);
        if (hex.length != 2) {
          return NaN;
        }
        value = (value << 8) | parseInt('0x' + hex, 16);
        string = string.substr(4);
      } else {
        value = (value << 8) | string.charCodeAt(0);
        string = string.substr(1);
      }
      if (string.length !== 0) {
        return NaN;
      }
    }
  } else if (string.search(/^:/) !== -1) {
    value = this.labelMap[string];
    if (value === undefined) {
      return NaN;
    }
  } else {
    //console.log('sti: OTHER');
    return NaN;
  }

  return (value & mask) >> shift;
};

Assembler.prototype.genHex = function() {
  var hex = '';
  var i;
  var aval;
  for (i = 0; i < this.ram.length; i++) {
    aval = this.ram[i] | 0;
    hex += ('0000' + aval.toString(16)).substr(-4);
  }
  this.hex = hex;
}











//only export if we're in the non-browser node environment
if (typeof window === 'undefined') {
  module.exports = Assembler;
} 

