import CMS from "netlify-cms-app";
import PagePreview from "./preview-templates/page-preview";
import PostPreview from "./preview-templates/post-preview";
import styles from "../../static/css/preview.css";

CMS.registerPreviewTemplate("pages", PagePreview);
CMS.registerPreviewTemplate("posts", PostPreview);
CMS.registerPreviewStyle(styles.toString(), { raw: true });