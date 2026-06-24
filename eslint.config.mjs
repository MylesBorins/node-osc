import globals from "globals";
import pluginJs from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  {
    files: ['lib/**/*.mjs'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': ['error', {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          ClassDeclaration: true,
          MethodDefinition: true,
        }
      }]
    }
  }
];
