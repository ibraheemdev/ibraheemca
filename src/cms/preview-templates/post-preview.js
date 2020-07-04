// @flow strict
import React from "react";
import type { Entry, WidgetFor } from "../../types";
import "./preview-styles.css"

type Props = {
  entry: Entry,
  widgetFor: WidgetFor,
};

const PostPreview = ({ entry, widgetFor }: Props) => {
  const body = widgetFor("body");
  const title = entry.getIn(["data", "title"]);

  return (
    <div className="content">
      <h1 className="content__title">{title}</h1>
      <div className="content__body">{body}</div>
    </div>
  );
};

export default PostPreview;
