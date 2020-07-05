// @flow strict
import React from 'react';
import { getContactHref } from '../../../utils';
import styles from './Author.module.scss';
import { useSiteMetadata } from '../../../hooks';

const Author = () => {
  const { author } = useSiteMetadata();
  const bio = {__html: author.bio}
  return (
    <div className={styles['author']}>
      <p className={styles['author__bio']} dangerouslySetInnerHTML={{__html: author.bio}} />
    </div>
  );
};

export default Author;
