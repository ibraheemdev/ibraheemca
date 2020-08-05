"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const netlify_cms_app_1 = __importDefault(require("netlify-cms-app"));
const page_preview_1 = __importDefault(require("./preview-templates/page-preview"));
const post_preview_1 = __importDefault(require("./preview-templates/post-preview"));
const preview_css_1 = __importDefault(require("../../static/css/preview.css"));
netlify_cms_app_1.default.registerPreviewTemplate("pages", page_preview_1.default);
netlify_cms_app_1.default.registerPreviewTemplate("posts", post_preview_1.default);
netlify_cms_app_1.default.registerPreviewStyle(preview_css_1.default.toString(), { raw: true });
