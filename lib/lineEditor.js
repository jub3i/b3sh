let hex2key = require('./hex2key.js');

module.exports = function lineEditor(hex, shell) {
  //TODO: this part should be configurable, loaded via require() or something
  let key = hex2key(hex);

  //TODO: this part should be middleware based?
  //cb(key, shell.state, term, execLine next)
  if (key === 'CTRL_C') {
    shell.term.setLastStatusCode(1);
    shell.state.currentLine = '';
    shell.state.posInCurrentLine = '';
    shell.term.sendEscChar('NEWLINE');
    shell.drawPrompt(shell);
  } else if (key === 'CR') {
    shell.execLine(shell.state.currentLine, shell);
  } else if (key === 'DEL') {
    if (shell.state.posInCurrentLine > 0) {
      shell.state.currentLine = shell.state.currentLine.slice(0, shell.state.currentLine.length - 1);
      shell.term.sendEscChar('BACKSPACE');
      shell.state.posInCurrentLine -= 1;
    }
  } else if (key === 'LEFT') {
    if (shell.state.posInCurrentLine > 0) {
      shell.term.sendEscChar('CURSOR_LEFT');
      shell.state.posInCurrentLine -= 1;
    }
  } else if (key === 'RIGHT') {
    if (shell.state.posInCurrentLine < shell.state.currentLine.length) {
      shell.term.sendEscChar('CURSOR_RIGHT');
      shell.state.posInCurrentLine += 1;
    }
  } else {
    if (shell.state.posInCurrentLine === shell.state.currentLine.length) {
      shell.state.currentLine += key;
      shell.term.sendEscChar('NORMAL_MODE');
      shell.term.write(key);
    } else {
      shell.state.currentLine =
        shell.state.currentLine.slice(0, shell.state.posInCurrentLine) +
        key +
        shell.state.currentLine.slice(shell.state.posInCurrentLine);
      shell.term.sendEscChar('INSERT_MODE');
      shell.term.write(key);
    }
    shell.state.posInCurrentLine += 1;
  }
};
