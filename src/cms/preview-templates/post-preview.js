// @flow strict
import React from "react";
import type { Entry, WidgetFor } from "../../types";
import Content from "../../components/Post/Content/Content"

type Props = {
  entry: Entry,
  widgetFor: WidgetFor,
};

const PostPreview = ({ entry, widgetFor }: Props) => {
  const body = widgetFor('body');
  const title = entry.getIn(['data', 'title']);

  return (
    <Content body={body} title={title}/>
  );
};

export default PostPreview;
