'use client';

import { memo } from 'react';
import { Position } from '@xyflow/react';
import { BaseHandle } from '@/components/base-handle';

export interface StartNodeData {
  title: string;
  content: string;
  command?: string;
}

interface StartNodeProps {
  data: StartNodeData;
  selected?: boolean;
}

function StartNodeComponent({ data, selected }: StartNodeProps) {
  return (
    <div className={`
      w-48 rounded-xl overflow-hidden
      bg-white border-2 transition-all duration-200
      ${selected 
        ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10' 
        : 'border-emerald-200 shadow-md hover:shadow-lg hover:border-emerald-300'
      }
    `}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center gap-2 justify-center">
        <span className="text-white text-lg">▶️</span>
        <span className="text-white font-bold text-sm">
          {data.title}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3 text-center">
        <p className="text-xs text-slate-600 mb-2">
          {data.content}
        </p>
        {data.command && (
          <span className="inline-block text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-mono font-semibold">
            {data.command}
          </span>
        )}
      </div>

      <BaseHandle 
        type="source" 
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  );
}

export const StartNode = memo(StartNodeComponent);
