/*
 */

const parser = require("./parser");
const { createSVGWindow } = require("svgdom");
const { SVG, registerWindow } = require("@svgdotjs/svg.js");
const fs = require("fs");

//https://stackoverflow.com/a/61395050/849117
function deepAssign(target, ...sources) {
    for (const source of sources) {
        for (let k in source) {
            let vs = source[k],
                vt = target[k];
            if (Object(vs) == vs && Object(vt) === vt) {
                target[k] = deepAssign(vt, vs);
                continue;
            }
            target[k] = source[k];
        }
    }
    return target;
}

/*
input is a multiline string with the bitmap description

opt = {
    defs:   not really in use. object with definitions to present to the parser
    dev:    bool. set development mode and print some info
    html:   bool. should lib add html and body around svg tag?
    output: filename to save result or null/undef to echo to console
}
*/
module.exports = function generate(input, opt) {
    let data;

    try {
        data = parser.parse(input + "\n\n", { defs: opt.defs });
    } catch (err) {
        if (opt.html) console.log("<html><body><pre>");
        if (opt.dev) console.log(err);
        if (typeof err.format === "function") {
            console.log(err.format([{ text: input }]));
        } else {
            console.log(err);
            const p = err.location.start.offset;
            const l = err.location.start.line;
            console.log(`${"" + err} (line: ${l}): ${input.substring(p, p + 30)}`);
        }
        if (opt.html) console.log("</pre></body></html>");
        process.exit(1);
    }

    if (opt.dev) console.log(data);

    //!-----------------------------------------------
    //! svgdom fail if font-size include dimension
    //!-----------------------------------------------

    const ops = deepAssign(
        {
            scale: 1, // image scape
            //-----
            default: null,
            size: {
                start: 15,
                end: 0,
                len: 16, // number of bits
            },
            bitGap: 3,
            nibbleGap: 0, // extra gap for nibble block
            byteGap: 6, // extra gap for nibble block
            base: 0, // index start
            vertical: false,
            //-----
            boxSize: 30,
            //-----
            defHighlight: "yellow",
            defOff: "#ddd",
            background: "white",
            boxAttr: { stroke: "black", fill: "#fff" },
            lineAttr: {},
            // labelAttr: { font: "sans-serif", "font-size": "30", fill: "green" },
            posAttr: { "font-size": "15", fill: "black" },
            valueAttr: { "font-size": "16", fill: "#000", "font-weight": "bold" },
            idAttr: { "font-size": "20", fill: "black", "font-weight": "bold" },
            descrAttr: { "font-size": "16", fill: "#222" },
            legendAttr: { "font-size": "12", fill: "#222" },
        },
        data.ops
    );

    // if (opt.dev) console.log(ops);

    // bits is an array the same size of final registry with per-bit information
    const bits = new Array(ops.size.len); //.fill({});

    for (let b = 0, idx = ops.size.start; b < ops.size.len; b++, idx += ops.size.up ? 1 : -1) {
        bits[b] = { idx };
    }

    // process all declared bit and populate bits array
    for (const bit of data.bits) {
        let idPos = 0;

        for (let n = 0, b = bit.start; n < bit.len; n++, b += bit.up ? 1 : -1) {
            const i = ops.size.up ? b - ops.size.start : ops.size.start - b;

            if (i < 0 || i >= bits.length) {
                console.log(`bit out of range ${b}`);
                process.exit(5);
            }
            if (bits[i].len) {
                console.log(`duplicated bit definition ${b}`);
                process.exit(6);
            }
            const id = bit.ids && bit.ids[idPos];
            const value = bit.eq && bit.eq[idPos];
            idx = bits[i].idx;
            bits[i] = { ...bit, id, value, idx, idPos };
            idPos += 1;
        }
    }

    // add highlight information to the same bits array
    for (const high of data.highlights) {
        for (let n = 0, b = high.start; n < high.len; n++, b += high.up ? 1 : -1) {
            const i = ops.size.up ? b - ops.size.start : ops.size.start - b;

            if (i < 0 || i >= bits.length) {
                console.log(`bit out of range ${b}`);
                process.exit(8);
            }
            bits[i].color = high.color || ops.defHighlight;
        }
    }

    // if (opt.dev) console.log(bits);

    //------------------------------------

    const window = createSVGWindow();
    const document = window.document;
    registerWindow(window, document);
    const canvas = SVG(document.documentElement);

    let x = 19;
    let y = 3;

    const group = canvas.group().id("boxes");

    for (h of data.highlights) {
        if (h.descr) {
            group
                .rect(25, 16)
                .radius(2)
                .stroke("black")
                .fill(h.color || "yellow")
                .move(10, y);
            group
                .text(h.descr)
                .move(45, y - 4)
                .attr(ops.legendAttr);
            y += 20;
        }
    }

    y += 40;

    if (ops.vertical) {
        // TODO
    } else {
        for (const bit of bits) {
            // draw the squares
            const b = group.rect(ops.boxSize, ops.boxSize).radius(5).attr(ops.boxAttr).center(x, y);

            // draw bit number on top
            group
                .text("" + bit.idx)
                .attr(ops.posAttr)
                .center(x, y - ops.boxSize / 2 - 10);

            if (bit.len) {
                // draw internal value if available
                if (bit.value) group.text(bit.value).attr(ops.valueAttr).center(x, y);

                // draw ID and description when available
                let f = group
                    .text((add) => {
                        if (bit.id) add.tspan(bit.id).attr(ops.idAttr);

                        if (bit.descr) {
                            const t = add.tspan(bit.descr).attr(ops.descrAttr);
                            if (bit.id) t.dx(10);
                        }
                    })
                    .transform({ position: [x + 5, y + ops.boxSize / 2], origin: "top left", rotate: 40 });
            } else {
                if (ops.default) group.text(ops.default).attr(ops.valueAttr).center(x, y);
                b.fill(ops.defOff);
            }

            // set square color based on highlights
            if (bit.color) b.fill(bit.color);

            x += ops.boxSize + ops.bitGap;
            if (bit.idx % 4 == 0) x += ops.nibbleGap;
            if (bit.idx % 8 == 0) x += ops.byteGap;
        }
    }

    const box = group.bbox();

    addW = 15;
    addH = 0;

    canvas
        .rect(box.width + addW, box.height + addH)
        .fill(ops.background)
        .back();

    const scale = ops.scale * 0.8;

    canvas.size(box.width + addW, box.height + addH);

    canvas.translate(-(box.width * (1 - scale)), -(box.height * (1 - scale))).scale(scale);

    //------------------------------------

    const css = ``;
    // <head><style>
    // .pos {dominant-baseline:text-after-edge; text-anchor:middle}
    // .bitid {dominant-baseline:middle; text-anchor:initial; font-weight: bold;}
    // .bitvalue {dominant-baseline:middle; text-anchor:middle}
    // </style></head>
    // `;

    let result;
    if (opt.html) result = `<html>${css}<body>${canvas.svg()}</body></html>`;
    else result = canvas.svg();

    if (opt.output) fs.writeFileSync(opt.output, result);
    else console.log(result);
};
