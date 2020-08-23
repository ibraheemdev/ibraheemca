const siteConfig = require("./config.js");
const postCssPlugins = require("./postcss-config.js");
import { Feed, Edge, SiteMap } from "./src/index"

module.exports = {
  pathPrefix: siteConfig.pathPrefix,
  siteMetadata: {
    url: siteConfig.url,
    title: siteConfig.title,
    subtitle: siteConfig.subtitle,
    copyright: siteConfig.copyright,
    disqusShortname: siteConfig.disqusShortname,
    menu: siteConfig.menu,
    author: siteConfig.author,
  },
  plugins: [
    {
      resolve: "gatsby-source-filesystem",
      options: {
        path: `${__dirname}/content`,
        name: "pages",
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        path: `${__dirname}/static/media`,
        name: "media",
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "css",
        path: `${__dirname}/static/css`,
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "assets",
        path: `${__dirname}/static`,
      },
    },
    {
      resolve: "gatsby-plugin-feed",
      options: {
        query: `
          {
            site {
              siteMetadata {
                site_url: url
                title
                description: subtitle
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMarkdownRemark } }: Feed) =>
              allMarkdownRemark.edges.map((edge: Edge) => ({
                ...edge.node.frontmatter,
                description: edge.node.frontmatter.description,
                date: edge.node.frontmatter.date,
                url: site.siteMetadata.site_url + edge.node.fields.slug,
                guid: site.siteMetadata.site_url + edge.node.fields.slug,
                category: edge.node.fields.tagSlugs,
                custom_elements: [{ "content:encoded": edge.node.html }],
              })),
            query: `
              {
                allMarkdownRemark(
                  limit: 1000,
                  sort: { order: DESC, fields: [frontmatter___date] },
                  filter: { frontmatter: { template: { eq: "post" }, draft: { ne: true } } }
                ) {
                  edges {
                    node {
                      html
                      fields {
                        slug
                      }
                      frontmatter {
                        title
                        date
                        template
                        draft
                        description
                      }
                    }
                  }
                }
              }
            `,
            output: "/rss.xml",
            title: siteConfig.title,
          },
        ],
      },
    },
    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: [
          "gatsby-remark-relative-images",
          {
            resolve: "gatsby-remark-images",
            options: {
              maxWidth: 960,
              withWebp: true,
              ignoreFileExtensions: [],
            },
          },
          "gatsby-remark-autolink-headers",
          "gatsby-remark-prismjs",
          "gatsby-remark-copy-linked-files",
        ],
      },
    },
    "gatsby-transformer-sharp",
    "gatsby-plugin-sharp",
    {
      resolve: "gatsby-plugin-netlify-cms",
      options: {
        modulePath: `${__dirname}/src/cms/index.js`,
        enableIdentityWidget: true
      },
    },
    {
      resolve: "gatsby-plugin-google-gtag",
      options: {
        trackingIds: [siteConfig.googleAnalyticsId],
        pluginConfig: {
          head: true,
        },
      },
    },
    {
      resolve: "gatsby-plugin-sitemap",
      options: {
        query: `
          {
            site {
              siteMetadata {
                siteUrl: url
              }
            }
            allSitePage(
              filter: {
                path: { regex: "/^(?!/404/|/404.html|/dev-404-page/)/" }
              }
            ) {
              edges {
                node {
                  path
                }
              }
            }
          }
        `,
        output: "/sitemap.xml",
        serialize: ({ site, allSitePage }: SiteMap) =>
          allSitePage.edges.map((edge: Edge) => ({
            url: site.siteMetadata.siteUrl + edge.node.path,
            changefreq: "daily",
            priority: 0.7,
          })),
      },
    },
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: siteConfig.title,
        short_name: siteConfig.title,
        start_url: "/",
        background_color: "#FFF",
        theme_color: "#F7A046",
        display: "standalone",
        icon: "static/photo.png",
      },
    },
    "gatsby-plugin-catch-links",
    "gatsby-plugin-react-helmet",
    {
      resolve: "gatsby-plugin-sass",
      options: {
        postCssPlugins: [...postCssPlugins],
        cssLoaderOptions: {
          camelCase: false,
        },
      },
    },
    "gatsby-plugin-optimize-svgs",
    {
      resolve: `gatsby-plugin-netlify`,
      options: {
        headers: {
          "/public/**/*.json": [
            "cache-control: public",
            "cache-control: no-cache",
          ],
          "/public/**/*.html": [
            "cache-control: public",
            "cache-control: no-cache",
          ],
          "/public/**/*.{js,css}": [
            "cache-control: public",
            "cache-control: max-age=31536000",
            "cache-control: immutable",
          ],
          "/static/**/*": [
            "cache-control: public",
            "cache-control: max-age=31536000",
            "cache-control: immutable",
          ],
          "/sw.js": [
            "cache-control: public",
            "cache-control: no-cache",
          ],
          "/**/*": [
            "cache-control: public",
            "cache-control: no-cache",
          ]
        },
      },
    },
  ],
};

export {}