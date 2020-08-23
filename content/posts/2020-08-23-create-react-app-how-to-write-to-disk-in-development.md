---
template: post
title: "Create React App: How to Write to Disk in Development"
slug: cra-write-to-disk-in-dev
draft: true
date: 2020-08-23T19:33:07.893Z
description: How to add a development build mode which watches for changes,
  rebuilds the bundle, and writes it onto filesystem in development mode.
mainTag: React.js
tags:
  - React.js
  - Webpack
---
I was recently working on a create-react-app project that was being served by an external golang static file server. To see local changes in the browser, I had to rebuild the entire react project, and serve the files from the `/build` directory. This became cumbersome as running `yarn build` took up to 20 seconds every time.