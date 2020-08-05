import type { ReactNode } from "react";

export type RenderCallback = {
  render: (data: any) => ReactNode,
};

export type Entry = {
  getIn(In: string[]): string,
};

export type WidgetFor = (name: string) => string;

export type Tag = {
  fieldValue: string,
  totalCount: number
}

export type PageContext = {
  tag: string,
  mainTag: string,
  currentPage: number,
  prevPagePath: string,
  nextPagePath: string,
  hasPrevPage: boolean,
  hasNextPage: boolean,
};

export type Node = {
  fields: {
    slug: string,
    mainTagSlug?: string,
    tagSlugs?: string[],
  },
  frontmatter: {
    date: string,
    description?: string,
    mainTag?: string,
    tags?: string[],
    title: string,
    socialImage?: string,
  },
  html: string,
  id: string,
};

export type Edge = {
  node: Node,
};

export type Edges = Array<Edge>;

export type AllMarkdownRemark = {
  allMarkdownRemark: {
    edges: Edges,
  },
  group: {
    fieldValue: string,
    totalCount: number,
  }[],
};

export type MarkdownRemark = Node;
