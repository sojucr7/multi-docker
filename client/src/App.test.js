import { render, screen } from '@testing-library/react';
import Test from './Test';

test('renders Im some other page!', () => {
  render(<Test />);
  const linkElement = screen.getByText(/Im some other page!/i);
  expect(linkElement).toBeInTheDocument();
});;
