/*
This is a multiline comment.
"string within comment"
'singlequote string within comment'
// comment within comment
label: within comment
"label:"

*/

.text

.global _start
_start:
    mov x0, #1
    ldr x1, =helloWorldStr
    ldr x2, =helloWorldStrLen
    mov x8, #64
    svc #0

    ldr x0, =$stringWith_Weird_Name
    bl printString // This comment detects correctly now

    mov x0, #123
    mov x8, #93 
    svc #0

printString: // x0: ptr to null-terminated string
    
    mov X1, #0
strlenLoop: // "comment with string:"
    LDRB W2, [x0, X1] // case insensitive registers
    cmp w2, #0
    beq strlenDone
    add x1, x1, #1
    b strlenLoop

strlenDone: 

    mov x2, X1
    mov x1, x0
    mov x0, #1
    mov x8, #64
    svc #0

    ret

.data

helloWorldStr: 
    .asciz "Hello World!\n"
helloWorldStrLen = . - helloWorldStr

 $stringWith_Weird_Name : .asciz "This string has a very strange label\n"
