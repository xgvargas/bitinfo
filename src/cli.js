#!/usr/bin/env node

/*
 */

const { program } = require("commander");
const { profile } = require("console");
const fs = require("fs");
const bitInfo = require("./bitinfo");

program
    .name("bitInfo")
    .description("Convert bitmap description into svg/png image")
    .version(require("../package.json").version)
    .option("--dev", "Debug data")
    .option("-i, --input <file>", "input description file")
    .option("-o, --output <file>", "output file")
    // .option("--stdin", "read input from STDIN")
    .option("--no-html", "do not add html/body/pre tags")
    .parse(process.argv);

const opt = program.opts();

if (opt.dev) console.log(opt);

let input;

if (opt.input) {
    try {
        input = fs.readFileSync(opt.input).toString();
    } catch (err) {
        console.log("" + err);
        process.exit(3);
    }
}

// if (!input && opt.stdin) {
//     input = fs.readFileSync("/dev/stdin").toString();
// }

if (process.env.DEFBITINFO) {
    input = `
;scale 1

size 32
6 bola =X "descrip"
2 ovo gray

background #ded

14..11 z1,z2,z3,z4 "id"
highlight 14..11 green "unit id"

4..3 A,B =00 "oi"

highlight 6 red "some other stuff"

highlight 7 #88f "this bit should be ignored"


21..18 SCLK,SDI,SDO,SEL=CX?Z "spi interface" orange
;15..13 a,b,c=0Xx "bunda"

;12 bola =? "meleca este vai ter uma texto MUITO mais longo"
;7..5  A, B, C =x01 "isso faz alguma coisa"
;0 xubaca "this one has a long descrasdada"

; highlight 6 red
; highlight 15..12 #8ff
highlight 3..4 "meu ovo is a very very very long text that may change box size"
;nibbleGap 4
;byteGap 12
`;
}

if (!input) {
    console.log("No description input");
    process.exit(4);
}

bitInfo(input, opt);
