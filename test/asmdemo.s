/*
This is a multiline comment.
"string within comment"
'singlequote string within comment'
// comment within comment
label: within comment
"label:"
.directive within comment
*/

.text

.global _start
_start:
    mov x0, #1
    ldr x1, = helloWorldStr
    ldr x2, =helloWorldStrLen
    mov x8, #(32 * 2) // This comment should be detected
    svc #0

    ldr x0, =$stringWith_Weird_Name // This comment // should be detected
    ldr x0, =$stringWith_Weird_Name /* This comment should // also be detected */
    ldr x0, =$stringWith_Weird_Name /* This comment should also be detected 
        and the comment should continue onto future lines
    */

    # If the first character in a line is #, it should be a comment
# This is the case regardless of whitespace

    bl printString // This comment detects correctly now

    ldr x0, =('a' + 3) // equalsignliteral with character math followed by comment
    bl printCharacter 

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

printCharacter:
    ldr x1, = CharPrintBuffer
    strb w0, [x1]

    ldr x0, = -1 + 2 // 1
    mov x2, #1; mov x8, #64 // two statements one line
    svc #0
    ret

.data

helloWorldStr: 
    .asciz "Hello World!\n"
helloWorldStrLen = . - helloWorldStr

 $stringWith_Weird_Name : .asciz "This .string: has a very strange label\n"

    CharPrintBuffer: .skip 1
