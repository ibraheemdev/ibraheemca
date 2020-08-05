import React from "react";
import { Link } from "gatsby";
import styles from "./Tags.module.scss";
import { TagsProps } from "../../..";

const Tags = ({ tags, tagSlugs }: TagsProps) => (
  <div className={styles["tags"]}>
    <ul className={styles["tags__list"]}>
      {tagSlugs &&
        tagSlugs.map((slug, i) => (
          <li className={styles["tags__list-item"]} key={tags[i]}>
            <Link to={slug} className={styles["tags__list-item-link"]}>
              {tags[i]}
            </Link>
          </li>
        ))}
      <li className={styles["tags__list-item"]} key="all tags">
        <Link to="/tags" className={styles["tags__list-item-link"]}>
          All Tags
        </Link>
      </li>
    </ul>
  </div>
);

export default Tags;
