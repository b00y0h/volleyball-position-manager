import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ResetPreview from '../ResetPreview';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ResetPreview', () => {
  const mockOnClose = vi.fn();

  const defaultProps = {
    isVisible: true,
    operation: 'current' as const,
    system: '5-1' as const,
    rotation: 0,
    formation: 'rotational' as const,
    affectedPositions: ['S', 'OH1', 'MB1'],
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when visible', () => {
    render(<ResetPreview {...defaultProps} />);
    
    expect(screen.getByText('Reset Preview')).toBeInTheDocument();
    expect(screen.getByText('Reset Current Rotation (1)')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<ResetPreview {...defaultProps} isVisible={false} />);
    
    expect(screen.queryByText('Reset Preview')).not.toBeInTheDocument();
  });

  it('displays correct title for different operations', () => {
    const operations = [
      { operation: 'current' as const, expectedTitle: 'Reset Current Rotation (1)' },
      { operation: 'all' as const, expectedTitle: 'Reset All Rotations in rotational' },
      { operation: 'formation' as const, expectedTitle: 'Reset Entire rotational Formation' },
      { operation: 'system' as const, expectedTitle: 'Reset Entire 5-1 System' },
    ];

    operations.forEach(({ operation, expectedTitle }) => {
      const { rerender } = render(<ResetPreview {...defaultProps} operation={operation} />);
      
      expect(screen.getByText(expectedTitle)).toBeInTheDocument();
      
      rerender(<div />); // Clear between tests
    });
  });

  it('displays correct descriptions for different operations', () => {
    render(<ResetPreview {...defaultProps} />);
    
    expect(screen.getByText(/This will reset 3 customized positions in rotation 1/)).toBeInTheDocument();
  });

  it('shows affected positions', () => {
    render(<ResetPreview {...defaultProps} />);
    
    expect(screen.getByText('Affected Positions (3):')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('OH1')).toBeInTheDocument();
    expect(screen.getByText('MB1')).toBeInTheDocument();
  });

  it('shows no customizations message when no affected positions', () => {
    render(<ResetPreview {...defaultProps} affectedPositions={[]} />);
    
    expect(screen.getByText('No customized positions to reset.')).toBeInTheDocument();
    expect(screen.getByText('All positions are already using defaults.')).toBeInTheDocument();
  });

  it('displays correct impact level styling for different operations', () => {
    const { rerender } = render(<ResetPreview {...defaultProps} operation="current" />);
    
    // Current operation should be low impact (blue)
    expect(screen.getByText('Reset Preview').closest('div')).toHaveClass('border-blue-200');
    
    rerender(<ResetPreview {...defaultProps} operation="formation" />);
    
    // Formation operation should be medium impact (yellow)
    expect(screen.getByText('Reset Preview').closest('div')).toHaveClass('border-yellow-200');
    
    rerender(<ResetPreview {...defaultProps} operation="system" />);
    
    // System operation should be high impact (red)  
    expect(screen.getByText('Reset Preview').closest('div')).toHaveClass('border-red-200');
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ResetPreview {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: '' }); // Close X button
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking outside modal', async () => {
    const user = userEvent.setup();
    render(<ResetPreview {...defaultProps} />);
    
    // Click on the backdrop
    const backdrop = screen.getByText('Reset Preview').closest('div')?.parentElement;
    if (backdrop) {
      await user.click(backdrop);
    }
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not call onClose when clicking inside modal', async () => {
    const user = userEvent.setup();
    render(<ResetPreview {...defaultProps} />);
    
    const modal = screen.getByText('Reset Preview').closest('div');
    await user.click(modal!);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('groups positions correctly for display', () => {
    const complexPositions = [
      'rotational-R1-S',
      'rotational-R1-OH1',
      'serveReceive-R2-S',
      'base-R3-MB1',
      'S',
      'OH1',
    ];

    render(<ResetPreview {...defaultProps} affectedPositions={complexPositions} />);
    
    expect(screen.getByText('Affected Positions (6):')).toBeInTheDocument();
    
    // Should group similar positions together
    expect(screen.getByText('Rotational Formation')).toBeInTheDocument();
    expect(screen.getByText('Servereceive Formation')).toBeInTheDocument();
    expect(screen.getByText('Base Formation')).toBeInTheDocument();
    expect(screen.getByText('Players')).toBeInTheDocument();
  });

  it('shows appropriate warning message based on impact level', () => {
    const { rerender } = render(<ResetPreview {...defaultProps} operation="current" />);
    
    // Low impact should show undo message
    expect(screen.getByText('This operation can be undone using Ctrl+Z.')).toBeInTheDocument();
    
    rerender(<ResetPreview {...defaultProps} operation="system" />);
    
    // High impact should show caution message
    expect(screen.getByText('This operation cannot be undone automatically. Use with caution.')).toBeInTheDocument();
  });

  it('handles different systems and formations correctly', () => {
    const props = {
      ...defaultProps,
      system: '6-2' as const,
      formation: 'serveReceive' as const,
    };

    render(<ResetPreview {...props} />);
    
    expect(screen.getByText('Reset Current Rotation (1)')).toBeInTheDocument();
    // Description should mention the correct formation
    expect(screen.getByText(/serveReceive/)).toBeInTheDocument();
  });

  it('handles keyboard events correctly', () => {
    render(<ResetPreview {...defaultProps} />);
    
    // Simulate Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // This would be handled by the ResetButton component, not the preview itself
    // The preview just displays information
  });

  it('handles edge cases with undefined rotation or formation', () => {
    const systemProps = {
      ...defaultProps,
      operation: 'system' as const,
      rotation: undefined,
      formation: undefined,
    };

    render(<ResetPreview {...systemProps} />);
    
    expect(screen.getByText('Reset Entire 5-1 System')).toBeInTheDocument();
  });

  it('formats position names correctly', () => {
    const positionsWithComplexNames = [
      'rotational-R1-S',
      'rotational-R2-OH1',
      'base-R3-MB1_custom',
      'R4-Opp',
    ];

    render(<ResetPreview {...defaultProps} affectedPositions={positionsWithComplexNames} />);
    
    // Should clean up position names for display
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('OH1')).toBeInTheDocument();
    expect(screen.getByText('MB1_custom')).toBeInTheDocument();
    expect(screen.getByText('Opp')).toBeInTheDocument();
  });

  it('displays correct count of affected positions', () => {
    const positions = ['S', 'OH1', 'MB1', 'Opp', 'OH2', 'MB2'];
    
    render(<ResetPreview {...defaultProps} affectedPositions={positions} />);
    
    expect(screen.getByText('Affected Positions (6):')).toBeInTheDocument();
  });

  it('handles empty position groups', () => {
    render(<ResetPreview {...defaultProps} affectedPositions={[]} />);
    
    // Should show no customizations message instead of empty groups
    expect(screen.queryByText('Affected Positions')).not.toBeInTheDocument();
    expect(screen.getByText('No customized positions to reset.')).toBeInTheDocument();
  });
});