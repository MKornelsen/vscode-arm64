@echo off

call aarch64-linux-android33-clang -x assembler -c asmdemo.s -o asmdemo.o
call ld asmdemo.o -o asmdemo

adb push asmdemo /data/local/tmp
adb shell chmod +x /data/local/tmp/asmdemo
adb shell "/data/local/tmp/asmdemo; echo exit code: $?"
