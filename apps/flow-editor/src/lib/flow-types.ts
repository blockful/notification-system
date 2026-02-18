/**
 * Flow Editor Type Definitions
 * These types represent the conversation flow structure with UX copy
 */

export type NodeType = 'start' | 'message' | 'action' | 'condition' | 'input' | 'error';

export interface FlowButton {
  /** Button label text from code */
  text: string;
  /** ID of the node this button leads to */
  targetNodeId: string;
  /** Source key for traceability (e.g., "uiMessages.buttons.daos") */
  sourceKey?: string;
  /** Action ID used in the code (e.g., "wallet_add") */
  actionId?: string;
}

export interface FlowNode {
  /** Unique identifier for this node */
  id: string;
  /** Type of node */
  type: NodeType;
  /** Display title for the node (e.g., "Welcome Message") */
  title: string;
  /** The actual UX copy content from code */
  content: string;
  /** Source key for traceability (e.g., "uiMessages.welcome") */
  sourceKey: string;
  /** Source file path (e.g., "packages/messages/src/ui/common.ts") */
  sourceFile: string;
  /** Buttons/options available from this node */
  buttons?: FlowButton[];
  /** How Telegram renders the message */
  parseMode?: 'HTML' | 'Markdown';
  /** Position on the canvas (for visual editor) */
  position: {
    x: number;
    y: number;
  };
  /** Whether this node awaits user text input */
  awaitInput?: boolean;
  /** Command that triggers this node (e.g., "/start") */
  command?: string;
  /** Text pattern that triggers this node (e.g., "🌐 DAOs") */
  hearsPattern?: string;
}

export interface FlowEdge {
  /** Unique identifier for this edge */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Source handle ID (for nodes with multiple outputs like condition) */
  sourceHandle?: string;
  /** Edge label (e.g., button text or condition) */
  label?: string;
  /** Type of edge for styling */
  type?: 'default' | 'button' | 'condition' | 'input' | 'error' | 'success';
}

export interface FlowMetadata {
  /** Target platform */
  platform: 'telegram' | 'slack';
  /** Flow version */
  version: string;
  /** When this flow was generated from code */
  generatedAt: string;
  /** When this flow was last saved (for design mode) */
  savedAt?: string;
  /** Commands registered in the bot */
  commands: {
    command: string;
    description: string;
  }[];
  /** Persistent keyboard buttons */
  persistentKeyboard?: string[][];
}

export interface Flow {
  /** All nodes in the flow */
  nodes: FlowNode[];
  /** Connections between nodes */
  edges: FlowEdge[];
  /** Flow metadata */
  metadata: FlowMetadata;
}

/**
 * Message source mapping from code to flow nodes
 */
export interface MessageSource {
  key: string;
  value: string;
  file: string;
  path: string[];
}

/**
 * Draft flow for design mode
 */
export interface FlowDraft extends Flow {
  /** When this draft was last modified */
  lastModified: string;
  /** Original code flow version this was based on */
  basedOnVersion: string;
  /** Whether there are unsaved changes */
  isDirty?: boolean;
}
