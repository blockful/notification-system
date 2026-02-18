'use client';

import { memo, useState, useCallback } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { BaseHandle } from '@/components/base-handle';

export interface ErrorNodeData {
  title: string;
  content: string;
  sourceKey: string;
  sourceFile: string;
  isDesignMode?: boolean;
}

interface ErrorNodeProps {
  id: string;
  data: ErrorNodeData;
  selected?: boolean;
}

function ErrorNodeComponent({ id, data, selected }: ErrorNodeProps) {
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
      w-56 rounded-xl overflow-hidden
      bg-white border-2 transition-all duration-200
      ${selected 
        ? 'border-red-500 shadow-lg shadow-red-500/20 ring-4 ring-red-500/10' 
        : 'border-red-200 shadow-md hover:shadow-lg hover:border-red-300'
      }
    `}>
      <BaseHandle 
        type="target" 
        position={Position.Left}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2.5 flex items-center gap-2">
        <span className="text-white/90 text-base">⚠️</span>
        {data.isDesignMode && isEditingTitle ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') handleTitleSave();
            }}
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
      <div className="px-3 py-1.5 bg-red-50 border-b border-red-100">
        <code className="text-[11px] text-red-600 font-medium">
          {data.sourceKey}
        </code>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5">
        {data.isDesignMode && isEditingContent ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleContentSave}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded p-2 outline-none resize-none min-h-[40px]"
            autoFocus
          />
        ) : (
          <p 
            className={`text-xs text-slate-600 leading-relaxed ${data.isDesignMode ? 'cursor-text hover:bg-slate-50 p-1 -m-1 rounded' : ''}`}
            onDoubleClick={() => data.isDesignMode && setIsEditingContent(true)}
          >
            {data.content}
          </p>
        )}
      </div>

      {/* Retry indicator */}
      <div className="px-3 py-2 bg-red-50 border-t border-red-100">
        <span className="text-[10px] text-red-500 font-medium">
          🔄 User can retry
        </span>
      </div>

      {/* Footer */}
      <div className="px-3 py-1 bg-slate-100/50 border-t border-slate-100 flex items-center gap-1">
        <span className="text-[10px] text-slate-400 truncate font-mono">
          {data.sourceFile?.split('/').slice(-2).join('/')}
        </span>
      </div>

      <BaseHandle 
        type="source" 
        position={Position.Right}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
      />
    </div>
  );
}

export const ErrorNode = memo(ErrorNodeComponent);
