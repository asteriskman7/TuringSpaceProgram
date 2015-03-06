var assert = require('assert');
var Cpu = require('../cpu.js');

var dut = new Cpu();

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
  });
});

