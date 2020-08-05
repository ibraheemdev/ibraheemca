import React from "react";
import Helmet from "react-helmet";
import { withPrefix } from "gatsby";
import { useSiteMetadata } from "../../hooks";
import styles from "./Layout.module.scss";

type Props = {
  children: React.ReactNode,
  title: string,
  description?: string,
  socialImage?: string,
};

const Layout = ({ children, title, description, socialImage }: Props) => {
  const { author, url } = useSiteMetadata();
  const metaImage = socialImage != null ? socialImage : author.photo;
  const metaImageUrl = url + withPrefix(metaImage);

  return (
    <div className={styles.layout}>
      <Helmet>
        <html lang="en" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:site_name" content={title} />
        <meta property="og:image" content={metaImageUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={metaImageUrl} />
        <script
          data-name="BMC-Widget"
          src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
          data-id="ibraheem"
          data-description="Any support is greatly appreciated."
          data-message=""
          data-color="#FF813F"
          data-position="right"
          data-x_margin="18"
          data-y_margin="18"
        />
      </Helmet>
      {children}
    </div>
  );
};

export default Layout;
