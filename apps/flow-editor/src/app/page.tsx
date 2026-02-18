'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from '@/components/flow-editor/FlowCanvas';
import { TelegramPreview } from '@/components/telegram-preview/TelegramPreview';
import { TabSwitcher } from '@/components/TabSwitcher';
import { Flow, FlowNode } from '@/lib/flow-types';

type TabType = 'code' | 'design';

const STORAGE_KEY = 'flow-editor-design-positions';
const STORAGE_FLOW_KEY = 'flow-editor-design-flow';

// Load saved positions from localStorage
function loadSavedPositions(): Record<string, { x: number; y: number }> | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Save positions to localStorage
function savePositions(positions: Record<string, { x: number; y: number }>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (e) {
    console.error('Failed to save positions:', e);
  }
}

// Load saved design flow from localStorage
function loadSavedFlow(): Flow | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_FLOW_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Save design flow to localStorage
function saveFlow(flow: Flow) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_FLOW_KEY, JSON.stringify(flow));
  } catch (e) {
    console.error('Failed to save flow:', e);
  }
}

// Apply saved positions to flow
function applyPositionsToFlow(flow: Flow, positions: Record<string, { x: number; y: number }>): Flow {
  return {
    ...flow,
    nodes: flow.nodes.map(node => ({
      ...node,
      position: positions[node.id] || node.position,
    })),
  };
}

export default function FlowEditorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('code');
  const [codeFlow, setCodeFlow] = useState<Flow | null>(null);
  const [designFlow, setDesignFlow] = useState<Flow | null>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const flowCanvasRef = useRef<HTMLDivElement>(null);

  // Load saved flow from localStorage on mount (before fetching)
  useEffect(() => {
    const savedFlow = loadSavedFlow();
    if (savedFlow) {
      setDesignFlow(savedFlow);
      if (savedFlow.metadata?.savedAt) {
        setLastSaved(new Date(savedFlow.metadata.savedAt));
      }
    }
  }, []);

  // Fetch code flow from API
  const fetchCodeFlow = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const response = await fetch('/api/flow/current');
      if (!response.ok) throw new Error('Failed to fetch flow');
      const flow: Flow = await response.json();
      
      // Always update code flow
      setCodeFlow(flow);
      
      // Only initialize design flow if it doesn't exist yet
      setDesignFlow(prev => {
        if (prev) return prev; // Keep existing design flow
        
        // Check for saved positions
        const savedPositions = loadSavedPositions();
        if (savedPositions) {
          return applyPositionsToFlow(flow, savedPositions);
        }
        
        // Deep clone the code flow for design
        return JSON.parse(JSON.stringify(flow));
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Fetch the current flow from code on mount
  useEffect(() => {
    fetchCodeFlow(true);
  }, [fetchCodeFlow]);

  const handleNodeSelect = (node: FlowNode | null) => {
    setSelectedNode(node);
  };

  // Handle position changes from canvas (design mode only)
  const handlePositionsChange = useCallback((positions: Record<string, { x: number; y: number }>) => {
    // Save positions immediately
    savePositions(positions);
    
    // Update design flow with new positions
    setDesignFlow(prev => {
      if (!prev) return prev;
      return applyPositionsToFlow(prev, positions);
    });
    
    setHasUnsavedChanges(true);
  }, []);

  // Handle node data changes (title, content edits, new nodes)
  const handleNodesDataChange = useCallback((nodes: any[]) => {
    setDesignFlow(prev => {
      if (!prev) return prev;
      
      // Map React Flow nodes back to our FlowNode format
      const updatedNodes: FlowNode[] = nodes.map(node => ({
        id: node.id,
        type: node.type as FlowNode['type'],
        title: node.data.title,
        content: node.data.content,
        sourceKey: node.data.sourceKey || 'custom.node',
        sourceFile: node.data.sourceFile || 'design/custom',
        position: node.position,
        buttons: node.data.buttons,
        parseMode: node.data.parseMode,
        command: node.data.command,
        awaitInput: node.data.awaitInput,
      }));
      
      return {
        ...prev,
        nodes: updatedNodes,
      };
    });
    
    setHasUnsavedChanges(true);
  }, []);

  // Save design to localStorage
  const handleSaveDesign = useCallback(() => {
    if (!designFlow) return;
    
    const flowToSave: Flow = {
      ...designFlow,
      metadata: {
        ...designFlow.metadata,
        savedAt: new Date().toISOString(),
      },
    };
    
    saveFlow(flowToSave);
    
    // Also save positions separately
    const positions: Record<string, { x: number; y: number }> = {};
    designFlow.nodes.forEach(node => {
      positions[node.id] = node.position;
    });
    savePositions(positions);
    
    setHasUnsavedChanges(false);
    setLastSaved(new Date());
  }, [designFlow]);

  // Reset design to code version
  const handleResetDesign = useCallback(() => {
    if (!codeFlow) return;
    if (!confirm('Reset design to match current code? This will discard all your changes.')) return;
    
    setDesignFlow(JSON.parse(JSON.stringify(codeFlow)));
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_FLOW_KEY);
    setHasUnsavedChanges(false);
    setLastSaved(null);
  }, [codeFlow]);

  // Export to JSON
  const handleExportJSON = useCallback(() => {
    const flow = activeTab === 'code' ? codeFlow : designFlow;
    if (!flow) return;
    
    const dataStr = JSON.stringify(flow, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-${activeTab}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeTab, codeFlow, designFlow]);

  // Export to PDF
  const handleExportPDF = useCallback(async () => {
    if (!flowCanvasRef.current) return;
    
    setIsExporting(true);
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      // Find the React Flow viewport
      const viewport = flowCanvasRef.current.querySelector('.react-flow__viewport');
      if (!viewport) throw new Error('Could not find flow viewport');
      
      // Capture the canvas
      const canvas = await html2canvas(viewport as HTMLElement, {
        backgroundColor: '#f1f5f9',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`flow-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [activeTab]);

  const handleRefresh = () => {
    fetchCodeFlow(false);
  };

  const currentFlow = activeTab === 'code' ? codeFlow : designFlow;
  const isReadOnly = activeTab === 'code';

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              Notification Bot Flow Editor
            </h1>
            <p className="text-xs text-slate-500">
              Review and design the conversation flow with UX copy
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
            
            {activeTab === 'design' && (
              <>
                {/* Save status indicator */}
                <div className="flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-3">
                  {hasUnsavedChanges ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Unsaved changes
                    </span>
                  ) : lastSaved ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  ) : null}
                </div>

                <button
                  onClick={handleSaveDesign}
                  disabled={!hasUnsavedChanges}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    hasUnsavedChanges
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  💾 Save
                </button>
                
                <button
                  onClick={handleResetDesign}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  ↩️ Reset
                </button>
              </>
            )}
            
            {/* Export dropdown */}
            <div className="relative group">
              <button
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Exporting...
                  </>
                ) : (
                  <>📤 Export</>
                )}
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
                <button
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  📄 Export JSON
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                >
                  📑 Export PDF
                </button>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-500">Loading flow...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4 text-red-700">
              <span className="font-semibold">Error:</span> {error}
            </div>
          </div>
        ) : (
          <>
            {/* Flow Canvas */}
            <div className="flex-1 relative" ref={flowCanvasRef}>
              {isReadOnly && (
                <div className="absolute top-4 left-4 z-10 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <span>Code View</span>
                  <span className="text-amber-600 text-xs">(read-only)</span>
                </div>
              )}
              {!isReadOnly && (
                <div className="absolute top-4 left-4 z-10 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2">
                  <span className="text-lg">✏️</span>
                  <span>Design Mode</span>
                  <span className="text-emerald-600 text-xs">• Drag nodes to reposition</span>
                </div>
              )}
              
              {/* Separate ReactFlowProvider for each tab to isolate state */}
              {activeTab === 'code' && codeFlow && (
                <ReactFlowProvider key="code-flow">
                  <FlowCanvas
                    flow={codeFlow}
                    selectedNode={selectedNode}
                    onNodeSelect={handleNodeSelect}
                    readOnly={true}
                  />
                </ReactFlowProvider>
              )}
              
              {activeTab === 'design' && designFlow && (
                <ReactFlowProvider key="design-flow">
                  <FlowCanvas
                    flow={designFlow}
                    selectedNode={selectedNode}
                    onNodeSelect={handleNodeSelect}
                    onPositionsChange={handlePositionsChange}
                    onNodesDataChange={handleNodesDataChange}
                    readOnly={false}
                  />
                </ReactFlowProvider>
              )}
            </div>

            {/* Telegram Preview Panel */}
            <div className="w-96 border-l border-slate-200 bg-white shadow-lg">
              <TelegramPreview
                flow={currentFlow}
                selectedNode={selectedNode}
                onNodeSelect={handleNodeSelect}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
