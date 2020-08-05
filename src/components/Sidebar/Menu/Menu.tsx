import React from "react";
import { Link } from "gatsby";
import styles from "./Menu.module.scss";
import { MenuProps } from "../../../index";

const Menu = ({ menu }: MenuProps) => (
  <nav className={styles["menu"]}>
    <ul className={styles["menu__list"]}>
      {menu.map((item) => (
        <li className={styles["menu__list-item"]} key={item.path}>
          <Link
            to={item.path}
            className={styles["menu__list-item-link"]}
            activeClassName={styles["menu__list-item-link--active"]}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

export default Menu;
