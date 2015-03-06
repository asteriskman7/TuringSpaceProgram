'use strict';

var cputest = {
  cpu: undefined,
  div_cpu_info: undefined,

  init: function() {
    cputest.cpu = new Cpu();
    cputest.div_cpu_info = document.getElementById('div_cpu_info');
    
    document.getElementById('button_step').onclick = cputest.step;
    cputest.updateDisplay();

  },

  updateDisplay: function() {
    var HTML = '<pre>\n';

    HTML += 'PC: ' + cputest.cpu.pc + '\n';
    HTML += 'REGS: ' + cputest.cpu.regs.toString() + '\n';
    HTML += 'RAM: ' + cputest.cpu.ram.toString() + '\n';

    HTML += '</pre>';
    cputest.div_cpu_info.innerHTML = HTML;
  },

  step: function() {
    cputest.cpu.tick();
    cputest.updateDisplay();
  },
};

window.onload = cputest.init;

console.log('JS Loaded');
