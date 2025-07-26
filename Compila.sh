#!/bin/bash
FOLDER="$( cd "$(dirname "$0")" ; pwd -P )"
cd $FOLDER/cv
pdflatex cv
biber cv
pdflatex cv
pdflatex cv
cd ..
git add .
git commit -m "Update CV"
git push origin main
kill -9 $(ps -p $(ps -p $PPID -o ppid=) -o ppid=) 