"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const createTagsPages = require("./pagination/create-tags-pages.js");
const createPostsPages = require("./pagination/create-posts-pages.js");
const createPages = async ({ graphql, actions }) => {
    const { createPage } = actions;
    // 404
    actions.createPage({
        path: "/404",
        component: path.resolve("./src/templates/not-found-template.tsx"),
        context: {},
    });
    // Tags list
    createPage({
        path: "/tags",
        component: path.resolve("./src/templates/tags-list-template.tsx"),
        context: {},
    });
    // Posts and pages from markdown
    const result = await graphql(`
    {
      allMarkdownRemark(filter: { frontmatter: { draft: { ne: true } } }) {
        edges {
          node {
            frontmatter {
              template
            }
            fields {
              slug
            }
          }
        }
      }
    }
  `);
    Object.values(result.data.allMarkdownRemark.edges).forEach((edge) => {
        if (edge.node.frontmatter.template === "page") {
            createPage({
                path: edge.node.fields.slug,
                component: path.resolve("./src/templates/page-template.tsx"),
                context: { slug: edge.node.fields.slug },
            });
        }
        else if (edge.node.frontmatter.template === "post") {
            createPage({
                path: edge.node.fields.slug,
                component: path.resolve("./src/templates/post-template.tsx"),
                context: { slug: edge.node.fields.slug },
            });
        }
    });
    // Feeds
    await createTagsPages(graphql, actions);
    await createPostsPages(graphql, actions);
};
module.exports = createPages;
