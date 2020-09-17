import React from "react";
import renderer from "react-test-renderer";
import Post from "../../src/components/Post";

describe("Post", () => {
  const props = {
    post: {
      id: "test-123",
      html: "<p>test</p>",
      fields: {
        slug: "/test",
        categorySlug: "/test-category",
        tagSlugs: ["/test_0", "/test_1"],
      },
      frontmatter: {
        date: "2016-09-01",
        tags: ["test_0", "test_1"],
        title: "test",
        template: "n/a",
        slug: "/test",
      },
      internal: {
        type: "n/a",
        contentDigest: "",
        owner: "",
      },
      children: [],
      parent: "",
      path: "",
      relativeDirectory: "",
    },
  };

  it("renders correctly", () => {
    const tree = renderer.create(<Post {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
