# ibraheem.ca

The repo for ibraheem.ca, my open source blog. [Check it out!](https://ibraheem.ca/).

This site was built with [gatsby.js](https://www.gatsbyjs.org/), [netlifycms](https://github.com/netlify/netlify-cms), [typescript](https://www.typescriptlang.org/) and a ton of other awesome open source packages you can check out in the [package.json](https://github.com/ibraheemdev/ibraheemca/blob/master/package.json).

*This project was initally scaffolded with [the gatsby-lumen-starter](https://github.com/alxshelepenok/gatsby-starter-lumen)*

## Features
+ [Lost Grid](http://lostgrid.org).
+ [Modern font stack](https://bitsofco.de/the-new-system-font-stack).
+ Beautiful typography inspired by [matejlatin/Gutenberg](https://github.com/matejlatin/Gutenberg).
+ Syntax highlighting in code blocks using [PrismJS](http://prismjs.com).
+ [Mobile-First](https://medium.com/@mrmrs_/mobile-first-css-48bc4cc3f60f) approach in development.
+ Archive organized by tags.
+ Pagination.
+ [Netlify CMS](https://www.netlifycms.org) support.
+ Google Analytics.
+ Disqus Comments.
+ [Typescript](https://www.typescriptlang.org/) static type checking.

## Getting Started

#### Clone the Repository

You can clone this repository with git, or fork it from github:
```bash
$ git clone https://github.com/ibraheemdev/ibraheemca
```

#### Start Developing

To start developing, navigate to the directory:
```bash
$ cd ibraheemca
```

And start the development server:
```bash
$ yarn develop
```

#### Open the source code and start editing!

Your site is now running at http://localhost:8000!

Note: You'll also see a second link: http://localhost:8000/___graphql. This is a tool you can use to experiment with querying your data. Learn more about using this tool in [the Gatsby tutorial](https://www.gatsbyjs.com/tutorial/part-five/#introducing-graphiql).

#### Running Typescript

Some of the gatsby config pages do not support the `.ts` extension. To get around this, there is a second typescript config file `tsconfig-gatsby.json` that will emit compiled `.js` files.

You can run all the typescript checks with:
```bash
$ yarn typecheck
```

## Deploy with Netlify

[Netlify](https://netlify.com) CMS can run in any frontend web environment, but the quickest way to try it out is by running it on a pre-configured starter site with Netlify. Use the button below to build and deploy your own copy of the repository:

<a href="https://app.netlify.com/start/deploy?repository=https://github.com/ibraheemdev/ibraheemca" target="_blank"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify"></a>

After clicking that button, you’ll authenticate with GitHub and choose a repository name. Netlify will then automatically create a repository in your GitHub account with a copy of the files from the template. Next, it will build and deploy the new site on Netlify, bringing you to the site dashboard when the build is complete. Next, you’ll need to set up [Netlify’s Identity service](https://docs.netlify.com/visitor-access/git-gateway/#setup-and-settings) to authorize users to log in to the CMS.


## Using The CMS

To access the CMS, you can navigate to `/admin` in a production build. To access the CMS, locally, you can build the site with gatsby:
```bash
$ npm run build
$ gatsby serve
```

## Licensing

See the [LICENSE](https://github.com/ibraheemdev/ibraheemca/blob/master/LICENSE) file for licensing information as it pertains to files in this repository.
