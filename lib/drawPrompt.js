//TODO: this should be configurable in options
module.exports = function drawPrompt(shell) {
  shell.term.write('$ [' + shell.term.getLastStatusCode() + '] > ');
};
