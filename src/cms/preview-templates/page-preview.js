// @flow strict
import React from 'react';
import type { Entry, WidgetFor } from '../../types';
import Content from "../../components/Post/Content"

type Props = {
  entry: Entry,
  widgetFor: WidgetFor
};

const PagePreview = ({ entry, widgetFor }: Props) => {
  const body = widgetFor('body');
  const title = entry.getIn(['data', 'title']);

  return (
    <Content body={body} title={title} />
  );
};

export default PagePreview;
