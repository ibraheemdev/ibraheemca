import { useStaticQuery, graphql } from "gatsby";
import { Site } from "../index";

const useSiteMetadata = () => {
  const result = useStaticQuery<{ site: Site }>(
    graphql`
      query SiteMetaData {
        site {
          siteMetadata {
            author {
              name
              bio
              photo
              contacts {
                facebook
                linkedin
                github
                twitter
                telegram
                instagram
                email
                rss
                vkontakte
                line
                gitlab
                weibo
                codepen
                youtube
                soundcloud
                stackoverflow
                dribbble
              }
            }
            menu {
              label
              path
            }
            url
            title
            subtitle
            copyright
            disqusShortname
          }
        }
      }
    `
  );
  return result.site.siteMetadata;
};

export default useSiteMetadata;
