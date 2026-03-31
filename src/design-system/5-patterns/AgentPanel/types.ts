/**
 * AgentPanel Types
 *
 * Shared types for the AgentPanel pattern components.
 */

// =============================================================================
// ThinkingSteps Types
// =============================================================================

export type ThinkingStepStatus = 'pending' | 'active' | 'complete' | 'error';

export interface ThinkingStep {
  id: string;
  /** The title/action of this step */
  title: string;
  /** Current status of the step */
  status: ThinkingStepStatus;
  /** Optional description or result text */
  description?: string;
  /** Error message when status is 'error' */
  result?: string;
  /** Duration in milliseconds (shown when complete) */
  duration?: number;
  /** Progress 0-100 when status is 'active' */
  progress?: number;
}

// =============================================================================
// AgentActionCard Types
// =============================================================================

export type AgentActionType =
  | 'analyze'
  | 'draft'
  | 'route'
  | 'schedule'
  | 'generate'
  | 'update'
  | 'notify';

export type AgentActionStatus = 'proposed' | 'executing' | 'complete' | 'cancelled' | 'error';

export interface AgentActionResult {
  output?: string;
  error?: string;
  artifacts?: string[];
}

export interface AgentAction {
  id: string;
  type: AgentActionType;
  label: string;
  description: string;
  icon?: string;
  status: AgentActionStatus;
  parameters?: Record<string, string>;
  result?: AgentActionResult;
}

// =============================================================================
// AgentCanvas Types
// =============================================================================

export type AgentCanvasMode = 'document' | 'form' | 'visualization' | 'custom';

// =============================================================================
// AgentPanel Types
// =============================================================================

export interface AgentPanelResizeState {
  width: number;
  isResizing: boolean;
}
