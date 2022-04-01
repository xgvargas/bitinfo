/*
https://eslint.vuejs.org/rules/
*/

module.exports = {
    parserOptions: { ecmaVersion: "latest" },
    env: {
        node: true,
        "vue/setup-compiler-macros": true,
    },
    extends: ["eslint:recommended", "plugin:vue/vue3-recommended", "prettier"],
    rules: {
        "vue/component-tags-order": [
            "warn",
            {
                order: ["docs", "template", "style", "script"],
            },
        ],
    },
};
