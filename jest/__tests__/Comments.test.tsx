import React from "react";
import renderer from "react-test-renderer";
import Comments from "../../src/components/Post/Comments";

describe("Comments", () => {
  const props = {
    postTitle: "test",
    postSlug: "/test",
  };

  it("renders correctly", () => {
    const tree = renderer.create(<Comments {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
