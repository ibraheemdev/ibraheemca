"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const PostPreview = ({ entry, widgetFor }) => {
    const body = widgetFor("body");
    const title = entry.getIn(["data", "title"]);
    return (react_1.default.createElement("div", { className: "content" },
        react_1.default.createElement("h1", { className: "content__title" }, title),
        react_1.default.createElement("div", { className: "content__body" }, body)));
};
exports.default = PostPreview;
