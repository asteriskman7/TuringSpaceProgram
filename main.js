'use strict';

var main = {
  cpuFreq: 10,
  ctx: undefined,
  cpu: undefined,
  asm: undefined,
  physics: undefined,
  textarea_code: undefined,
  textarea_log: undefined,
  div_linenumbers: undefined,
  stop: false,
  init: function() {
    console.log('main.init');
    
    //save commonly used elements
    main.textarea_code = document.getElementById('textarea_code');
    main.textarea_log = document.getElementById('textarea_log');
    main.div_linenumbers = document.getElementById('div_linenumbers');
    main.ctx = document.getElementById('canvas_simulation').getContext('2d');
    
    //setup line numbers for code input window
    var i;
    var lineHTML = '';
    for (i = 1; i < 1000; i++) {
      lineHTML += i + '<br>';
    }
    main.div_linenumbers.innerHTML = lineHTML;
    
    //set up callbacks
    main.textarea_code.onscroll = function() {
      main.div_linenumbers.style.top = -(main.textarea_code.scrollTop - 3) + 'px';
      return true;
    };
    main.textarea_code.onkeyup = function() {
      main.div_linenumbers.style.top = -(main.textarea_code.scrollTop - 3) + 'px';
    };
    
    //set up game
    main.cpu = new Cpu();
    for (i = 0; i < 16; i++) {
      main.cpu.devices[i] = new DeviceNull('DevNull-' + i, i, main.cpu);
    }

    main.cpu.devices[1] = new Device16Seg('Dev16Seg-1', 1, main.cpu);
    
    
    main.physics = new Physics();
    
    main.updateDisplay();
    
    console.log('use main.assemble() and then main.tick() to run since there are no buttons yet.')
  },
  
  log: function(s) {
    if (main.textarea_log.value.length !== 0) {
      main.textarea_log.value += '\n' + s;
    } else {
      main.textarea_log.value += s;
    }
  },
  
  assemble: function() {
    var code = main.textarea_code.value;
    main.asm = new Assembler();
    var rc = main.asm.assemble(code);
    if (rc.length === 0) {
      rc = 'SUCCESS';
    }
    main.log('Assembly Result: ' + rc);
    console.log('asm rc = ' + rc);
    main.cpu.ram = main.asm.ram;
  },
  
  updateDisplay: function() {
    var i;
    var ctx = main.ctx;
    ctx.clearRect(0,0,600,600);
    
    var device;
    var deviceLocations = {
      0: [0,0],
      1: [200,0],
      2: [400,0],
      3: [400,200],
      4: [400,400]
    };
    var deviceLocation;
    for (i = 0; i < 16; i++) {
      device = main.cpu.devices[i];
      deviceLocation = deviceLocations[i];
      if (device !== undefined && deviceLocation !== undefined) {
        ctx.save();
        ctx.translate(deviceLocation[0], deviceLocation[1]);
        main.cpu.devices[i].draw(ctx, 200, 200);
        ctx.restore();
      }      
    }
    
    ctx.save();
    ctx.translate(0, 200);
    main.physics.draw(ctx, 400, 400)
    ctx.restore();
  },
  
  step: function() {
    main.cpu.tick();
    main.physics.tick(1);
    main.updateDisplay();    
  },
  
  dumpCpu: function() {
    var html = '';
    var pc = main.cpu.regs[main.cpu.regMap.PC];
    html += 'PC: ' + pc.toString(16) + ': ' + main.asm.debug[pc] + '<br>';
        
    var regList = Object.keys(main.cpu.regMap);
    var i;
    for (i = 0; i < regList.length; i++) {
      html += regList[i] + ':' + main.cpu.regs[main.cpu.regMap[regList[i]]].toString(16) + '<br>';
    }
    
    document.getElementById('div_cpu_info').innerHTML = html;
  },
  
  tick: function() {
    //todo: run the correct amount of cpu and physics ticks
    if (!main.stop) {
      main.cpu.tick();
      main.physics.tick(1);
      main.updateDisplay();
      window.requestAnimationFrame(main.tick);
    }
  }
};

window.onload = main.init;
