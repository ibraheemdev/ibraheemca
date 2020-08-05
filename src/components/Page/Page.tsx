import React, { useRef, useEffect } from "react";
import styles from "./Page.module.scss";
import { PageProps } from "../../index";

const Page = ({ title, children }: PageProps) => {
  const pageRef = useRef() as React.MutableRefObject<HTMLInputElement>;

  useEffect(() => {
    pageRef.current.scrollIntoView();
  });

  return (
    <div ref={pageRef} className={styles["page"]}>
      <div className={styles["page__inner"]}>
        {title && <h1 className={styles["page__title"]}>{title}</h1>}
        <div className={styles["page__body"]}>{children}</div>
      </div>
    </div>
  );
};

export default Page;
