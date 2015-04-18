'use strict';

var main = {
  state: undefined,
  cpuFreq: 10,
  ctx: undefined,
  cpu: undefined,
  asm: undefined,
  physics: undefined,
  textarea_code: undefined,
  textarea_log: undefined,
  div_linenumbers: undefined,
  stopFlag: false,
  level: undefined,
  lastTick: 0,
  deltaCycles: 0,
  init: function() {
    console.log('main.init');
    
    main.loadState();
    
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
    
    document.getElementById('button_run').onclick = main.run;
    document.getElementById('button_assemble').onclick = main.assemble;
    document.getElementById('button_stop').onclick = main.stop;
    document.getElementById('button_step').onclick = main.step;
    
    //set up game
    main.cpu = new Cpu();
    main.physics = new Physics();
    main.loadLevel(main.state.level);
    
    main.updateDisplay();
    
  },
  
  loadDefaultState: function() {
    main.state = {
      level: 'level2',
      code: {}
    };
  },
  
  loadState: function() {
    var key;
    var loadedState = JSON.parse(localStorage.getItem('state'));
    main.loadDefaultState();
    for (key in loadedState) {
      main.state[key] = loadedState[key];
    }
  },
  
  saveState: function() {
    var jsonState = JSON.stringify(main.state);
    localStorage.clear();
    localStorage.setItem('state', jsonState);    
  },
  
  log: function(s) {
    if (main.textarea_log.value.length !== 0) {
      main.textarea_log.value += '\n' + s;
    } else {
      main.textarea_log.value += s;
    }
  },
  
  loadLevel: function(levelName) {
    main.state.level = levelName;
    main.level = new levels[levelName](main.cpu, main.physics);
    main.level.init();
    document.getElementById('div_level_name').innerHTML = levelName;    
    var levelCode = main.state.code[main.state.level];
    if (levelCode === undefined) {
      levelCode = '';
    }
    main.textarea_code.value = levelCode;        
  },
  
  assemble: function() {
    var code = main.textarea_code.value;
    main.state.code[main.state.level] = code;
    main.saveState();
    main.asm = new Assembler();
    var rc = main.asm.assemble(code);
    if (rc.length === 0) {
      rc = 'SUCCESS';
    }
    main.log('Assembly Result: ' + rc);
    
    main.cpu.reset();
    main.cpu.ram = main.asm.ram;
    main.level.postAsm();
  },
  
  updateDisplay: function() {
    var i;
    var ctx = main.ctx;
    ctx.clearRect(0,0,600,600);    
    
    ctx.save();
    ctx.translate(0, 200);
    main.physics.draw(ctx, 400, 400);
    ctx.restore();    
    
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
    
  },
  
  run: function() {
    main.stopFlag = false;
    window.requestAnimationFrame(main.tick);
    main.lastTick = 0;
    main.deltaCycles = 0;
  },
  
  stop: function() {
    main.stopFlag = true;
    main.dumpCpu();
    main.lastTick = 0;
  },
  
  step: function() {
    var checkValue;
    main.cpu.tick();
    main.physics.tick(1 / (main.cpuFreq));
    checkValue = main.level.check();
    main.updateDisplay();    
    main.dumpCpu();
    if (checkValue > 0) {
      main.log('SUCCESS');
    } else if (checkValue < 0) {
      main.lg('FAILURE');
    }
  },
  
  dumpCpu: function() {
    var html = '';
    var pc = main.cpu.regs[main.cpu.regMap.PC];
    
    var e = document.getElementById('div_pc_instr');
    e.innerHTML = 'PC: ' + pc.toString(16) + ': ' + main.asm.debug[pc];
    e.title = main.asm.debug[pc];
    
    //html += 'PC: ' + pc.toString(16) + ': ' + main.asm.debug[pc] + '<br>';
    
        
    var regList = Object.keys(main.cpu.regMap);
    var i;
    for (i = 0; i < regList.length; i++) {
      html += regList[i] + ':' + main.cpu.regs[main.cpu.regMap[regList[i]]].toString(16) + '<br>';
    }
    
    document.getElementById('div_cpu_info').innerHTML = html;
  },
  
  tick: function() {
    var checkValue = 0;
    var curTime = new Date();
    //deltaTime is in seconds
    var deltaTime = (curTime - main.lastTick) / 1000;
    deltaTime = Math.min(deltaTime, 1/60);
    //todo: run the correct amount of cpu and physics ticks
    
    if (!main.stopFlag) {
      main.deltaCycles += main.cpuFreq * deltaTime;
      var curDeltaCycles = Math.floor(main.deltaCycles);
      var i;
      for (i = 0; i < curDeltaCycles; i++) {
        main.cpu.tick();
        main.physics.tick(1/main.cpuFreq);
        checkValue = main.level.check();
        if (checkValue !== 0) {
          break;
        }
      }
      main.deltaCycles -= curDeltaCycles;
      main.updateDisplay();
      //main.dumpCpu();
      if (checkValue === 0) {
        main.lastTick = new Date();
        window.requestAnimationFrame(main.tick);
      } else {
        main.stopFlag =  true;
        main.lastTick = 0;
        if (checkValue > 0) {
          main.log("SUCCESS");
        } else {
          main.log("FAILURE");
        }
      }
    }
  }
};

window.onload = main.init;
