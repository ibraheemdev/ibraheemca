import React from "react";
import moment from "moment";
import styles from "./Meta.module.scss";
import { MetaProps } from "../../..";

const Meta = ({ date }: MetaProps) => (
  <div className={styles["meta"]}>
    <p className={styles["meta__date"]}>
      Published {moment(date).format("D MMM YYYY")}
    </p>
  </div>
);

export default Meta;
