// @flow strict
import React from "react";
import styles from "./Author.module.scss";
import { useSiteMetadata } from "../../../hooks";

const Author = () => {
  const { author } = useSiteMetadata();
  return (
    <div className={styles["author"]}>
      <div
        className={styles["author__bio"]}
        dangerouslySetInnerHTML={{ __html: author.bio }}
      />
    </div>
  );
};

export default Author;
