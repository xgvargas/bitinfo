import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

/*
! to replace nodemon
see this: @rollup/plugin-run
*/

/*
! to use Babel

pnpm add -D @babel/core @babel/preset-env @rollup/plugin-babel

! save to file .babelrc.json
{
  "presets": [
    ["latest", {
      "es2015": {
        "modules": false
      }
    }]
  ],
  "plugins": ["external-helpers"]
}

! add to plugins
import babel from "@rollup/plugin-babel";

babel({ exclude: 'node_modules/**', }),
*/

export default (args) => {
    return [
        {
            input: "src/bitinfo.js",
            output: [
                { format: "cjs", file: "dist/bitinfo.js", name: "nhaca", exports: "auto" },
                { format: "cjs", file: "dist/bitinfo.min.js", exports: "auto", plugins: [terser()] },
            ],
            plugins: [
                nodeResolve(), // must be before commonjs
                commonjs(),
                json(),
            ],
            external: [], // add any peer dependence here
        },
    ];
};
