"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lengthObj = void 0;
exports.lengthObj = (obj) => {
    let nb = 0;
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            nb++;
        }
    }
    return nb;
};
