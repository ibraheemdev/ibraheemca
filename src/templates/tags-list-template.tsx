import React from "react";
import { Link, graphql } from "gatsby";
import kebabCase from "lodash.kebabCase";
import Layout from "../components/Layout";
import Sidebar from "../components/Sidebar";
import Page from "../components/Page";
import { useSiteMetadata } from "../hooks";
import { Tag } from "../index"

const TagsListTemplate = ({ data }: any) => {
  const { title, subtitle } = useSiteMetadata();
  const tags: Tag[] = data.allMarkdownRemark.group

  return (
    <Layout title={`Tags - ${title}`} description={subtitle}>
      <Sidebar />
      <Page title="Tags">
        <ul>
          {tags.map((tag: Tag) => (
            <li key={tag.fieldValue}>
              <Link to={`/tag/${kebabCase(tag.fieldValue)}/`}>
                {tag.fieldValue} ({tag.totalCount})
              </Link>
            </li>
          ))}
        </ul>
      </Page>
    </Layout>
  );
};

export const query = graphql`
  query TagsListQuery {
    allMarkdownRemark(
      filter: { frontmatter: { template: { eq: "post" }, draft: { ne: true } } }
    ) {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`;

export default TagsListTemplate;
