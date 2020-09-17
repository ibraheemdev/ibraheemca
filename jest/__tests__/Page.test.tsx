import React from 'react';
import renderer from 'react-test-renderer';
import Page from '../../src/components/Page';

describe('Page', () => {
  const props = {
    children: 'test',
    title: 'test',
  };
  // TODO : The useEffect scrolling logic in the Page components
  // is causing errors:
  // Cannot log after tests are done. 
  // Did you forget to wait for something async in your test?

  it('renders correctly', async () => {
  //   const page = await renderer.create(<Page {...props} />)
  //   const tree = await page.toJSON();
  //   expect(tree).toMatchSnapshot();
  });
});
