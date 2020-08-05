// @flow strict
import React from "react";
import DiscussionEmbed from "disqus-react";
import { useSiteMetadata } from "../../../hooks";

type Props = {
  postTitle: string,
  postSlug: string,
};

const Comments = ({ postTitle, postSlug }: Props) => {
  const { url, disqusShortname } = useSiteMetadata();

  if (!disqusShortname) {
    return null;
  }

  return (
    <ReactDisqusComments
      shortname={disqusShortname}
      config={{
        identifier: postTitle,
        title: postTitle,
        url: url + postSlug,
      }}
    />
  );
};

export default Comments;
