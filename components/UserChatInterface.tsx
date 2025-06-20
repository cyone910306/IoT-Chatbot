
import React, { useState } from 'react';
import { ChatMessage, LoggedInUser } from '../types';
import ChatMessageDisplay from './ChatMessageDisplay';
import LoadingSpinner from './LoadingSpinner';
import { Chat } from '@google/genai';

interface UserChatInterfaceProps {
  loggedInUser: LoggedInUser;
  onLogout: () => void;
  openSettingsModal: () => void;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  handleSendMessage: (messageText: string) => Promise<void>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  chatSession: Chat | null;
  // userInput: string; // Removed
  // setUserInput: (input: string) => void; // Removed
}

const UserChatInterface: React.FC<UserChatInterfaceProps> = ({
  loggedInUser,
  onLogout,
  openSettingsModal,
  chatMessages,
  isLoading,
  error,
  handleSendMessage,
  chatContainerRef,
  chatSession,
}) => {
  const [userInputLocal, setUserInputLocal] = useState<string>(''); 

  const onUserSendMessage = () => {
    if (userInputLocal.trim()) {
      handleSendMessage(userInputLocal);
      setUserInputLocal('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-2xl">
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">내부 문서 챗봇</h1>
          <p className="text-sm opacity-90">Gemini API 제공</p>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium" aria-label={`로그인 사용자: ${loggedInUser.username}`}>
              {loggedInUser.username}님
            </p>
            {loggedInUser.team && (
              <p className="text-xs opacity-80">소속: {loggedInUser.team}</p>
            )}
          </div>
           <button
            onClick={openSettingsModal}
            className="p-2 rounded-full hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="설정 및 로그아웃"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="p-4 flex flex-col flex-grow overflow-hidden">
        <div
          ref={chatContainerRef}
          className="flex-grow space-y-4 overflow-y-auto mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
          style={{ maxHeight: 'calc(100vh - 210px)' }}
          aria-live="polite"
          aria-atomic="false"
        >
          {chatMessages.map((msg) => (
            <ChatMessageDisplay key={msg.id} message={msg} />
          ))}
          {isLoading && chatSession !== null && (
            <div className="flex justify-start">
               <div className="p-3 rounded-lg bg-gray-200 text-gray-800 self-start flex items-center" role="status">
                <LoadingSpinner />
                <span className="ml-2">챗봇이 생각 중입니다...</span>
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mb-2 p-3 bg-red-100 text-red-700 rounded-md text-sm" role="alert">
            <strong>오류:</strong> {error}
          </div>
        )}

        <div className="mt-auto flex items-center border-t border-gray-200 pt-4">
          <input
            type="text"
            value={userInputLocal}
            onChange={(e) => setUserInputLocal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && onUserSendMessage()}
            placeholder={!chatSession ? "관리자가 문서를 설정할 때까지 기다려주세요..." : "문서 내용에 대해 질문하세요..."}
            className="flex-grow p-3 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm disabled:bg-gray-100"
            disabled={isLoading || !chatSession}
            aria-label="사용자 질문 입력"
          />
          <button
            onClick={onUserSendMessage}
            disabled={isLoading || !userInputLocal.trim() || !chatSession}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-150 ease-in-out disabled:bg-gray-400 flex items-center justify-center"
            aria-label={isLoading ? "전송 중" : "질문 전송"}
          >
            {isLoading && chatSession !== null ? <LoadingSpinner/> : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            )}
            <span className="ml-2 sm:inline hidden">전송</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserChatInterface;