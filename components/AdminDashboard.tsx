
import React, { useState, useRef, useCallback, ChangeEvent, DragEvent, useEffect } from 'react';
import { ChatMessage, LoggedInUser, UserCredentials, DocumentSnapshot, FAQEntry } from '../types';
import ChatMessageDisplay from './ChatMessageDisplay';
import LoadingSpinner from './LoadingSpinner';
import { Chat } from '@google/genai';

interface AdminDashboardProps {
  loggedInUser: LoggedInUser;
  onLogout: () => void; // Passed to SettingsModal via App.tsx
  openSettingsModal: () => void;
  currentDocumentContext: string;
  onDocumentUpdate: (newContext: string) => void;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  handleSendMessage: (messageText: string) => Promise<void>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  chatSession: Chat | null;
  faqList: FAQEntry[];
  onFaqUpdate: (updatedFaqs: FAQEntry[]) => void;
}

type AdminView = 'documentManagement' | 'userStatistics' | 'documentHistory' | 'faqManagement';
const MAX_DOC_HISTORY = 10;

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  loggedInUser,
  openSettingsModal,
  currentDocumentContext,
  onDocumentUpdate,
  chatMessages,
  isLoading,
  error,
  handleSendMessage,
  chatContainerRef,
  chatSession,
  faqList,
  onFaqUpdate,
}) => {
  const [editedDocumentContext, setEditedDocumentContext] = useState<string>(currentDocumentContext);
  const [adminUserInput, setAdminUserInput] = useState<string>('');
  const [docActiveTab, setDocActiveTab] = useState<'text' | 'file'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adminView, setAdminView] = useState<AdminView>('documentManagement');
  
  // User Statistics State
  const [allUsers, setAllUsers] = useState<UserCredentials[]>([]);
  const [teamStats, setTeamStats] = useState<Record<string, number>>({});

  // Document History State
  const [documentHistory, setDocumentHistory] = useState<DocumentSnapshot[]>(() => {
    const savedHistory = localStorage.getItem('documentContextHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  // FAQ Management State
  const [editingFaq, setEditingFaq] = useState<FAQEntry | null>(null);
  const [faqKeywordInput, setFaqKeywordInput] = useState('');
  const [faqAnswerInput, setFaqAnswerInput] = useState('');


  useEffect(() => {
    setEditedDocumentContext(currentDocumentContext);
  }, [currentDocumentContext]);

  useEffect(() => {
    if (adminView === 'userStatistics') {
      const savedUsers = localStorage.getItem('appUsers');
      if (savedUsers) {
        const parsedUsers: UserCredentials[] = JSON.parse(savedUsers);
        setAllUsers(parsedUsers);
        const stats: Record<string, number> = {};
        parsedUsers.forEach(user => {
          stats[user.team] = (stats[user.team] || 0) + 1;
        });
        setTeamStats(stats);
      }
    } else if (adminView === 'documentHistory') {
        const savedHistory = localStorage.getItem('documentContextHistory');
        setDocumentHistory(savedHistory ? JSON.parse(savedHistory) : []);
    }
  }, [adminView]);

  const saveDocumentHistory = (history: DocumentSnapshot[]) => {
    localStorage.setItem('documentContextHistory', JSON.stringify(history));
    setDocumentHistory(history);
  };

  const addCurrentContextToHistory = (context: string) => {
    if (!context.trim()) return;
    const newSnapshot: DocumentSnapshot = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      content: context,
      length: context.length,
    };
    // Avoid adding exact same content consecutively
    if (documentHistory.length > 0 && documentHistory[0].content === context) return;

    const updatedHistory = [newSnapshot, ...documentHistory].slice(0, MAX_DOC_HISTORY);
    saveDocumentHistory(updatedHistory);
  };
  
  const submitDocumentUpdate = () => {
    onDocumentUpdate(editedDocumentContext);
    addCurrentContextToHistory(editedDocumentContext); // Add to history on explicit update
  };

  const restoreFromHistory = (snapshot: DocumentSnapshot) => {
    setEditedDocumentContext(snapshot.content);
    alert(`"${new Date(snapshot.timestamp).toLocaleString('ko-KR')}" 시점의 문서 (길이: ${snapshot.length}자)를 편집 영역으로 복원했습니다. '문서 업데이트'를 눌러 적용하세요.`);
    setAdminView('documentManagement'); // Switch to doc management tab for editing
    setDocActiveTab('text');
  };

  // FAQ Handlers
  const handleSaveFAQ = () => {
    if (!faqKeywordInput.trim() || !faqAnswerInput.trim()) {
      alert("키워드와 답변을 모두 입력해주세요.");
      return;
    }
    let updatedFaqs;
    if (editingFaq) { // Edit existing FAQ
      updatedFaqs = faqList.map(faq => 
        faq.id === editingFaq.id ? { ...faq, keyword: faqKeywordInput, answer: faqAnswerInput } : faq
      );
    } else { // Add new FAQ
      const newFaq: FAQEntry = {
        id: `faq-${Date.now()}`,
        keyword: faqKeywordInput,
        answer: faqAnswerInput,
        createdAt: new Date().toISOString(),
      };
      updatedFaqs = [...faqList, newFaq];
    }
    onFaqUpdate(updatedFaqs);
    setEditingFaq(null);
    setFaqKeywordInput('');
    setFaqAnswerInput('');
  };

  const handleEditFAQ = (faq: FAQEntry) => {
    setEditingFaq(faq);
    setFaqKeywordInput(faq.keyword);
    setFaqAnswerInput(faq.answer);
  };

  const handleDeleteFAQ = (faqId: string) => {
    if (window.confirm("정말로 이 FAQ 항목을 삭제하시겠습니까?")) {
      onFaqUpdate(faqList.filter(faq => faq.id !== faqId));
    }
  };

  const handleCancelEditFAQ = () => {
    setEditingFaq(null);
    setFaqKeywordInput('');
    setFaqAnswerInput('');
  };


  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setEditedDocumentContext(e.target.value);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFileContent(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "text/plain") {
      readFileContent(file);
    } else if (file) {
      alert("txt 형식의 파일만 업로드할 수 있습니다.");
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setEditedDocumentContext(text);
      setDocActiveTab('text'); 
    };
    reader.onerror = () => {
      alert("파일을 읽는 중 오류가 발생했습니다.");
    };
    reader.readAsText(file, 'UTF-8');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onAdminSendMessage = () => {
    if (adminUserInput.trim()) {
      handleSendMessage(adminUserInput);
      setAdminUserInput('');
    }
  };

  const handleExportContext = () => {
    if (!currentDocumentContext && !editedDocumentContext) {
      alert("내보낼 문서 컨텍스트가 없습니다. 내용을 입력하거나 파일을 업로드 후 업데이트 해주세요.");
      return;
    }
    const contextToExport = editedDocumentContext || currentDocumentContext;
    if (!contextToExport) {
         alert("내보낼 문서 컨텍스트가 비어있습니다.");
        return;
    }

    const blob = new Blob([contextToExport], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
    link.download = `chatbot_document_context_${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    alert("문서 컨텍스트가 파일로 내보내졌습니다.");
  };

  const handleGenerateShareLink = () => {
    if (!currentDocumentContext) {
      alert("공유할 문서 컨텍스트가 없습니다. 먼저 문서를 업데이트해주세요.");
      return;
    }
    const encodedContext = encodeURIComponent(currentDocumentContext);
    // URL 해시를 사용하여 링크 생성
    const shareUrl = `${window.location.origin}${window.location.pathname}#contextData=${encodedContext}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert("공유 링크가 클립보드에 복사되었습니다!\n" + shareUrl);
      })
      .catch(err => {
        console.error("클립보드 복사 실패:", err);
        alert("공유 링크를 클립보드에 복사하는데 실패했습니다. 수동으로 복사해주세요:\n" + shareUrl);
      });
  };

  const AdminDashboardTabs: React.FC = () => (
    <div className="border-b border-gray-200 bg-slate-100">
      <nav className="-mb-px flex space-x-6 px-4 overflow-x-auto" aria-label="Tabs">
        {[
          { id: 'documentManagement', label: '문서 및 챗봇 관리' },
          { id: 'documentHistory', label: '문서 이력 관리' },
          { id: 'faqManagement', label: 'FAQ 및 빠른 답변' },
          { id: 'userStatistics', label: '사용자 관리' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAdminView(tab.id as AdminView)}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${
              adminView === tab.id
                ? 'border-slate-500 text-slate-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            aria-current={adminView === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto bg-white shadow-2xl">
      <header className="bg-slate-700 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium" aria-label={`로그인 사용자: ${loggedInUser.username}`}>
              관리자 {loggedInUser.username}님
            </p>
          </div>
          <button
            onClick={openSettingsModal}
            className="p-2 rounded-full hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="설정 및 로그아웃"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <AdminDashboardTabs />

      {adminView === 'documentManagement' && (
        <div className="flex flex-col md:flex-row flex-grow overflow-hidden p-1">
          <div className="w-full md:w-1/3 p-3 border-r border-gray-200 flex flex-col bg-slate-50">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">문서 컨텍스트 관리</h2>
            <p className="text-xs text-gray-500 mb-2">
              챗봇 답변의 기반이 될 문서 내용을 관리합니다. <br/>
              <strong>중요:</strong> 변경사항은 "문서 업데이트" 버튼을 눌러야 적용 및 저장됩니다.
            </p>
            <div role="tablist" aria-label="문서 입력 방식 선택" className="flex border-b border-gray-300 mb-2">
              <button role="tab" aria-selected={docActiveTab === 'text'} onClick={() => setDocActiveTab('text')}
                className={`py-2 px-3 font-medium text-sm focus:outline-none -mb-px ${docActiveTab === 'text' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                텍스트 입력
              </button>
              <button role="tab" aria-selected={docActiveTab === 'file'} onClick={() => setDocActiveTab('file')}
                className={`py-2 px-3 font-medium text-sm focus:outline-none -mb-px ${docActiveTab === 'file' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                파일 업로드 (.txt)
              </button>
            </div>
            <div className="flex-grow flex flex-col">
              <div role="tabpanel" className={`${docActiveTab === 'text' ? 'flex flex-col flex-grow' : 'hidden'}`}>
                <textarea value={editedDocumentContext} onChange={handleTextareaChange} placeholder="문서 내용을 여기에 붙여넣으세요..."
                  className="w-full flex-grow p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-sm text-sm" style={{minHeight: '120px'}}/>
              </div>
              <div role="tabpanel" className={`${docActiveTab === 'file' ? 'flex flex-col flex-grow' : 'hidden'}`}>
                <div className="p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 cursor-pointer flex-grow flex flex-col justify-center items-center text-center bg-gray-100 hover:bg-gray-200 transition-colors"
                  onClick={triggerFileInput} onDrop={handleDrop} onDragOver={handleDragOver} style={{minHeight: '120px'}}>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt,text/plain" className="hidden"/>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h2a4 4 0 014 4v1m0 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v3m0 0v3a2 2 0 002 2h2a2 2 0 002-2v-3m0 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v3m6 9l-3-3m0 0l-3 3m3-3v6m6-6l3 3m0 0l-3-3m3 3V9a2 2 0 00-2-2h-2c-.39 0-.77.062-1.13.175" /></svg>
                  <p className="text-gray-600 text-sm">.txt 파일을 드래그하거나 클릭</p>
                  <p className="text-xs text-gray-500 mt-1">업로드 후 '문서 업데이트' 필요</p>
                </div>
              </div>
            </div>
            <div className="mt-auto pt-2 space-y-2">
              <button onClick={submitDocumentUpdate} disabled={isLoading && currentDocumentContext === editedDocumentContext}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-sm">
                문서 업데이트 및 챗봇 재시작
              </button>
              <button onClick={handleExportContext} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm">
                현재 컨텍스트 파일로 내보내기
              </button>
               <button onClick={handleGenerateShareLink} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm">
                공유 링크 생성 (현재 컨텍스트)
              </button>
              <p className="text-xs text-gray-500 pt-1 text-right">편집: {editedDocumentContext.length}자 (저장됨: {currentDocumentContext.length}자)</p>
              {currentDocumentContext !== editedDocumentContext && (
                <p className="text-xs text-orange-600 text-center bg-orange-100 p-1 rounded">편집된 내용 미저장. "문서 업데이트" 필요.</p>
              )}
            </div>
          </div>
          <div className="w-full md:w-2/3 p-3 flex flex-col">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">챗봇 테스트 (관리자)</h2>
            <div ref={chatContainerRef} className="flex-grow space-y-3 overflow-y-auto mb-3 p-3 bg-gray-100 rounded-lg border border-gray-200" style={{ maxHeight: 'calc(100vh - 380px)' }} aria-live="polite" aria-atomic="false">
              {chatMessages.map((msg) => (<ChatMessageDisplay key={msg.id} message={msg} />))}
              {isLoading && chatSession !== null && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-lg bg-gray-200 text-gray-800 self-start flex items-center shadow" role="status">
                    <LoadingSpinner /><span className="ml-2">챗봇이 생각 중입니다...</span>
                  </div>
                </div>
              )}
            </div>
            {error && (<div className="mb-2 p-2 bg-red-100 text-red-700 border border-red-200 rounded-md text-sm" role="alert"><strong>오류:</strong> {error}</div>)}
            <div className="mt-auto flex items-center border-t border-gray-200 pt-3">
              <input type="text" value={adminUserInput} onChange={(e) => setAdminUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isLoading && onAdminSendMessage()}
                placeholder={!chatSession && currentDocumentContext.trim() ? "문서 업데이트 후 채팅 활성화..." : !chatSession ? "문서를 먼저 제공해주세요..." : "질문 입력..."}
                className="flex-grow p-2.5 border border-gray-300 rounded-l-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm disabled:bg-gray-100 text-sm"
                disabled={isLoading || !chatSession} aria-label="관리자 질문 입력"/>
              <button onClick={onAdminSendMessage} disabled={isLoading || !adminUserInput.trim() || !chatSession}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-400 flex items-center justify-center text-sm">
                {isLoading && chatSession !== null ? <LoadingSpinner/> : (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" /></svg>)}
                <span className="ml-1.5 sm:inline hidden">전송</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {adminView === 'documentHistory' && (
        <div className="p-4 md:p-6 overflow-y-auto flex-grow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">문서 컨텍스트 이력</h2>
          <p className="text-sm text-gray-600 mb-4">최근 {MAX_DOC_HISTORY}개의 문서 업데이트 이력을 보여줍니다. 이전 내용으로 복원할 수 있습니다.</p>
          {documentHistory.length === 0 ? (
            <p className="text-gray-500">저장된 문서 이력이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {documentHistory.map((snapshot) => (
                <div key={snapshot.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs text-gray-500">저장 시각: {new Date(snapshot.timestamp).toLocaleString('ko-KR')}</p>
                  <p className="text-xs text-gray-500 mb-1">문서 길이: {snapshot.length}자</p>
                  <p className="text-sm text-gray-700 truncate whitespace-pre-wrap max-h-20 overflow-hidden" title={snapshot.content}>
                    {snapshot.content.substring(0, 200)}{snapshot.content.length > 200 ? '...' : ''}
                  </p>
                  <button
                    onClick={() => restoreFromHistory(snapshot)}
                    className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    이 버전으로 편집 영역 복원
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {adminView === 'faqManagement' && (
        <div className="p-4 md:p-6 overflow-y-auto flex-grow">
          <h2 className="text-xl font-semibold mb-1 text-gray-700">FAQ 및 빠른 답변 관리</h2>
          <p className="text-sm text-gray-600 mb-3">자주 묻는 질문(키워드 기반)에 대한 고정 답변을 설정합니다. 사용자 질문에 키워드가 포함되면 이 답변이 우선적으로 제공됩니다.</p>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow mb-6">
            <h3 className="text-lg font-medium mb-2 text-slate-700">{editingFaq ? 'FAQ 수정' : '새 FAQ 추가'}</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="faqKeyword" className="block text-sm font-medium text-slate-600 mb-0.5">키워드 (쉼표로 구분하여 여러 개 입력 가능)</label>
                <input type="text" id="faqKeyword" value={faqKeywordInput} onChange={(e) => setFaqKeywordInput(e.target.value)}
                  placeholder="예: 가격,위치,업무시간"
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
              </div>
              <div>
                <label htmlFor="faqAnswer" className="block text-sm font-medium text-slate-600 mb-0.5">답변</label>
                <textarea id="faqAnswer" value={faqAnswerInput} onChange={(e) => setFaqAnswerInput(e.target.value)}
                  placeholder="키워드에 해당하는 답변을 입력하세요." rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"/>
              </div>
              <div className="flex space-x-2">
                <button onClick={handleSaveFAQ} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1.5 px-3 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {editingFaq ? '수정 저장' : 'FAQ 추가'}
                </button>
                {editingFaq && (
                  <button onClick={handleCancelEditFAQ} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-1.5 px-3 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                    취소
                  </button>
                )}
              </div>
            </div>
          </div>

          <h3 className="text-lg font-medium mb-2 text-gray-600">등록된 FAQ 목록 ({faqList.length}개)</h3>
          {faqList.length === 0 ? (
            <p className="text-gray-500">등록된 FAQ가 없습니다.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {faqList.map(faq => (
                <div key={faq.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500">등록일: {new Date(faq.createdAt).toLocaleDateString('ko-KR')}</p>
                  <p className="text-sm font-semibold text-indigo-700">키워드: <span className="font-normal text-gray-700">{faq.keyword}</span></p>
                  <p className="text-sm text-gray-700 mt-0.5">답변: {faq.answer}</p>
                  <div className="mt-1.5 space-x-2">
                    <button onClick={() => handleEditFAQ(faq)} className="text-xs text-blue-600 hover:text-blue-800">수정</button>
                    <button onClick={() => handleDeleteFAQ(faq.id)} className="text-xs text-red-600 hover:text-red-800">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {adminView === 'userStatistics' && (
        <div className="p-4 md:p-6 overflow-y-auto flex-grow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">사용자 관리 및 통계</h2>
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-md font-semibold text-yellow-700 mb-1">통계 정보 안내</h3>
            <p className="text-sm text-yellow-600">이 통계는 브라우저의 로컬 저장소(localStorage)를 기반으로 제공되며, 몇 가지 한계점이 있습니다:</p>
            <ul className="list-disc list-inside text-xs text-yellow-600 mt-1 space-y-0.5">
              <li><strong>마지막 로그인:</strong> 현재 브라우저 세션에서 기록된 마지막 로그인 시간입니다.</li>
              <li><strong>정확한 사용 빈도 및 전체 체류 시간:</strong> 별도의 서버 기록이 없어 제공되지 않습니다.</li>
              <li><strong>질문 빈도 통계:</strong> 제공되지 않습니다.</li>
              <li>데이터는 관리자님의 브라우저에만 저장되며, 다른 관리자와 공유되지 않습니다.</li>
            </ul>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">팀별 가입자 수</h3>
              {Object.keys(teamStats).length > 0 ? (
                <ul className="space-y-1 text-sm bg-slate-50 p-3 rounded-md border">
                  {Object.entries(teamStats).map(([team, count]) => ( <li key={team} className="flex justify-between"> <span className="text-gray-700">{team}:</span> <span className="font-semibold text-gray-800">{count} 명</span> </li> ))}
                   <li className="flex justify-between pt-1 mt-1 border-t font-bold"> <span className="text-gray-700">총 가입자:</span> <span className="text-gray-800">{allUsers.length} 명</span> </li>
                </ul>
              ) : ( <p className="text-sm text-gray-500 bg-slate-50 p-3 rounded-md border">가입한 사용자가 없습니다.</p> )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">등록된 사용자 목록</h3>
              {allUsers.length > 0 ? (
                <div className="overflow-x-auto max-h-96 bg-white border rounded-md shadow-sm">
                  <table className="min-w-full text-sm divide-y divide-gray-200">
                    <thead className="bg-gray-100 sticky top-0"><tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">아이디</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">소속팀</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">마지막 로그인</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-200">
                      {allUsers.map((user) => ( <tr key={user.username} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-gray-800">{user.username}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-700">{user.team}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-600">{user.lastLogin ? new Date(user.lastLogin).toLocaleString('ko-KR') : '기록 없음'}</td>
                      </tr>))}
                    </tbody>
                  </table>
                </div>
              ) : ( <p className="text-sm text-gray-500 bg-slate-50 p-3 rounded-md border">가입한 사용자가 없습니다.</p> )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;