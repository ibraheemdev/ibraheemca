import React from 'react';
import renderer from 'react-test-renderer';
import Page from '../../src/components/Page';

describe('Page', () => {
  const props = {
    children: 'test',
    title: 'test',
  };

  it('renders correctly', async () => {
    const page = await renderer.create(<Page {...props} />)
    const tree = await page.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
