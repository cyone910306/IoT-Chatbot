
import React from 'react';
import { AdvancedChatSettings, DEFAULT_ADVANCED_SETTINGS } from '../types';

interface AdvancedChatSettingsFormProps {
  settings: AdvancedChatSettings;
  onChange: (newSettings: AdvancedChatSettings) => void;
}

const AdvancedChatSettingsForm: React.FC<AdvancedChatSettingsFormProps> = ({ settings, onChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    onChange({
      ...settings,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  const handleResetToDefaults = () => {
    onChange(DEFAULT_ADVANCED_SETTINGS);
  };

  const settingFields = [
    { name: 'temperature', label: '온도 (Temperature)', min: 0, max: 1, step: 0.01, description: '응답의 무작위성. 높을수록 창의적, 낮을수록 결정적. (기본값: 0.7)' },
    { name: 'topK', label: 'Top-K', min: 1, max: 100, step: 1, description: '다음 토큰 선택 시 고려할 후보 수. (기본값: 40)' },
    { name: 'topP', label: 'Top-P', min: 0, max: 1, step: 0.01, description: '누적 확률이 P가 될 때까지의 토큰만 고려. (기본값: 0.95)' },
    { name: 'maxOutputTokens', label: '최대 응답 토큰', min: 1, max: 8192, step: 1, description: '챗봇 답변의 최대 길이. (기본값: 1024)' },
  ];

  return (
    <fieldset className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <legend className="text-lg font-semibold text-gray-700">고급 챗봇 설정</legend>
        <button
            onClick={handleResetToDefaults}
            type="button"
            className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
            기본값으로 재설정
        </button>
      </div>
      <div className="space-y-4">
        {settingFields.map(field => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label}
              <span className="text-gray-500 text-xs ml-1">({settings[field.name as keyof AdvancedChatSettings]})</span>
            </label>
            <input
              type="range"
              id={field.name}
              name={field.name}
              min={field.min}
              max={field.max}
              step={field.step}
              value={settings[field.name as keyof AdvancedChatSettings]}
              onChange={handleInputChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-1"
            />
            {field.name === 'maxOutputTokens' || field.name === 'topK' ? ( // For fields better suited with number input
                 <input
                    type="number"
                    id={`${field.name}-number`}
                    name={field.name}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={settings[field.name as keyof AdvancedChatSettings]}
                    onChange={handleInputChange}
                    className="w-24 p-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs mt-1"
                />
            ): null}
            <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>
          </div>
        ))}
      </div>
    </fieldset>
  );
};

export default AdvancedChatSettingsForm;