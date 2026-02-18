'use client';

import { useCallback, useMemo, DragEvent, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  BackgroundVariant,
  Panel,
  MarkerType,
  useReactFlow,
} from '@xyflow/react';

import { Flow, FlowNode as FlowNodeType } from '@/lib/flow-types';
import { MessageNode } from './nodes/MessageNode';
import { ActionNode } from './nodes/ActionNode';
import { ConditionNode } from './nodes/ConditionNode';
import { InputNode } from './nodes/InputNode';
import { StartNode } from './nodes/StartNode';
import { ErrorNode } from './nodes/ErrorNode';
import { CommentNode } from './nodes/CommentNode';
import { ZoomSlider } from '@/components/zoom-slider';
import { NodePalette, AddNodeButton } from './NodePalette';

// Define custom node types
const nodeTypes: NodeTypes = {
  start: StartNode,
  message: MessageNode,
  action: ActionNode,
  condition: ConditionNode,
  input: InputNode,
  error: ErrorNode,
  comment: CommentNode,
};

interface FlowCanvasProps {
  flow: Flow | null;
  selectedNode: FlowNodeType | null;
  onNodeSelect: (node: FlowNodeType | null) => void;
  onFlowChange?: (flow: Flow) => void;
  onPositionsChange?: (positions: Record<string, { x: number; y: number }>) => void;
  onNodesDataChange?: (nodes: Node[]) => void;
  readOnly?: boolean;
}

// Convert our FlowNode to React Flow Node format
function convertToReactFlowNodes(flowNodes: FlowNodeType[], isDesignMode: boolean): Node[] {
  return flowNodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      title: node.title,
      content: node.content,
      sourceKey: node.sourceKey,
      sourceFile: node.sourceFile,
      buttons: node.buttons,
      parseMode: node.parseMode,
      command: node.command,
      awaitInput: node.awaitInput,
      isDesignMode,
    },
    draggable: !isDesignMode ? false : true,
  }));
}

// Get edge color based on type
function getEdgeColor(type: string | undefined): string {
  switch (type) {
    case 'button': return '#3b82f6';
    case 'condition': return '#f59e0b';
    case 'error': return '#ef4444';
    case 'success': return '#22c55e';
    default: return '#94a3b8';
  }
}

// Convert our FlowEdge to React Flow Edge format
function convertToReactFlowEdges(flowEdges: Flow['edges']): Edge[] {
  return flowEdges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    label: edge.label,
    type: 'smoothstep',
    animated: edge.type === 'button' || edge.type === 'success',
    style: {
      stroke: getEdgeColor(edge.type),
      strokeWidth: 2,
    },
    labelStyle: {
      fontSize: 10,
      fontWeight: 600,
      fill: '#475569',
    },
    labelBgStyle: {
      fill: '#ffffff',
      fillOpacity: 0.95,
    },
    labelBgPadding: [6, 4] as [number, number],
    labelBgBorderRadius: 4,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: getEdgeColor(edge.type),
      width: 20,
      height: 20,
    },
  }));
}

// Generate unique ID for new nodes
let nodeIdCounter = 0;
function generateNodeId(type: string): string {
  nodeIdCounter++;
  return `${type}_new_${Date.now()}_${nodeIdCounter}`;
}

// Create default data for new nodes
function createDefaultNodeData(type: string) {
  const baseData = {
    sourceKey: 'custom.node',
    sourceFile: 'design/custom',
    isDesignMode: true,
  };

  switch (type) {
    case 'message':
      return {
        ...baseData,
        title: 'New Message',
        content: 'Enter your message content here...',
        buttons: [],
      };
    case 'action':
      return {
        ...baseData,
        title: 'New Action',
        content: 'Describe this action...',
      };
    case 'condition':
      return {
        ...baseData,
        title: 'New Condition',
        content: 'What is being checked?',
      };
    case 'input':
      return {
        ...baseData,
        title: 'New Input',
        content: 'What input is expected?',
        awaitInput: true,
      };
    case 'error':
      return {
        ...baseData,
        title: 'New Error',
        content: 'Error message here...',
      };
    case 'comment':
      return {
        ...baseData,
        title: 'Note',
        content: 'Add your comment here...',
        sourceKey: 'comment',
        sourceFile: 'design/notes',
      };
    default:
      return {
        ...baseData,
        title: 'New Node',
        content: 'Node content...',
      };
  }
}

function FlowCanvasInner({
  flow,
  selectedNode,
  onNodeSelect,
  onPositionsChange,
  onNodesDataChange,
  readOnly = false,
}: FlowCanvasProps) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  // Convert flow data to React Flow format
  const initialNodes = useMemo(() => 
    flow ? convertToReactFlowNodes(flow.nodes, !readOnly) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flow, readOnly]
  );
  
  const initialEdges = useMemo(() => 
    flow ? convertToReactFlowEdges(flow.edges) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flow]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle new connections (only in design mode)
  const onConnect = useCallback(
    (params: Connection) => {
      if (!readOnly) {
        setEdges((eds) => addEdge({ 
          ...params, 
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94a3b8',
            width: 20,
            height: 20,
          },
        }, eds));
      }
    },
    [readOnly, setEdges]
  );

  // Handle node click to update selected node
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (flow) {
        const flowNode = flow.nodes.find(n => n.id === node.id);
        onNodeSelect(flowNode || null);
      }
    },
    [flow, onNodeSelect]
  );

  // Handle pane click to deselect
  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  // Handle drag over for dropping new nodes
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop to create new node
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || readOnly) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: generateNodeId(type),
        type,
        position,
        data: createDefaultNodeData(type),
      };

      setNodes((nds) => [...nds, newNode]);
      
      // Notify parent of change
      if (onNodesDataChange) {
        onNodesDataChange([...nodes, newNode]);
      }
    },
    [readOnly, screenToFlowPosition, setNodes, nodes, onNodesDataChange]
  );

  // Track position changes for saving
  const handleNodesChange = useCallback(
    (changes: any) => {
      if (!readOnly) {
        onNodesChange(changes);
        
        // Check if there's a position change (when drag ends)
        const positionChange = changes.find((c: any) => c.type === 'position' && c.dragging === false);
        if (positionChange && onPositionsChange) {
          // Gather all node positions after React Flow processes the change
          setTimeout(() => {
            const positions: Record<string, { x: number; y: number }> = {};
            nodes.forEach(node => {
              positions[node.id] = node.position;
            });
            if (positionChange.position) {
              positions[positionChange.id] = positionChange.position;
            }
            onPositionsChange(positions);
          }, 0);
        }
        
        // Check for data changes
        const dataChange = changes.find((c: any) => c.type === 'reset');
        if (dataChange && onNodesDataChange) {
          onNodesDataChange(nodes);
        }
      }
    },
    [readOnly, onNodesChange, onPositionsChange, onNodesDataChange, nodes]
  );

  // Delete selected nodes
  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (readOnly) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      setNodes(nds => nds.filter(n => !n.selected));
      setEdges(eds => eds.filter(e => !e.selected));
    }
  }, [readOnly, setNodes, setEdges]);

  if (!flow) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        No flow data available
      </div>
    );
  }

  return (
    <div className="h-full w-full" onKeyDown={onKeyDown} tabIndex={0}>
      {/* Node Palette (Design mode only) */}
      {!readOnly && (
        <>
          <NodePalette isOpen={isPaletteOpen} onToggle={() => setIsPaletteOpen(false)} />
          <div className="absolute bottom-4 left-4 z-20">
            <AddNodeButton onClick={() => setIsPaletteOpen(!isPaletteOpen)} />
          </div>
        </>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : handleNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={true}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={['Delete', 'Backspace']}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={1.5}
          color="#cbd5e1"
          style={{ backgroundColor: '#f1f5f9' }}
        />
        <Controls 
          showInteractive={!readOnly}
          className="!bg-white !border !border-slate-200 !rounded-lg !shadow-lg"
        />
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-white !border !border-slate-200 !rounded-lg !shadow-lg"
          maskColor="rgba(241, 245, 249, 0.7)"
          nodeColor={(node) => {
            switch (node.type) {
              case 'start': return '#10b981';
              case 'message': return '#3b82f6';
              case 'action': return '#8b5cf6';
              case 'condition': return '#f59e0b';
              case 'input': return '#06b6d4';
              case 'error': return '#ef4444';
              case 'comment': return '#fbbf24';
              default: return '#94a3b8';
            }
          }}
        />
        
        {/* Custom zoom slider */}
        <Panel position="bottom-right" className="m-4">
          <ZoomSlider />
        </Panel>

        {/* Stats panel */}
        <Panel position="top-right" className="m-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 px-4 py-2.5 text-xs text-slate-600 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="font-semibold">{nodes.length}</span>
              <span className="text-slate-400">nodes</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="font-semibold">{edges.length}</span>
              <span className="text-slate-400">edges</span>
            </div>
          </div>
        </Panel>

        {/* Design mode help */}
        {!readOnly && (
          <Panel position="bottom-center" className="mb-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 px-4 py-2 text-xs text-slate-500 flex items-center gap-3">
              <span>💡 <strong>Double-click</strong> to edit text</span>
              <span className="text-slate-300">|</span>
              <span><strong>Drag</strong> to move nodes</span>
              <span className="text-slate-300">|</span>
              <span><strong>Delete</strong> key to remove</span>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

// Wrapper to provide ReactFlow context
export function FlowCanvas(props: FlowCanvasProps) {
  return <FlowCanvasInner {...props} />;
}
