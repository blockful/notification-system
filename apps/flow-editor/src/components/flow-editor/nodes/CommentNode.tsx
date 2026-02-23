'use client';

import { memo, useState, useCallback } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { BaseHandle } from '@/components/base-handle';

export interface CommentNodeData {
  title: string;
  content: string;
  sourceKey: string;
  sourceFile: string;
  isDesignMode?: boolean;
  author?: string;
}

interface CommentNodeProps {
  id: string;
  data: CommentNodeData;
  selected?: boolean;
}

function CommentNodeComponent({ id, data, selected }: CommentNodeProps) {
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
      w-56 rounded-lg overflow-hidden
      bg-gradient-to-br from-yellow-50 to-amber-50 border-2 transition-all duration-200
      ${selected 
        ? 'border-amber-400 shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/10' 
        : 'border-amber-200 shadow-md hover:shadow-lg hover:border-amber-300'
      }
      rotate-[0.5deg]
    `}
    style={{
      boxShadow: selected 
        ? '0 10px 25px -5px rgba(251, 191, 36, 0.3), 0 8px 10px -6px rgba(251, 191, 36, 0.2)'
        : '0 4px 6px -1px rgba(251, 191, 36, 0.2), 0 2px 4px -2px rgba(251, 191, 36, 0.1)',
    }}
    >
      {/* Optional handle on left for connecting FROM something */}
      <BaseHandle 
        type="target" 
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-white"
      />
      
      {/* Header - Sticky note style */}
      <div className="bg-gradient-to-r from-amber-400 to-yellow-400 px-3 py-2 flex items-center gap-2">
        <span className="text-white/90 text-sm">📝</span>
        {data.isDesignMode && isEditingTitle ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              e.stopPropagation(); // Prevent React Flow from capturing key events
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
            {data.title || 'Comment'}
          </span>
        )}
      </div>

      {/* Content - Note text */}
      <div 
        className={`px-3 py-3 min-h-[60px] ${data.isDesignMode && !isEditingContent ? 'cursor-text hover:bg-white/30' : ''}`}
        onDoubleClick={() => data.isDesignMode && !isEditingContent && setIsEditingContent(true)}
      >
        {data.isDesignMode && isEditingContent ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleContentSave}
            onKeyDown={(e) => e.stopPropagation()} // Prevent React Flow from capturing key events
            className="w-full text-sm text-amber-900 leading-relaxed bg-white/50 border border-amber-200 rounded p-2 outline-none resize-none min-h-[60px]"
            placeholder="Add your comment here..."
            autoFocus
          />
        ) : (
          <p 
            className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap min-h-[40px]"
            style={{ fontFamily: "'Caveat', cursive, system-ui" }}
          >
            {data.content || (
              <span className="text-amber-400 italic">
                {data.isDesignMode ? 'Double-click to edit...' : '(empty)'}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Footer - Author info if present */}
      {data.author && (
        <div className="px-3 py-1.5 bg-amber-100/50 border-t border-amber-200/50 flex items-center gap-1">
          <span className="text-amber-500 text-[10px]">👤</span>
          <span className="text-[10px] text-amber-600 font-medium">
            {data.author}
          </span>
        </div>
      )}

      {/* Optional handle on right for connecting TO something */}
      <BaseHandle 
        type="source" 
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-white"
      />
    </div>
  );
}

export const CommentNode = memo(CommentNodeComponent);
