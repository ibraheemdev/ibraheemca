import React from "react";

const PostPreview = ({ entry, widgetFor }) => {
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
