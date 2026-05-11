import { render, screen } from '@testing-library/react';
import PostList from './PostList';
import { mockPosts } from '@/mocks/post';

describe('PostList', () => {
  it('renders a list of posts', () => {
    render(<PostList posts={mockPosts} />);
    expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockPosts[1].title)).toBeInTheDocument();
  });

  it('shows empty state when no posts', () => {
    render(<PostList posts={[]} />);
    expect(screen.getByText(/No posts yet/)).toBeInTheDocument();
  });
});
