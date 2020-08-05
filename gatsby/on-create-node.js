"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kebabCase = require("lodash.kebabcase");
const { createFilePath } = require("gatsby-source-filesystem");
const onCreateNode = ({ node, actions, getNode }) => {
    const { createNodeField } = actions;
    if (node.internal.type === "MarkdownRemark") {
        if (typeof node.frontmatter.slug !== "undefined") {
            const dirname = getNode(node.parent).relativeDirectory;
            createNodeField({
                node,
                name: "slug",
                value: `/${dirname}/${node.frontmatter.slug}`,
            });
        }
        else {
            const value = createFilePath({ node, getNode });
            createNodeField({
                node,
                name: "slug",
                value,
            });
        }
        if (node.frontmatter.tags) {
            const tagSlugs = node.frontmatter.tags.map((tag) => `/tag/${kebabCase(tag)}/`);
            createNodeField({ node, name: "tagSlugs", value: tagSlugs });
        }
        if (node.frontmatter.mainTag) {
            const mainTagSlug = `/tag/${kebabCase(node.frontmatter.mainTag)}/`;
            createNodeField({ node, name: "mainTagSlug", value: mainTagSlug });
        }
    }
};
module.exports = onCreateNode;
