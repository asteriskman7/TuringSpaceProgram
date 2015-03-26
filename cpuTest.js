'use strict';

var debug;


var cputest = {
  cpu: undefined,
  div_cpu_info: undefined,
  ctx: undefined,
  lastUpdateTime: new Date(),
  cpuFreq: 10,
  animationId: undefined,
  asm: undefined,
  cpuFreqMeas: 0,

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

    //cputest.cpu.ram = [0x000F, 0x0201, 0x0010, 0x0207, 0x0300, 0x00D0, 0x000F, 0x2001, 0x3000];
    
    var codeArray = [
      'ld R0 ZERO',
      'ldl 0x01',
      'ld R1 R0',
      'ldl 0x07',
      'ldh 0x00',
      'ld JD R0',
      'ld R0 ZERO',
      'add R0 R1',
      'jmp'];
      
    codeArray = [
      'ldl :loop.l;set up JD.l',
      'ldh :loop.h;set up JD.h',
      'ld JD R0; move :loop into JD',      
      'ld R0 ZERO; start with r0 at 0',
      ':loop addc R0 0x01 ;increment r0',
      'iow 0x00 R0;send r0 to device 0',
      'jmp ;jump to loop'
    ];  
    
    codeArray = [
      'ld R0 ZERO; start with r0 at 0',
      'addc R0 0x01 ;increment r0',
      'iow 0x00 R0;send r0 to device 0',
      'jmpb 0x02 ;jump to loop',
      '.addr 0x8800; device 1',
      '.ascii 24 ?H?e?l?l?o? ?W?o?r?l?d?!'
    ];
    
      
    codeArray = [
       'ldl 0x6000.l  ;set up segment for easier var access',
       'ldh 0x6000.h',
       'ld SEG R0',
       'ld R1 ZERO        ;set R1 to 0',
       'ldl :loop.l',
       'ldh :loop.h',
       'ld JD R0',
       'ld R7 JD          ; store :loop into R7 for future use',
       ':loop addc R1 1   ; R0 = R1 + 1',
       'ld R1 R0          ; R1 = R0',
       'subc R1 0xF      ; check if R1 < 0xF',
       'jmp0 0x01         ; keep looping if R1 < 0xF',
       'ldl :switchLines.l',
       'ldh :switchLines.h',
       'ld JD R0',
       'call0 0           ;call :switchLines',
       'ld R1 ZERO        ; reset R1 to 0',
       'ld JD R7          ; load :loop back from R7',
       'jmp               ;jump to :loop',
       '',
       ':switchLines push R0 ;push regs used here',
       'push R1',
       'push R2',
       'push R3',
       'push R4',
       'push R5',
       'ldrc 0x00',
       'ld R1 R0          ;R1 contains curLine',
       ':curLineOne subc R1 0x01',
       'ldl :cl1.l',
       'ldh :cl1.h',
       'ld JD R0',
       'jmp1 0x01',
       '',         
       'ldl 0x0001.l',
       'ldh 0x0001.h',
       'strc 0x00         ;store new value of curLine to ram',
       'ldrc 0x02         ;get the length of line 2 from ram',
       'ld R1 R0          ;save line length into R1',
       'ldl :line2.l',
       'ldh :line2.h',
       'ld R2 R0          ;save the line addr into R2',
       'ldl :copyline.l',
       'ldh :copyline.h',
       'ld JD R0',
       'jmp               ;jump to copyline',
       ':cl1 ld R0 ZERO;do the curLine = 1 stuff',
       'strc 0x00         ;store new value of curLine to ram',
       'ldrc 0x01         ;get the length of line 1 from ram',
       'ld R1 R0          ;save line length into R1',
       'ldl :line1.l',
       'ldh :line1.h ',
       'ld R2 R0          ;save the line addr into R2',
       '',
       ':copyline ldl :copyloop.l',
       'ldh :copyloop.h',
       'ld JD R0',
       'ldl 0x01',
       'ldh 0x00',
       'ld R3 R0          ;save a 0x01 into R3 for loop increment',
       'ld R4 ZERO        ;R4 will be the loop index',
       'ldl 0x8800.l',
       'ldh 0x8800.h',
       'ld R5 R0          ;R5 will contain the destination address',
       ':copyloop ldr R0 R2; load next character from ram',
       'str R5 R0         ;store next char to device',
       'add R2 R3 ',
       'ld R2 R0          ;store incremented line addr',
       'add R5 R3 ',
       'ld R5 R0          ;store incremented destination address',
       'add R4 R3 ',
       'ld R4 R0          ;store incremented loop index',
       'sub R1 R4         ;compare line length (R1) to loop index (R4)',
       'jmp0 0x01',
       '',
       ':copydone pop R5  ;pop regs used here',
       'pop R4',
       'pop R3',
       'pop R2',
       'pop R1',
       'pop R0',
       'ret0 0            ;return to caller',            
       '.addr 0x6000',
       ':curLine .int 0',
       ':line1Len .int 12',
       ':line2Len .int 12',
       ':line1 .ascii 24 ?H?e?l?l?o? ?W?o?r?l?d?!',
       ':line2 .ascii 24 ?S?e?c?o?n?d? ?l?i?n?e?!'
    ];
    debug = codeArray;
    
      
    var code = codeArray.join('\n');
    cputest.asm = new Assembler();
    var rc = cputest.asm.assemble(code);
    console.log('asm rc =' + rc);
    cputest.cpu.ram = cputest.asm.ram;
    
    cputest.cpu.devices[0] = new DeviceNull('DevNull-0', 0, cputest.cpu);
    cputest.cpu.devices[1] = new Device16Seg('Dev16Seg-1', 1, cputest.cpu);


    cputest.div_cpu_info = document.getElementById('div_cpu_info');
    
    document.getElementById('button_step').onclick = cputest.step;
    document.getElementById('button_run').onclick = cputest.run;
    document.getElementById('button_stop').onclick = cputest.stop;
    cputest.ctx = document.getElementById('canvas_main').getContext('2d');
    cputest.updateDisplay();
    //window.requestAnimationFrame(cputest.tick);
  },

  updateDisplay: function() {
    var i;
    var HTML = '<pre>\n';
    var pc = cputest.cpu.regs[cputest.cpu.pci];
    
    HTML += 'cpuFreq (programmed/actual): ' + cputest.cpuFreq + '/' + cputest.cpuFreqMeas + '\n';
    
    HTML += 'PC: ' + pc.toString(16) + ': ' + cputest.asm.debug[pc] + '\n';
    HTML += 'REGS: ' + cputest.cpu.regs.toString() + '\n';
    
    var regList = Object.keys(cputest.cpu.regMap);
    for (i = 0; i < regList.length; i++) {
      HTML += regList[i] + ':' + cputest.cpu.regs[cputest.cpu.regMap[regList[i]]].toString(16) + '\n';
    }
    
    //HTML += 'RAM: ' + cputest.cpu.ram.toString() + '\n';

    HTML += '</pre>';
    cputest.div_cpu_info.innerHTML = HTML;
    
    var ctx = cputest.ctx;
    ctx.clearRect(0,0,600,600);
    
    var device;
    for (i = 0; i < 16; i++) {
      device = cputest.cpu.devices[i];
      if (device !== undefined) {
        ctx.save();
        cputest.cpu.devices[i].draw(ctx, 100 * i, 0, 100, 100);
        ctx.restore();
      }      
    }
   
  },

  step: function() {
    //cputest.cpu.tick();
    //cputest.updateDisplay();
    var start = new Date().getTime();
    //var iterations = 100;
    for (var i = 0; i < iterations; i++) {
      cputest.cpu.tick();
      //should we abort if we go longer than 1/60 second?
    }
    cputest.updateDisplay();

    var end = new Date().getTime();
    var delta = end - start;
    var rate = iterations / (delta / 1000);
    console.log('delta = ' + delta + ' rate = ' + rate);
  },
  
  run: function() {
    cputest.animationId = window.requestAnimationFrame(cputest.tick);
  },
  
  stop: function() {
    window.cancelAnimationFrame(cputest.animationId);
    cputest.animationId = undefined; 
  },
  
  tick: function() {
    var curTime = new Date();
    var delta = (curTime - cputest.lastUpdateTime) / 1000;
    
    //run cpu cycles and physics
    var deltaCycles = cputest.cpuFreq * delta;
    var cycleNum;
    for (cycleNum = 0; cycleNum < deltaCycles; cycleNum++ ) {
      cputest.cpu.tick();
      //update physics
    }
    cputest.cpuFreqMeas = 1000 * deltaCycles / ((new Date()) - cputest.lastUpdateTime);
    
    //update display
    cputest.updateDisplay();
    
    cputest.animationId = window.requestAnimationFrame(cputest.tick);
    cputest.lastUpdateTime = new Date();
  },
};

var iterations = 1;

window.onload = cputest.init;

console.log('JS Loaded');
