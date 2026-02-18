'use client';

import { memo, useState, useCallback } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { BaseHandle } from '@/components/base-handle';

export interface MessageNodeData {
  title: string;
  content: string;
  sourceKey: string;
  sourceFile: string;
  buttons?: { text: string; targetNodeId: string }[];
  parseMode?: 'HTML' | 'Markdown';
  command?: string;
  isDesignMode?: boolean;
  onDataChange?: (id: string, data: Partial<MessageNodeData>) => void;
}

interface MessageNodeProps {
  id: string;
  data: MessageNodeData;
  selected?: boolean;
}

function MessageNodeComponent({ id, data, selected }: MessageNodeProps) {
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
      min-w-[280px] max-w-[320px] rounded-xl overflow-hidden
      bg-white border-2 transition-all duration-200
      ${selected 
        ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10' 
        : 'border-slate-200 shadow-md hover:shadow-lg hover:border-slate-300'
      }
    `}>
      <BaseHandle 
        type="target" 
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 flex items-center gap-2">
        <span className="text-white/90 text-base">💬</span>
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
            className={`text-white font-semibold text-sm flex-1 truncate ${data.isDesignMode ? 'cursor-text hover:bg-white/10 px-1 rounded' : ''}`}
            onDoubleClick={() => data.isDesignMode && setIsEditingTitle(true)}
          >
            {data.title}
          </span>
        )}
        {data.command && (
          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-mono">
            {data.command}
          </span>
        )}
      </div>

      {/* Source Key */}
      <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100">
        <code className="text-[11px] text-blue-600 font-medium">
          {data.sourceKey}
        </code>
      </div>

      {/* Content */}
      <div className="px-4 py-3 max-h-32 overflow-y-auto">
        {data.isDesignMode && isEditingContent ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleContentSave}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded p-2 outline-none resize-none min-h-[60px]"
            autoFocus
          />
        ) : (
          <p 
            className={`text-xs text-slate-700 whitespace-pre-wrap leading-relaxed ${data.isDesignMode ? 'cursor-text hover:bg-slate-50 p-1 -m-1 rounded' : ''}`}
            onDoubleClick={() => data.isDesignMode && setIsEditingContent(true)}
          >
            {data.content}
          </p>
        )}
      </div>

      {/* Buttons */}
      {data.buttons && data.buttons.length > 0 && (
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5">
            {data.buttons.map((btn, i) => (
              <span
                key={i}
                className="text-[11px] bg-blue-50 border border-blue-200 text-blue-700 
                         px-2.5 py-1 rounded-md flex-grow text-center font-medium
                         hover:bg-blue-100 transition-colors cursor-pointer"
              >
                {btn.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-1.5 bg-slate-100/50 border-t border-slate-100 flex items-center gap-1.5">
        <span className="text-slate-400 text-[10px]">📁</span>
        <span className="text-[10px] text-slate-400 truncate font-mono">
          {data.sourceFile?.split('/').slice(-2).join('/')}
        </span>
        {data.isDesignMode && (
          <span className="ml-auto text-[9px] text-blue-500 font-medium">Double-click to edit</span>
        )}
      </div>

      <BaseHandle 
        type="source" 
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
}

export const MessageNode = memo(MessageNodeComponent);
