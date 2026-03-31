/**
 * Portal - Renders children into a DOM node outside the parent hierarchy
 *
 * Useful for dropdowns, modals, tooltips, and other floating elements
 * that need to escape container overflow/clipping constraints.
 */

import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  /** Content to render in the portal */
  children: ReactNode;
  /** Container element to render into (defaults to document.body) */
  container?: Element | null;
}

export const Portal: React.FC<PortalProps> = ({ children, container }) => {
  // For client-side only apps, we can render directly
  // This ensures children mount synchronously for positioning calculations
  if (typeof document === 'undefined') {
    return null;
  }

  const targetContainer = container || document.body;
  return createPortal(children, targetContainer);
};

Portal.displayName = 'Portal';
