import type { ReactNode } from "react";

export type RenderCallback = {
  render: (data: any) => ReactNode;
};

export type Entry = {
  getIn(In: string[]): string;
};

export type WidgetFor = (name: string) => string;

export type Tag = {
  fieldValue: string;
  totalCount: number;
};

export type Feed = {
  query: {
    site: Site;
    allMarkdownRemark: allMarkdownRemark;
  };
};

export type Site = {
  siteMetadata: {
    url: string;
    site_url: url;
    siteUrl: url;
    subtitle: string;
    pathPrefix: string;
    title: string;
    copyright: string;
    disqusShortname: string;
    postsPerPage: string;
    googleAnalyticsId: string;
    menu: { label: string; path: string }[];
    author: Author;
  };
};

export type SiteMap = {
  site: Site,
  allSitePage: {
    edges: Edge[]
  }
}
export type Author = {
  name: string;
  photo: string;
  bio: string;
  contacts: {
    email: string;
    facebook: string;
    telegram: string;
    twitter: string;
    github: string;
    rss: string;
    vkontakte: string;
    linkedin: string;
    instagram: string;
    line: string;
    gitlab: string;
    weibo: string;
    codepen: string;
    youtube: string;
    soundcloud: string;
    stackoverflow: string;
    dribbble: string;
  };
};
export type PageContext = {
  tag: string;
  mainTag: string;
  currentPage: number;
  prevPagePath: string;
  nextPagePath: string;
  hasPrevPage: boolean;
  hasNextPage: boolean;
};

export type Node = {
  fields: {
    slug: string;
    mainTagSlug?: string;
    tagSlugs?: string[];
  };
  frontmatter: {
    date: string;
    description?: string;
    mainTag?: string;
    tags?: string[];
    title: string;
    socialImage?: string;
  };
  html: string;
  id: string;
  path: string
};

export type Edge = {
  node: Node;
};

export type Edges = Array<Edge>;

export type AllMarkdownRemark = {
  allMarkdownRemark: {
    edges: Edges;
  };
  group: {
    fieldValue: string;
    totalCount: number;
  }[];
};

export type MarkdownRemark = Node;
