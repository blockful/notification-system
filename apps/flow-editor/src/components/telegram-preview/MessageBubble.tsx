'use client';

import { FlowNode, FlowButton } from '@/lib/flow-types';

interface MessageBubbleProps {
  node: FlowNode;
  isBot: boolean;
  onButtonClick?: (button: FlowButton) => void;
}

export function MessageBubble({ node, isBot, onButtonClick }: MessageBubbleProps) {
  // Parse HTML-like tags for display using React elements (safe, no raw HTML injection)
  const formatContent = (content: string): React.ReactNode => {
    const parts = content.split(/(<b>.*?<\/b>|<i>.*?<\/i>|<code>.*?<\/code>)/g);
    return parts.map((part, i) => {
      const bold = part.match(/^<b>(.*?)<\/b>$/);
      if (bold) return <strong key={i}>{bold[1]}</strong>;
      const italic = part.match(/^<i>(.*?)<\/i>$/);
      if (italic) return <em key={i}>{italic[1]}</em>;
      const code = part.match(/^<code>(.*?)<\/code>$/);
      if (code) return <code key={i} className="bg-slate-100 px-1 rounded text-sm">{code[1]}</code>;
      return part;
    });
  };

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`max-w-[85%] ${isBot ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`
            px-3 py-2 text-sm
            ${isBot ? 'telegram-bubble-bot' : 'telegram-bubble-user'}
          `}
        >
          <div className="whitespace-pre-wrap leading-relaxed">
            {formatContent(node.content)}
          </div>
          
          {/* Timestamp */}
          <div className="text-right mt-1">
            <span className="text-[10px] text-slate-400">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Inline buttons (if any) */}
        {node.buttons && node.buttons.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {node.buttons.map((btn, i) => (
              <button
                key={i}
                onClick={() => onButtonClick?.(btn)}
                className="telegram-button flex-1 min-w-[45%] px-3 py-2 text-sm font-medium"
              >
                {btn.text}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Bot avatar */}
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-telegram-blue flex items-center justify-center text-white text-xs font-bold mr-2 order-1 flex-shrink-0">
          AC
        </div>
      )}
    </div>
  );
}
