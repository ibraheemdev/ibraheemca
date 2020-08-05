import React from "react";
import styles from "./Icon.module.scss";
import { IconProps } from "../..";

const Icon = ({ name, icon }: IconProps) => (
  <svg className={styles["icon"]} viewBox={icon.viewBox}>
    <title>{name}</title>
    <path d={icon.path} />
  </svg>
);

export default Icon;
