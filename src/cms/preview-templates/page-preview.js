// @flow strict
import React from "react";
import type { Entry, WidgetFor } from "../../types";

type Props = {
  entry: Entry,
  widgetFor: WidgetFor,
};

const PagePreview = ({ entry, widgetFor }: Props) => {
  const body = widgetFor('body');
  const title = entry.getIn(['data', 'title']);

  return (
    <div className="content">
      <h1 className="content__title">{title}</h1>
      <div className="content__body">{body}</div>
    </div>
  );
};

export default PagePreview;
