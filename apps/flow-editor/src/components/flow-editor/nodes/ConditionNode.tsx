'use client';

import { memo, useState, useCallback } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { BaseHandle } from '@/components/base-handle';

export interface ConditionNodeData {
  title: string;
  content: string;
  sourceKey: string;
  sourceFile: string;
  isDesignMode?: boolean;
}

interface ConditionNodeProps {
  id: string;
  data: ConditionNodeData;
  selected?: boolean;
}

function ConditionNodeComponent({ id, data, selected }: ConditionNodeProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [editContent, setEditContent] = useState(data.content);
  const { setNodes } = useReactFlow();

  const handleTitleSave = useCallback(() => {
    setIsEditingTitle(false);
    if (editTitle !== data.title) {
      setNodes(nodes => nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, title: editTitle } }
          : node
      ));
    }
  }, [id, editTitle, data.title, setNodes]);

  const handleContentSave = useCallback(() => {
    setIsEditingContent(false);
    if (editContent !== data.content) {
      setNodes(nodes => nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, content: editContent } }
          : node
      ));
    }
  }, [id, editContent, data.content, setNodes]);

  return (
    <div className={`
      w-52 rounded-xl overflow-hidden
      bg-white border-2 transition-all duration-200
      ${selected 
        ? 'border-amber-500 shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/10' 
        : 'border-amber-200 shadow-md hover:shadow-lg hover:border-amber-300'
      }
    `}>
      <BaseHandle 
        type="target" 
        position={Position.Left}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 flex items-center gap-2">
        <span className="text-white/90 text-base">❓</span>
        {data.isDesignMode && isEditingTitle ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            className="flex-1 bg-white/20 text-white text-sm font-semibold px-2 py-0.5 rounded outline-none"
            autoFocus
          />
        ) : (
          <span 
            className={`text-white font-semibold text-sm truncate ${data.isDesignMode ? 'cursor-text hover:bg-white/10 px-1 rounded' : ''}`}
            onDoubleClick={() => data.isDesignMode && setIsEditingTitle(true)}
          >
            {data.title}
          </span>
        )}
      </div>

      {/* Source Key */}
      <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-100">
        <code className="text-[11px] text-amber-700 font-medium">
          {data.sourceKey}
        </code>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 text-center">
        {data.isDesignMode && isEditingContent ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleContentSave}
            className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-2 outline-none resize-none min-h-[40px] text-center"
            autoFocus
          />
        ) : (
          <p 
            className={`text-xs text-slate-600 ${data.isDesignMode ? 'cursor-text hover:bg-slate-50 p-1 -m-1 rounded' : ''}`}
            onDoubleClick={() => data.isDesignMode && setIsEditingContent(true)}
          >
            {data.content}
          </p>
        )}
      </div>

      {/* Branch indicators */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex justify-between text-[10px] font-semibold">
        <span className="text-emerald-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Yes
        </span>
        <span className="text-red-500 flex items-center gap-1">
          No
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
        </span>
      </div>

      {/* Footer */}
      <div className="px-3 py-1 bg-slate-100/50 border-t border-slate-100 flex items-center gap-1">
        <span className="text-[10px] text-slate-400 truncate font-mono">
          {data.sourceFile?.split('/').slice(-2).join('/')}
        </span>
      </div>

      {/* Yes handle */}
      <BaseHandle 
        type="source" 
        position={Position.Right} 
        id="yes"
        style={{ top: '40%' }}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />
      {/* No handle */}
      <BaseHandle 
        type="source" 
        position={Position.Right} 
        id="no"
        style={{ top: '70%' }}
        className="!w-3 !h-3 !bg-red-400 !border-2 !border-white"
      />
    </div>
  );
}

export const ConditionNode = memo(ConditionNodeComponent);
