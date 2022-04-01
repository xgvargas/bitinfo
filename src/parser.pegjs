/*
! This parser uses PEG from peggyjs. it does not work with pegjs
*/

{
  input += "\n\n";

  const highlights = [];
  const bits = [];
  const ops = {};
}

info = _ items? _ { return { ops, bits, highlights }; }

items = h:element t:(_ @element)* { return [h, ...t]; }

element
  = option
  / bits
  / "highlight" ws r:range color:(ws @color)? descr:(ws @quoteStr)? _eol { highlights.push({ ...r, color, descr }); }

bits
  = r:range ids:(ws @commaStr)? eq:(_ "=" _ @$value+)? descr:(ws @quoteStr)? color:(ws @color)? _eol {
      if (eq && eq.length != r.len) error("wrong values count");
      if (ids && ids.length != r.len) error("wrong ids count");
      const _eq = eq && eq.toUpperCase();
      bits.push({ descr, ids, ...r, eq: _eq, color});
    }

option
  = "scale" ws o:(float / num) _eol { ops.scale = o; }
  / "size" ws o:size { ops.size = o; }
  / "bitGap" ws o:int _eol { ops.bitGap = o; }
  / "nibbleGap" ws o:int _eol { ops.nibbleGap = o; }
  / "byteGap" ws o:int _eol { ops.byteGap = o; }
  //   / "dir" ws o:("up" / "down" / "left" / "right") _eol { ops.dir = o; }
  / "vertical" ws o:bool _eol { ops.scale = o; }
  / "default" ws v:value _eol {ops.default = v}
  / "background" ws c:color _eol {ops.background = c}

range
  = start:int ".." end:int { return { start, end, len: start > end ? start - end + 1 : end - start + 1, up: end > start }; }
  / start:int { return { start, end: start, len: 1, up: false }; }

size
  = start:int ".." end:int { return { start, end, len: start > end ? start - end + 1 : end - start + 1, up: end > start }; }
  / n:num { return { start: n - 1, end: 0, len: n, up: false }; }

//   dP
//   88
// d8888P dP    dP  88d888b. .d8888b. .d8888b.
//   88   88    88  88'  `88 88ooood8 Y8ooooo.
//   88   88.  .88  88.  .88 88.  ...       88
//   dP   `8888P88  88Y888P' `88888P' `88888P'
// oooooooo~~~~.88~~88~oooooooooooooooooooooooo
//         d8888P   dP

color
  = str
  / "#" [0-9a-f]i [0-9a-f]i [0-9a-f]i { return text(); }

value = [01X?CZ]i

float = [+-]? int? "." [0-9]+ { return +text(); }

bool
  = ("yes"i / "true"i / "1") { return true; }
  / ("no"i / "false"i / "0") { return false; }

int "number" = ("0" / num) { return +text(); }

num "number" = [1-9] [0-9]* { return +text(); }

str "string" = $([a-z_]i [a-z0-9_]i*)

quoteStr "quoted string" = "\"" text:$[^"\n]* "\"" { return text; }

commaStr = h:str t:(_ "," _ @str)* { return [h, ...t]; }

// dP                         oo
// 88
// 88d888b. .d8888b. .d8888b. dP .d8888b. .d8888b.
// 88'  `88 88'  `88 Y8ooooo. 88 88'  `"" Y8ooooo.
// 88.  .88 88.  .88       88 88 88.  ...       88
// 88Y8888' `88888P8 `88888P' dP `88888P' `88888P'
// oooooooooooooooooooooooooooooooooooooooooooooooo

eol "new line" = [\n\r]

space "space" = [\t\v\f\u0020]

comment = ";" (!eol .)* { null; }

_eol = (space / comment)* eol { null; }

ws = space+ { null; }

_ = (eol / space / comment)* { null; }

__ = (eol / space / comment)+ { null; }

// oo

// dP .d8888b. .d8888b. 88d888b.
// 88 Y8ooooo. 88'  `88 88'  `88
// 88       88 88.  .88 88    88
// 88 `88888P' `88888P' dP    dP
// 88~ooooooooooooooooooooooooooo
// dP

// json = _ @$obj _

// obj = "{" (inner/obj)* "}"

// inner = (!"}" !"{" @.)

// _ = [ \t\n\r]* {null}

// __ = [ \t\n\r]+ {null}
