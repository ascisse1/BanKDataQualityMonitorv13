import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button, { IconButton } from './Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-error-600');
  });

  it('applies size classes', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('text-base');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when isLoading', () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('renders left icon', () => {
    render(<Button leftIcon={<span data-testid="icon">*</span>}>With Icon</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Button rightIcon={<span data-testid="right-icon">{'>'}</span>}>Next</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies fullWidth class', () => {
    const { container } = render(<Button fullWidth>Full</Button>);
    expect(container.querySelector('button')?.className).toContain('w-full');
  });

  it('applies rounded class', () => {
    const { container } = render(<Button rounded>Round</Button>);
    expect(container.querySelector('button')?.className).toContain('rounded-full');
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref).toHaveBeenCalled();
  });
});

describe('IconButton', () => {
  it('renders as an icon-only button', () => {
    render(<IconButton>X</IconButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
