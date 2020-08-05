import React from "react";
import styles from "./Copyright.module.scss";

type Props = {
  copyright: string,
};

const Copyright = ({ copyright }: Props) => (
  <div
    className={styles["copyright"]}
    dangerouslySetInnerHTML={{ __html: copyright }}
  />
);

export default Copyright;
