AS = aarch64-linux-android35-clang -x assembler
LD = ld.lld

TARGETS = asmdemo

$(TARGETS:%=run%): run%: %
	adb push $^ /data/local/tmp
	adb shell chmod +x /data/local/tmp/$^
	adb shell '/data/local/tmp/$^; echo exit code: $$?'


$(TARGETS): %: %.o
	$(LD) $^ -o $@

$(TARGETS:%=%.o): %.o: %.s
	$(AS) -c $^ -o $@

clean:
	rm -f $(TARGETS) *.o
