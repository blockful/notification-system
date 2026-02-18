'use client';

import { DragEvent } from 'react';

const nodeTypes = [
  {
    type: 'message',
    label: 'Message',
    icon: '💬',
    color: 'bg-blue-500',
    description: 'Bot message with optional buttons',
  },
  {
    type: 'action',
    label: 'Action',
    icon: '⚡',
    color: 'bg-violet-500',
    description: 'System action or process',
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: '❓',
    color: 'bg-amber-500',
    description: 'Decision branch (Yes/No)',
  },
  {
    type: 'input',
    label: 'Input',
    icon: '✏️',
    color: 'bg-cyan-500',
    description: 'Wait for user text input',
  },
  {
    type: 'error',
    label: 'Error',
    icon: '⚠️',
    color: 'bg-red-500',
    description: 'Error state message',
  },
  {
    type: 'comment',
    label: 'Comment',
    icon: '📝',
    color: 'bg-amber-400',
    description: 'Add notes or annotations',
  },
];

interface NodePaletteProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function NodePalette({ isOpen, onToggle }: NodePaletteProps) {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`
      absolute left-4 top-20 z-20 transition-all duration-300
      ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}
    `}>
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-56 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 text-sm">Add Node</h3>
          <button
            onClick={onToggle}
            className="text-slate-400 hover:text-slate-600 text-lg"
          >
            ×
          </button>
        </div>
        
        <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
          {nodeTypes.map((node) => (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              className="flex items-center gap-3 p-2.5 rounded-lg cursor-grab hover:bg-slate-50 
                         border border-transparent hover:border-slate-200 transition-all
                         active:cursor-grabbing active:scale-95"
            >
              <div className={`w-9 h-9 ${node.color} rounded-lg flex items-center justify-center text-white text-lg shadow-sm`}>
                {node.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-700 text-sm">{node.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{node.description}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center">
            Drag and drop onto canvas
          </p>
        </div>
      </div>
    </div>
  );
}

export function AddNodeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 
                 rounded-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all text-sm"
    >
      <span className="text-lg">➕</span>
      <span className="font-medium text-slate-700">Add Node</span>
    </button>
  );
}
