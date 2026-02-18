'use client';

import { FlowNode, FlowButton } from '@/lib/flow-types';

interface MessageBubbleProps {
  node: FlowNode;
  isBot: boolean;
  onButtonClick?: (button: FlowButton) => void;
}

export function MessageBubble({ node, isBot, onButtonClick }: MessageBubbleProps) {
  // Parse HTML-like tags for display
  const formatContent = (content: string): React.ReactNode => {
    // Simple HTML tag handling for <b>, <i>, <code>
    let formatted = content
      .replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
      .replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
      .replace(/<code>(.*?)<\/code>/g, '<code class="bg-slate-100 px-1 rounded text-sm">$1</code>');
    
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
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
