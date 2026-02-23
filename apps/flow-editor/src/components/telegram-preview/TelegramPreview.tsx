'use client';

import { useState, useEffect, useRef } from 'react';
import { Flow, FlowNode, FlowButton } from '@/lib/flow-types';
import { MessageBubble } from './MessageBubble';

interface TelegramPreviewProps {
  flow: Flow | null;
  selectedNode: FlowNode | null;
  onNodeSelect: (node: FlowNode | null) => void;
}

interface ChatMessage {
  id: string;
  node: FlowNode;
  isBot: boolean;
}

export function TelegramPreview({ flow, selectedNode, onNodeSelect }: TelegramPreviewProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with start flow when flow loads
  useEffect(() => {
    if (flow && chatHistory.length === 0) {
      startConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow?.metadata?.generatedAt]);

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const startConversation = () => {
    if (!flow) return;
    
    // Find the start node or welcome node
    const startNode = flow.nodes.find(n => n.id === 'start');
    const welcomeNode = flow.nodes.find(n => n.id === 'welcome');
    
    const messages: ChatMessage[] = [];
    
    if (startNode) {
      messages.push({
        id: 'start-cmd',
        node: {
          ...startNode,
          content: '/start',
          type: 'message',
        },
        isBot: false,
      });
    }
    
    if (welcomeNode) {
      messages.push({
        id: 'welcome-msg',
        node: welcomeNode,
        isBot: true,
      });
      setCurrentNodeId(welcomeNode.id);
      onNodeSelect(welcomeNode);
    }
    
    setChatHistory(messages);
  };

  const handleButtonClick = (button: FlowButton) => {
    if (!flow) return;

    // Add user "click" message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      node: {
        id: `user-action-${Date.now()}`,
        type: 'message',
        title: 'User Action',
        content: button.text,
        sourceKey: '',
        sourceFile: '',
        position: { x: 0, y: 0 },
      },
      isBot: false,
    };

    // Find target node
    const targetNode = flow.nodes.find(n => n.id === button.targetNodeId);
    
    if (targetNode) {
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        node: targetNode,
        isBot: true,
      };
      
      setChatHistory(prev => [...prev, userMessage, botMessage]);
      setCurrentNodeId(targetNode.id);
      onNodeSelect(targetNode);
    } else {
      setChatHistory(prev => [...prev, userMessage]);
    }
  };

  const handleReset = () => {
    setChatHistory([]);
    setCurrentNodeId(null);
    setTimeout(startConversation, 100);
  };

  // Get persistent keyboard from metadata
  const persistentKeyboard = flow?.metadata.persistentKeyboard;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-telegram-blue text-white px-4 py-3 flex items-center">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
          🤖
        </div>
        <div className="flex-1">
          <div className="font-medium">Anticapture Bot</div>
          <div className="text-xs text-white/70">Telegram Preview</div>
        </div>
        <button
          onClick={handleReset}
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded"
        >
          Reset
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto telegram-chat p-4">
        {chatHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Click a node or press Reset to start
          </div>
        ) : (
          <>
            {chatHistory.map(msg => (
              <MessageBubble
                key={msg.id}
                node={msg.node}
                isBot={msg.isBot}
                onButtonClick={handleButtonClick}
              />
            ))}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Persistent Keyboard */}
      {persistentKeyboard && (
        <div className="bg-slate-100 border-t border-slate-200 p-2">
          {persistentKeyboard.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 mb-1 last:mb-0">
              {row.map((buttonText, btnIndex) => {
                // Find the node this button leads to
                const welcomeNode = flow?.nodes.find(n => n.id === 'welcome');
                const button = welcomeNode?.buttons?.find(b => b.text === buttonText);
                
                return (
                  <button
                    key={btnIndex}
                    onClick={() => button && handleButtonClick(button)}
                    className="flex-1 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded text-sm hover:bg-slate-50"
                  >
                    {buttonText}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="bg-slate-800 text-white p-3 text-xs">
          <div className="font-medium text-slate-300 mb-1">Selected Node</div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">{selectedNode.id}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{selectedNode.sourceKey}</span>
          </div>
        </div>
      )}
    </div>
  );
}
