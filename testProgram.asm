;alternate lines to display to Device16Seg as device #1
.addr 0x0000
ldl 0x6000.l  ;set up segment for easier var access
ldh 0x6000.h
ld SEG R0
ld R1 ZERO        ;set R1 to 0
ldl :loop.l
ldh :loop.h
ld JD R0
ld R7 JD          ; store :loop into R7 for future use
:loop addc R1 1   ; R0 = R1 + 1
ld R1 R0          ; R1 = R0
subc R1 0xF      ; check if R1 < 0xF
jmp0 0x01         ; keep looping if R1 < 0xF
ldl :switchLines.l
ldh :switchLines.h
ld JD R0
call0 0           ;call :switchLines
ld R1 ZERO        ; reset R1 to 0
ld JD R7          ; load :loop back from R7
jmp               ;jump to :loop

:switchLines push R0 ;push regs used here
push R1
push R2
push R3
push R4
push R5
ldrc 0x00
ld R1 R0          ;R1 contains curLine
:curLineOne subc R1 0x01
ldl :cl1.l
ldh :cl1.h
ld JD R0
jmp1 0x01
         
ldl 0x0001.l
ldh 0x0001.h
strc 0x00         ;store new value of curLine to ram
ldrc 0x02         ;get the length of line 2 from ram
ld R1 R0          ;save line length into R1
ldl :line2.l
ldh :line2.h
ld R2 R0          ;save the line addr into R2
ldl :copyline.l
ldh :copyline.h
ld JD R0
jmp               ;jump to copyline
:cl1 ld R0 ZERO;do the curLine = 1 stuff
strc 0x00         ;store new value of curLine to ram
ldrc 0x01         ;get the length of line 1 from ram
ld R1 R0          ;save line length into R1
ldl :line1.l
ldh :line1.h 
ld R2 R0          ;save the line addr into R2

:copyline ldl :copyloop.l
ldh :copyloop.h
ld JD R0
ldl 0x01
ldh 0x00
ld R3 R0          ;save a 0x01 into R3 for loop increment
ld R4 ZERO        ;R4 will be the loop index
ldl 0x8800.l
ldh 0x8800.h
ld R5 R0          ;R5 will contain the destination address
:copyloop ldr R0 R2; load next character from ram
str R5 R0         ;store next char to device
add R2 R3 
ld R2 R0          ;store incremented line addr
add R5 R3 
ld R5 R0          ;store incremented destination address
add R4 R3 
ld R4 R0          ;store incremented loop index
sub R1 R4         ;compare line length (R1) to loop index (R4)
jmp0 0x01

:copydone pop R5  ;pop regs used here
pop R4
pop R3
pop R2
pop R1
pop R0
ret0 0            ;return to caller            
.addr 0x6000
:curLine .int 0
:line1Len .int 12
:line2Len .int 12
:line1 .ascii 24 ?H?e?l?l?o? ?W?o?r?l?d?!
:line2 .ascii 24 ?S?e?c?o?n?d? ?l?i?n?e?!'