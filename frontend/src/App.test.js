import { render, screen } from '@testing-library/react';

import LoadingSpinner from './components/LoadingSpinner';

test('renders loading message', () => {
  render(<LoadingSpinner message="Loading dashboard..." />);
  expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
});
