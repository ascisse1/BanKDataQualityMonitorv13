import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NotificationProvider, useNotification, NotificationDisplay } from './NotificationContext';

// Helper component to trigger notifications
function TestConsumer() {
  const { showSuccess, showError, showInfo } = useNotification();
  return (
    <div>
      <button onClick={() => showSuccess('Success!')}>Show Success</button>
      <button onClick={() => showError('Error!')}>Show Error</button>
      <button onClick={() => showInfo('Info!')}>Show Info</button>
      <NotificationDisplay />
    </div>
  );
}

function renderWithProvider() {
  return render(
    <NotificationProvider>
      <TestConsumer />
    </NotificationProvider>
  );
}

describe('NotificationContext', () => {
  it('shows success notification', () => {
    renderWithProvider();
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('shows error notification', () => {
    renderWithProvider();
    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('shows info notification', () => {
    renderWithProvider();
    fireEvent.click(screen.getByText('Show Info'));
    expect(screen.getByText('Info!')).toBeInTheDocument();
  });

  it('dismisses notification on close click', () => {
    renderWithProvider();
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Fermer la notification');
    fireEvent.click(closeButton);
    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });

  it('auto-dismisses notifications after duration', async () => {
    vi.useFakeTimers();
    renderWithProvider();

    fireEvent.click(screen.getByText('Show Info'));
    expect(screen.getByText('Info!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.queryByText('Info!')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('throws when useNotification is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useNotification must be used within a NotificationProvider');
    spy.mockRestore();
  });
});
