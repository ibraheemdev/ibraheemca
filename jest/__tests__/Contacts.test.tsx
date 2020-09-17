import React from 'react';
import renderer from 'react-test-renderer';
import Contacts from '../../src/components/Sidebar/Contacts';

describe('Contacts', () => {
  const props = {
    contacts: {
      email: 'test@test.com',
      twitter: 'test',
      vkontakte: 'test',
      github: 'testdev',
      rss: '/test.xml',
      telegram: 'test'
    }
  };

  it('renders correctly', () => {
    const tree = renderer.create(<Contacts {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
