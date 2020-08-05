import React from 'react';
import { DiscussionEmbed } from 'disqus-react' 
import { useSiteMetadata } from '../../../hooks';
import { CommentProps } from '../../../index';

const Comments = ({ postTitle, postSlug }: CommentProps) => {
  const { url, disqusShortname } = useSiteMetadata();

  if (!disqusShortname) return null;

  const disqusConfig = {
    shortname: disqusShortname,
    config: { identifier: postTitle, title: postTitle, url: url + postSlug},
  }

  return (
    <DiscussionEmbed {...disqusConfig} /> 
  );
};

export default Comments;