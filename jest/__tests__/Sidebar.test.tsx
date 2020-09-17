import React from 'react';
import renderer from 'react-test-renderer';
import Sidebar from '../../src/components/Sidebar';

describe('Sidebar', () => {
  const props = {
    isIndex: true
  };

  it('renders correctly', () => {
    const tree = renderer.create(<Sidebar {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
