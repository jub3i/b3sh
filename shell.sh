#!/bin/bash

#for use in running gnome-terminal with n at custom location
#gnome command: /bin/bash /home/jubei/projects/experiments/b3sh/shell.sh
export N_PREFIX=$HOME/NODEJS
/home/jubei/NODEJS/node_modules/n/bin/n io use 2.0.0 --harmony_arrow_functions ~/projects/experiments/b3sh/index.js
