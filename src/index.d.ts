import type { ReactNode } from "react";
import { Actions } from "gatsby";

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
  site: Site;
  allSitePage: {
    edges: Edge[];
  };
};
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

export type OnCreateNodeArgs = {
  node: Node;
  actions: Actions;
  getNode(id: string): Node;
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
    template: string;
    slug: string;
  };
  internal: {
    type: string;
    mediaType?: string | undefined;
    content?: string | undefined;
    contentDigest: string;
    description?: string | undefined;
  } & { owner: string };
  children: string[];
  parent: string;
  html: string;
  id: string;
  path: string;
  relativeDirectory: string;
};

export type Edge = {
  node: Node;
};

export type Edges = Array<Edge>;

export type AllMarkdownRemark = {
  allMarkdownRemark: {
    edges: Edges;
    totalCount: number;
    group: {
      fieldValue: string;
      totalCount: number;
    }[];
  };
};

export type MarkdownRemark = Node;

type FeedProps = {
  edges: Edges;
};

type IconProps = {
  name: string;
  icon: {
    viewBox?: string;
    path?: string;
  };
};

type LayoutProps = {
  children: React.ReactNode;
  title: string;
  description?: string;
  socialImage?: string;
};

type PageProps = {
  title?: string;
  children: React.ReactNode;
};

type PaginationProps = {
  prevPagePath: string;
  nextPagePath: string;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type PostProps = {
  post: Node;
};

type CommentProps = {
  postTitle: string;
  postSlug: string;
};

type ContentProps = {
  body: string;
  title: string;
};

type MetaProps = {
  date: string;
};

type TagsProps = {
  tags: string[];
  tagSlugs: string[];
};

type SidebarProps = {
  isIndex?: boolean;
};

type AuthorProps = {
  author: Author;
  isIndex?: boolean;
};

type ContactsProps = {
  contacts: {
    [name: string]: string;
  };
};

type CopyrightProps = {
  copyright: string;
};

type MenuProps = {
  menu: {
    label: string;
    path: string;
  }[];
};

type IndexTemplateProps = {
  data: AllMarkdownRemark;
  pageContext: PageContext;
};

type PageTemplateProps = {
  data: {
    markdownRemark: MarkdownRemark;
  };
};

type PostTemplateProps = {
  data: {
    markdownRemark: MarkdownRemark;
  };
};

type TagListTemplateProps = {
  data: AllMarkdownRemark;
  pageContext: PageContext;
};


type TagTemplateProps = {
  data: AllMarkdownRemark;
  pageContext: PageContext;
};

export type PreviewArgs = {
  entry: {
    getIn(collection: any, keyPath?: Iterable<any>, notSetValue?: any): any;
  };
  widgetFor(field: string): any;
};
