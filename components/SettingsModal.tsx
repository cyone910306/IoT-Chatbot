
import React, { useState, useEffect } from 'react';
import { ChatbotStyle, AdvancedChatSettings } from '../types';
import AdvancedChatSettingsForm from './AdvancedChatSettingsForm'; // Import the new component

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: ChatbotStyle;
  onStyleChange: (newStyle: ChatbotStyle) => void;
  onLogout: () => void;
  advancedSettings: AdvancedChatSettings;
  onAdvancedSettingsChange: (settings: AdvancedChatSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentStyle, 
  onStyleChange, 
  onLogout,
  advancedSettings,
  onAdvancedSettingsChange
}) => {
  const [selectedStyle, setSelectedStyle] = useState<ChatbotStyle>(currentStyle);
  const [currentAdvancedSettings, setCurrentAdvancedSettings] = useState<AdvancedChatSettings>(advancedSettings);

  useEffect(() => {
    setSelectedStyle(currentStyle);
  }, [currentStyle]);

  useEffect(() => {
    setCurrentAdvancedSettings(advancedSettings);
  }, [advancedSettings]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onStyleChange(selectedStyle);
    onAdvancedSettingsChange(currentAdvancedSettings);
    onClose(); 
  };

  const handleLogoutClick = () => {
    onLogout();
    onClose(); 
  }

  const styles = [
    { id: ChatbotStyle.DETAILED_ASSISTANT, label: 'AI 비서 상세 답변 스타일', description: '문서 내용을 기반으로 상세하고 논리적인 답변을 제공합니다.' },
    { id: ChatbotStyle.USER_FRIENDLY_SIMPLE, label: '친절한 어린이용 답변 스타일', description: '문서 내용을 쉽고 친근하며, 어린이가 이해하기 쉬운 방식으로 설명합니다.' },
    { id: ChatbotStyle.STRUCTURED_OUTLINE_STYLE, label: '구조화된 개요 답변 스타일', description: '주요 정보를 제목과 설명 형식으로 명확하게 구분하여 제공합니다.' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-modal-title" className="text-2xl font-bold text-gray-800">챗봇 설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="닫기">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <fieldset className="mb-6">
          <legend className="text-lg font-semibold mb-3 text-gray-700">답변 스타일 선택</legend>
          <div className="space-y-4">
            {styles.map((style) => (
              <label 
                key={style.id} 
                htmlFor={style.id} 
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out ${
                  selectedStyle === style.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  id={style.id}
                  name="chatbotStyle"
                  value={style.id}
                  checked={selectedStyle === style.id}
                  onChange={() => setSelectedStyle(style.id)}
                  className="form-radio h-5 w-5 text-blue-600 focus:ring-blue-500 mr-3 mt-0.5"
                />
                <div>
                  <span className="block text-md font-medium text-gray-800">{style.label}</span>
                  <p className="text-sm text-gray-600">{style.description}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        <AdvancedChatSettingsForm 
          settings={currentAdvancedSettings}
          onChange={setCurrentAdvancedSettings}
        />

        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleLogoutClick}
            className="w-full sm:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            aria-label="로그아웃"
          >
            로그아웃
          </button>
          <div className="flex w-full sm:w-auto space-x-3">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              aria-label="설정 닫기"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              aria-label="설정 저장하고 닫기"
            >
              저장하고 닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;