;simple test program
;assume Device16Seg is device 1

.addr 0x0000
ldl :text.l
ldh :text.h
ldr R1 R0
ldl :dev1.l
ldh :dev1.h
str R0 R1

jmpf 0x00 ;infinite loop

:text .addr 0x1000
.ascii 2 ?X

:dev1 .addr 0x8800