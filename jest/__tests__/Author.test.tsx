import React from 'react';
import renderer from 'react-test-renderer';
import Author from '../../src/components/Sidebar/Author';

describe('Author', () => {
  const props = {
    author: {
      name: 'test',
      photo: '/photo.jpg',
      bio: 'test',
      contacts: {
        email: "test@test.com",
        facebook: "",
        telegram: "",
        twitter: "",
        github: "testdev",
        rss: "/test.xml",
        vkontakte: "",
        linkedin: "",
        instagram: "",
        line: "",
        gitlab: "",
        weibo: "",
        codepen: "",
        youtube: "",
        soundcloud: "",
        stackoverflow: "test",
        dribbble: "test",
      },
    },
    isIndex: false
  };

  it('renders correctly', () => {
    const tree = renderer.create(<Author {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
