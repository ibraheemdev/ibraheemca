---
template: writing.html
title: "Create React App: How to Write to Disk in Development"
slug: cra-write-to-disk-in-dev
draft: false
date: 2020-08-28T15:58:13.616Z
description: How to add a development build mode in create-react-app which
  watches for file changes, rebuilds a development bundle, and writes it onto
  filesystem in development mode.

taxonomies:
    tags:
        - React.js
        - Webpack

extra:
    socialImage: /media/react-logo-825x510.jpg
---
I was recently working on a create-react-app project that was being served by an external golang static file server. To see local changes in the browser, I had to rebuild the entire react project, and serve the files from the `/build` directory. This became cumbersome as running `yarn build` took up to 20 seconds every time.

It turns out, I wasn't the only one who had this problem. [Issue #1070](https://github.com/facebook/create-react-app/issues/1070) has been open since 2016, and currently has over 200 upvotes. After scrolling through the 90+ comments, I found that Dan Abramov was delaying working on it because:
> The concept of a dev server is already confusing to many people and I've seen countless issues from people trying to find dev server output in the filesystem, adding scripts with hrefs to local files, when they didn't need it.

> So I'm worried introducing this feature is useful in some advanced cases but might make everything more confusing in simple cases for people who mistakingly start with build-dev instead because they haven't seen a dev server before when dev server is exactly what they need.

A few comments later, I came across [this github gist](https://gist.github.com/jasonblanchard/ae0d2e304a647cd847c0b4493c2353d4), and the [cra-build-watch](https://github.com/Nargonath/cra-build-watch) package. For older versions of react-scripts, cra-build-watch is probably your best option. You simple install the package:
```bash
yarn add -D cra-build-watch
```
Add the watch script to your package.json:
```javascript
"scripts": {
    "watch": "cra-build-watch"
}
```
And run the script:
```
yarn watch -b ./dist
```
The development bundle should be outputted to the `dist/` directory, and reloaded every time you make a change.

As I was using the latest version of react-scripts, and didn't want to add an additional dependency, I looked into the source code and came up with this little script:
```javascript
// scripts/watch.js
process.env.NODE_ENV = "development";

const fs = require("fs-extra");
const paths = require("react-scripts/config/paths");
const webpack = require("webpack");
const config = require("react-scripts/config/webpack.config")("development");

// the output directory of the development files
outputPath = paths.appPath + "/dist";
config.output.path = outputPath;

// update the webpack dev config in order to remove the use of webpack hotreload tools
config.entry = config.entry.filter((f) => !f.match(/webpackHotDevClient/));
config.plugins = config.plugins.filter((p) => !(p instanceof webpack.HotModuleReplacementPlugin));

(async () => {
  await fs.emptyDir(outputPath)
  webpack(config).watch({}, (err) => {
    if (err) {
      console.error(err);
    } else {
      // copy the remaining thing from the public folder to the output folder
      fs.copySync(paths.appPublic, outputPath, {
        dereference: true,
        filter: file => file !== paths.appHtml
      });
    }
  });
})();
```
You can add the script just like before:
```
"scripts": {
    "watch": "chmod +x ./scripts/watch.js && ./scripts/watch.js",
}
```
And running it should result in the same output!
```
yarn watch
```
