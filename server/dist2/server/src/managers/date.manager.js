"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateHistory = exports.formatDateTag = exports.formatDateNewNote = void 0;
exports.formatDateNewNote = (d) => {
    var datestring = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " at " +
        d.getHours() + "h" + d.getMinutes();
    return datestring;
};
exports.formatDateTag = (d) => {
    var datestring = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + "--" +
        d.getHours() + "h-" + d.getMinutes() + 'm';
    return datestring;
};
// minutes => change every 10m
exports.formatDateHistory = (d) => {
    var datestring = d.getFullYear() + "" + (d.getMonth() + 1) + "" + d.getDate() + "-" +
        d.getHours() + "h" + Math.round(new Date().getMinutes() / 10);
    return datestring;
};
