
import React from 'react';
import { ChatMessage, MessageSender } from '../types';

interface ChatMessageDisplayProps {
  message: ChatMessage;
}

const ChatMessageDisplay: React.FC<ChatMessageDisplayProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  const isBot = message.sender === MessageSender.BOT;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const baseClasses = "p-3 rounded-lg max-w-xl break-words";
  const userClasses = "bg-blue-500 text-white self-end";
  const botClasses = "bg-gray-200 text-gray-800 self-start";
  const systemClasses = "bg-yellow-100 text-yellow-700 text-sm italic self-center text-center my-2";

  if (isSystem) {
    return (
      <div className={`${baseClasses} ${systemClasses} w-full md:w-3/4 lg:w-1/2`}>
        <p className="text-xs text-yellow-600 mb-1">시스템 메시지 ({message.timestamp.toLocaleTimeString()})</p>
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`${baseClasses} ${isUser ? userClasses : botClasses}`}
        style={{ overflowWrap: 'break-word', wordWrap: 'break-word', hyphens: 'auto' }}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
      <p className={`text-xs mt-1 ${isUser ? 'text-right pr-1' : 'text-left pl-1'} text-gray-500`}>
        {isUser ? '나' : '챗봇'} ({message.timestamp.toLocaleTimeString()})
      </p>
    </div>
  );
};

export default ChatMessageDisplay;