'use strict';

var cputest = {
  cpu: undefined,
  div_cpu_info: undefined,

  init: function() {
    cputest.cpu = new Cpu();
//    cputest.cpu.ram[0] = 0x3000;
//    cputest.cpu.regs[cputest.cpu.regMap.JD] = 0;


    /*
    0: load 0 into r0    ld R0 ZERO       0x000F
    1: load 1 into r1    ldl 0x01         0x0201
    2:                   ld R1 R0         0x0010
    3: add r0 and r1     ldl 0x07         0x0207
                         ldh 0x00         0x0300
                         ld JD R0         0x00D0
                         ld R0 ZERO       0x000F
    4: jump to 3         add R0 R1        0x2001
    5:                   jmp              0x3000
    */

    cputest.cpu.ram = [0x000F, 0x0201, 0x0010, 0x0207, 0x0300, 0x00D0, 0x000F, 0x2001, 0x3000];


    cputest.div_cpu_info = document.getElementById('div_cpu_info');
    
    document.getElementById('button_step').onclick = cputest.step;
    cputest.updateDisplay();

  },

  updateDisplay: function() {
    var HTML = '<pre>\n';

    HTML += 'PC: ' + cputest.cpu.regs[cputest.cpu.pci] + '\n';
    HTML += 'REGS: ' + cputest.cpu.regs.toString() + '\n';
    HTML += 'RAM: ' + cputest.cpu.ram.toString() + '\n';

    HTML += '</pre>';
    cputest.div_cpu_info.innerHTML = HTML;
  },

  step: function() {
    //cputest.cpu.tick();
    //cputest.updateDisplay();
    var start = new Date().getTime();
    //var iterations = 100;
    for (var i = 0; i < iterations; i++) {
      cputest.cpu.tick();
    }
    cputest.updateDisplay();

    var end = new Date().getTime();
    var delta = end - start;
    var rate = iterations / (delta / 1000);
    console.log('delta = ' + delta + ' rate = ' + rate);
  },
};

var iterations = 100;

window.onload = cputest.init;

console.log('JS Loaded');
