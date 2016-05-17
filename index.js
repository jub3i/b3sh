'use strict';

let shell = {
  state: {
    currentLine: '',
    posInCurrentLine: 0,
  },
  term: require('./lib/termkit.js')(process),

  drawPrompt: require('./lib/drawPrompt.js'),
  lineEditor: require('./lib/lineEditor.js'),
  execLine: require('./lib/execLine.js'),
};

if (!shell.term.isTTY()) {
  shell.term.writeErr('Must run from a TTY process. Exiting.');
  process.exit(1);
}

// init
shell.term.setWindowTitle('b3sh v0.1');
shell.term.listen(listenFn);
shell.drawPrompt(shell);

function listenFn(hex) {
  shell.lineEditor(hex, shell);
}

// debug
shell.term.onResize((h, w) => {
  shell.term.write(`screen size has changed to ${h} x ${w} \(height x width\)!\n`);
});

// debug
process.on('error', () => {
  console.log('event:error');
  //console.log(arguments);
});

// debug
process.on('close', () => {
  console.log('event:close');
  //console.log(arguments);
});

// debug
process.on('exit', () => {
  console.log('event:exit');
  //console.log(arguments);
});
