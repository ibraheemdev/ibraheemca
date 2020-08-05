import React from "react";
import styles from "./Copyright.module.scss";
import { CopyrightProps } from "../../..";

const Copyright = ({ copyright }: CopyrightProps) => (
  <div
    className={styles["copyright"]}
    dangerouslySetInnerHTML={{ __html: copyright }}
  />
);

export default Copyright;
