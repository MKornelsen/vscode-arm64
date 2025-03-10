#!/bin/bash

aarch64-linux-android35-clang -x assembler -c asmdemo.s -o asmdemo.o
ld.lld asmdemo.o -o asmdemo

adb push asmdemo /data/local/tmp
adb shell chmod +x /data/local/tmp/asmdemo
adb shell /data/local/tmp/asmdemo
