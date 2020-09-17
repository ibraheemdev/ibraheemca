'use strict';
import siteMetadata from '../__fixtures__/site-metadata';

const React = require('react');
const gatsby = jest.requireActual('gatsby');

module.exports = {
  ...gatsby,
  graphql: jest.fn(),
  Link: jest.fn().mockImplementation(
    ({
      activeClassName,
      activeStyle,
      getProps,
      innerRef,
      ref,
      replace,
      to,
      ...rest
    }) => (
      React.createElement('a', {
        ...rest,
        href: to,
      })
    )
  ),
  useStaticQuery: jest.fn().mockImplementation(() => (
    siteMetadata
  ))
};
