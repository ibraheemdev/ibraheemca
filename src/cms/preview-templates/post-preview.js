// @flow strict
import React from 'react';
import type { Entry, WidgetFor } from '../../types';
import styles from "./preview-styles.css";

type Props = {
  entry: Entry,
  widgetFor: WidgetFor
};

const PostPreview = ({ entry, widgetFor }: Props) => {
  const body = widgetFor('body');
  const title = entry.getIn(['data', 'title']);

  return (
    <div className={styles["content"]}>
      <h1 className={styles["content__title"]}>{title}</h1>
      <div
        className={styles["content__body"]}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
};

export default PostPreview;
