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
    ZERO: 15
  };
}

//take a string as input, assemble and enter the result in this.ram and this.hex
//if there are any error messages, return a non-empty string describing the error
Assembler.prototype.assemble = function(code) {

  var lines = code.split("\n");
  
  var lineNum;
  var line;
  var currentLabel;
  var addr = 0xFFFF;
  var splitLine;
  var cmd;

  var rega;
  var regb;
  var constant;

  for (lineNum = 0; lineNum < lines.length; lineNum++) {
    line = lines[lineNum];
    currentLabel = undefined;

    if (line[0] === '.') {
      //don't want to clean a directive line immediately in case it contains formatted strings
    } else {
      line = this.cleanLine(line);

      splitLine = line.split(' ');

      if (line[0] === ':') {
        //line is labeled
        currentLabel = splitLine[0];
        splitLine = splitLine.slice(1);
        if (labelMap[currentLabel] !== undefined) {
          return 'ERROR: Redefinition of ' + currentLabel + ' on line ' + line + ' after being originally defined on line ' + labelMap[currentLabel];
        } else {
          labelMap[currentLabel] = addr;
        }
      }

      cmd = splitLine[0];
      rega = this.regMap[splitLine[1]]; 
      regb = this.regMap[splitLine[2]];
      constant = splitLine[1];

      switch (cmd) {
        case 'ld':
          if ((rega === undefined) && (regb === undefined)) {
            return 'ERROR: Unknown register use on line ' + lineNum + ': ' + (rega === undefined ? splitLine[1] : '') + ' ' + (regb === undefined ? splitLine[2] : '');
          } else {
            addr = (addr + 1) & 0xFFFF;
            this.ram[addr] = 0x0000 | (rega << 4) | regb; 
          }
          break;
        case 'ldl':
          rega = reg

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

  return line;
};

Assembler.prototype.stringToInt = function(string) {
  var mask = 0xFFFF;
  var shift = 0;
  var value;

  if (string.search(/\.l$/) !== -1) {
    mask = 0x00FF;
    string = string.split('.')[0];
  } else if (string.search(/\.h$/) !== -1) {
    mask = 0xFF00;
    shift = 8;
    string = string.split('.')[0];
  }


  if (string.search(/^0x[0-9a-f]{1,4}$/i) !== -1) {
    value = parseInt(string, 16);
  } else if (string.search(/^[0-9]+$/) !== -1) {
    value = parseInt(string, 10);
  } else if (string.search(/^".{1,2}"$/) !== -1) {
    value = string.charCodeAt(1);
    if (string.length === 4) {
      value = (value << 8) | string.charCodeAt(2);
    }
  } else if (string.search(/^:/) !== -1) {
    value = this.labelMap[string];
    if (value === undefined) {
      return NaN;
    }
  } else {
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

