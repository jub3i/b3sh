//TODO: this should be middleware based, specified in config file and
//require()'d in
module.exports = function execLine(line, shell) {
  shell.term.sendEscChar('NEWLINE');

  //TODO: this part should be middleware based?
  //cb(key, shellState, term, next)
  if (line === 'exit') {
    return process.exit(0);
  }

  if (line === '') {
    shell.state.currentLine = '';
    shell.state.posInCurrentLine = 0;
    shell.term.setLastStatusCode(0);
    shell.drawPrompt(shell);
    return;
  }

  let args = line.split(' ');
  let command = args.shift();

  shell.term.ptyChildSpawn(command, args, (err) => {
    if (err) {
      shell.term.write(err.toString());
    }
    shell.state.currentLine = '';
    shell.state.posInCurrentLine = 0;
    shell.drawPrompt(shell);
  });

  //term.childSpawn(line, [], (err) => {
  //  if (err) {
  //    term.write(err.toString());
  //  }
  //  shellState.currentLine = '';
  //  shellState.posInCurrentLine = 0;
  //  drawPrompt(shell);
  //});
};
