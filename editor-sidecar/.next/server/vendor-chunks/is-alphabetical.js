"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-alphabetical";
exports.ids = ["vendor-chunks/is-alphabetical"];
exports.modules = {

/***/ "(ssr)/../node_modules/is-alphabetical/index.js":
/*!************************************************!*\
  !*** ../node_modules/is-alphabetical/index.js ***!
  \************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   isAlphabetical: () => (/* binding */ isAlphabetical)\n/* harmony export */ });\n/**\n * Check if the given character code, or the character code at the first\n * character, is alphabetical.\n *\n * @param {string|number} character\n * @returns {boolean} Whether `character` is alphabetical.\n */\nfunction isAlphabetical(character) {\n  const code =\n    typeof character === 'string' ? character.charCodeAt(0) : character\n\n  return (\n    (code >= 97 && code <= 122) /* a-z */ ||\n    (code >= 65 && code <= 90) /* A-Z */\n  )\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vbm9kZV9tb2R1bGVzL2lzLWFscGhhYmV0aWNhbC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLGVBQWU7QUFDMUIsYUFBYSxTQUFTO0FBQ3RCO0FBQ087QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi4vbm9kZV9tb2R1bGVzL2lzLWFscGhhYmV0aWNhbC9pbmRleC5qcz9iZmM3Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIGNoYXJhY3RlciBjb2RlLCBvciB0aGUgY2hhcmFjdGVyIGNvZGUgYXQgdGhlIGZpcnN0XG4gKiBjaGFyYWN0ZXIsIGlzIGFscGhhYmV0aWNhbC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGNoYXJhY3RlclxuICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgYGNoYXJhY3RlcmAgaXMgYWxwaGFiZXRpY2FsLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNBbHBoYWJldGljYWwoY2hhcmFjdGVyKSB7XG4gIGNvbnN0IGNvZGUgPVxuICAgIHR5cGVvZiBjaGFyYWN0ZXIgPT09ICdzdHJpbmcnID8gY2hhcmFjdGVyLmNoYXJDb2RlQXQoMCkgOiBjaGFyYWN0ZXJcblxuICByZXR1cm4gKFxuICAgIChjb2RlID49IDk3ICYmIGNvZGUgPD0gMTIyKSAvKiBhLXogKi8gfHxcbiAgICAoY29kZSA+PSA2NSAmJiBjb2RlIDw9IDkwKSAvKiBBLVogKi9cbiAgKVxufVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/../node_modules/is-alphabetical/index.js\n");

/***/ })

};
;