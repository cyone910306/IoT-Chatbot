
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat }  from '@google/genai';
import { ChatMessage, MessageSender, LoggedInUser, ChatbotStyle, AdvancedChatSettings, DEFAULT_ADVANCED_SETTINGS, FAQEntry } from './types';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import UserChatInterface from './components/UserChatInterface';
import SettingsModal from './components/SettingsModal';
import { truncateInputForAI } from './utils'; // Assuming utils.ts exists

const API_KEY = process.env.API_KEY;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);

  const [documentContext, setDocumentContext] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  const [chatbotStyle, setChatbotStyle] = useState<ChatbotStyle>(() => {
    const storedStyle = localStorage.getItem('chatbotStyle') as ChatbotStyle;
    return storedStyle || ChatbotStyle.DETAILED_ASSISTANT;
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  const [advancedChatSettings, setAdvancedChatSettings] = useState<AdvancedChatSettings>(() => {
    const storedSettings = localStorage.getItem('advancedChatSettings');
    return storedSettings ? JSON.parse(storedSettings) : DEFAULT_ADVANCED_SETTINGS;
  });

  const [faqList, setFaqList] = useState<FAQEntry[]>(() => {
    const storedFaqs = localStorage.getItem('faqList');
    return storedFaqs ? JSON.parse(storedFaqs) : [];
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('advancedChatSettings', JSON.stringify(advancedChatSettings));
  }, [advancedChatSettings]);

  useEffect(() => {
    localStorage.setItem('faqList', JSON.stringify(faqList));
  }, [faqList]);
  
  useEffect(() => {
    // 우선 URL 해시에서 contextData 읽기 시도
    if (window.location.hash && window.location.hash.startsWith('#contextData=')) {
      const encodedContextFromHash = window.location.hash.substring('#contextData='.length);
      if (encodedContextFromHash) {
        try {
          const decodedContext = decodeURIComponent(encodedContextFromHash);
          setDocumentContext(decodedContext);
          localStorage.setItem('documentContext', decodedContext);
          // URL에서 해시 제거하여 깔끔하게 만듦
          window.history.replaceState({}, '', window.location.pathname + window.location.search); 
        } catch (e) {
          console.error("URL 해시 contextData 디코딩 오류:", e);
          // 해시 디코딩 실패 시 localStorage에서 로드 시도 (폴백)
          const storedDocumentContext = localStorage.getItem('documentContext');
          if (storedDocumentContext) {
            setDocumentContext(storedDocumentContext);
          }
        }
      }
    } else { 
      // 해시에 contextData가 없으면 기존처럼 localStorage에서 로드
      const storedDocumentContext = localStorage.getItem('documentContext');
      if (storedDocumentContext) {
        setDocumentContext(storedDocumentContext);
      }
    }

    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedAuth === 'true' && storedUser) {
      const parsedUser: LoggedInUser = JSON.parse(storedUser);
      setIsAuthenticated(true);
      setLoggedInUser(parsedUser);
    }

    const storedStyle = localStorage.getItem('chatbotStyle') as ChatbotStyle;
    if (storedStyle) {
        setChatbotStyle(storedStyle);
    }
    
    const storedAdvSettings = localStorage.getItem('advancedChatSettings');
    if (storedAdvSettings) {
        setAdvancedChatSettings(JSON.parse(storedAdvSettings));
    }

    const storedFaqs = localStorage.getItem('faqList');
    if (storedFaqs) {
        setFaqList(JSON.parse(storedFaqs));
    }


    if (!API_KEY) {
      setError("API_KEY 환경 변수가 설정되지 않았습니다. 챗봇을 사용하려면 배포 환경에서 설정해주세요.");
      console.error("API_KEY environment variable not set. This must be set in the deployment environment (e.g., Vercel).");
      return;
    }
    try {
      const genAI = new GoogleGenAI({ apiKey: API_KEY });
      setAi(genAI);
    } catch (e) {
      console.error("GoogleGenAI 초기화 실패:", e);
      setError(`AI 서비스 초기화 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  const handleChatbotStyleChange = (newStyle: ChatbotStyle) => {
    setChatbotStyle(newStyle);
    localStorage.setItem('chatbotStyle', newStyle);
    
    let styleName = "";
    if (newStyle === ChatbotStyle.DETAILED_ASSISTANT) {
        styleName = "AI 비서 상세 답변";
    } else if (newStyle === ChatbotStyle.USER_FRIENDLY_SIMPLE) {
        styleName = "친절한 어린이용 답변";
    } else if (newStyle === ChatbotStyle.STRUCTURED_OUTLINE_STYLE) {
        styleName = "구조화된 개요 답변";
    }

    setChatMessages(prev => {
        const messageId = `style-change-${Date.now()}`;
        if (prev.some(msg => msg.id.startsWith('style-change-'))) { 
            return prev.filter(msg => !msg.id.startsWith('style-change-')).concat({
                id: messageId,
                text: `챗봇 답변 스타일이 "${styleName}"으로 변경되었습니다. 새로운 스타일로 채팅 세션을 다시 초기화합니다.`,
                sender: MessageSender.SYSTEM,
                timestamp: new Date(),
            });
        }
        return [...prev, {
            id: messageId,
            text: `챗봇 답변 스타일이 "${styleName}"으로 변경되었습니다. 새로운 스타일로 채팅 세션을 다시 초기화합니다.`,
            sender: MessageSender.SYSTEM,
            timestamp: new Date(),
        }];
    });
  };

  const handleAdvancedSettingsChange = (newSettings: AdvancedChatSettings) => {
    setAdvancedChatSettings(newSettings);
    setChatMessages(prev => [...prev, {
      id: `adv-settings-change-${Date.now()}`,
      text: "챗봇 고급 설정이 변경되었습니다. 새로운 설정으로 채팅 세션을 다시 초기화합니다.",
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
    }]);
  };

  const handleFaqUpdate = (updatedFaqList: FAQEntry[]) => {
    setFaqList(updatedFaqList);
     setChatMessages(prev => [...prev, {
      id: `faq-update-${Date.now()}`,
      text: "FAQ 목록이 업데이트되었습니다. 다음 메시지부터 적용됩니다.",
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
    }]);
  };

  const initializeChat = useCallback(() => {
    if (!ai) {
      setError("AI 서비스가 초기화되지 않았습니다.");
      setChatSession(null);
      return false;
    }
    const truncatedDocumentContext = truncateInputForAI(documentContext, 32000); 

    // 문서 내용이 없어도 채팅 세션은 초기화될 수 있도록 변경 (일반 LLM 답변 허용)
    // if (!truncatedDocumentContext.trim()) {
    //   setChatSession(null); 
    //   return false; 
    // }

    setIsLoading(true);
    setError(null);
    try {
      let systemInstruction = '';
      const documentPromptPart = truncatedDocumentContext.trim() 
        ? `다음은 사용자가 제공한 문서 내용입니다. 질문 답변 시 이 내용을 최우선으로 참고하세요:\n"""\n${truncatedDocumentContext}\n"""\n\n`
        : "사용자가 제공한 문서 내용이 없습니다.\n\n";

      if (chatbotStyle === ChatbotStyle.DETAILED_ASSISTANT) {
        systemInstruction = `당신은 유능한 AI 어시스턴트입니다. 당신의 임무는 사용자의 질문에 답변하는 것입니다. 
${documentPromptPart}만약 질문에 대한 답변이 제공된 문서 내용에 있다면, 그 내용을 바탕으로 상세하고 논리적으로 답변해주세요. 
문서 내용에서 답변을 찾을 수 없는 경우에는, 당신의 일반적인 지식을 활용하여 답변할 수 있습니다. 
문서 기반으로 답변할 경우, 해당 정보가 문서에서 비롯되었음을 간략히 언급해주는 것이 좋습니다.`;
      } else if (chatbotStyle === ChatbotStyle.STRUCTURED_OUTLINE_STYLE) {
        systemInstruction = `당신은 정보를 매우 체계적이고 구조화된 방식으로 전달하는 AI 어시스턴트입니다. 사용자의 질문에 대해, 다음의 개조식 형식을 사용해 답변해야 합니다:

1. [첫 번째 핵심 사항 또는 주제에 대한 명확하고 간결한 제목]
   - [위 제목에 대한 구체적인 설명, 정의, 또는 부연 정보. 완전한 문장으로 작성하세요.]

2. [두 번째 핵심 사항 또는 주제에 대한 명확하고 간결한 제목]
   - [위 제목에 대한 구체적인 설명.]

(필요에 따라 위와 같은 형식으로 항목을 추가하여 답변을 구성하세요.)

${documentPromptPart}답변은 우선적으로 제공된 '문서 내용'에 근거해야 합니다. 
만약 문서에서 정보를 찾을 수 없을 경우, 당신의 일반적인 지식을 활용하여 동일한 구조화된 형식으로 답변할 수 있습니다. 
문서 기반으로 답변할 경우, 해당 정보가 문서에서 비롯되었음을 간략히 언급해주는 것이 좋습니다.
문서와 일반 지식 모두에서 답변을 찾을 수 없다면, "관련 정보를 찾을 수 없습니다."라고 명확히 답변해야 합니다.`;
      } else { // USER_FRIENDLY_SIMPLE
        systemInstruction = `당신은 정말 친절하고 상냥한 이야기 친구예요! 당신의 역할은 사용자의 질문에 대해 아주 쉽고 재미있게 이야기해주는 거예요. 
${documentPromptPart.replace('문서 내용', '비밀 문서')}먼저 '비밀 문서'에 적힌 내용을 바탕으로 이야기해주는 게 좋아요! 하지만 만약 '비밀 문서'에서 답을 찾을 수 없다면, 네가 알고 있는 다른 재미있는 이야기나 지식으로 대답해줘도 괜찮아요. 
항상 짧고 명확하게, 그리고 밝고 긍정적으로 대답해주세요! 어려운 말보다는 쉬운 단어를 쓰고, 재미있는 흉내말이나 예쁜 그림을 그리듯 설명해주면 더 좋아요!
만약 '비밀 문서'에도 없고, 네 일반 지식으로도 잘 모르는 내용이라면, "음... 그건 내가 아직 잘 모르는 이야기네! 대신 다른 재미있는 걸 물어봐 줄래?" 하고 부드럽게 말해주세요.`;
      }
      
      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash-preview-04-17',
        config: { 
          systemInstruction,
          temperature: advancedChatSettings.temperature,
          topK: advancedChatSettings.topK,
          topP: advancedChatSettings.topP,
          maxOutputTokens: advancedChatSettings.maxOutputTokens,
        },
      });
      setChatSession(newChat);
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error("채팅 세션 초기화 오류:", e);
      const errorMessage = `채팅 초기화 오류: ${e instanceof Error ? e.message : String(e)}`;
      setError(errorMessage);
      setChatMessages(prev => {
        const errorId = `init-error-${Date.now()}`;
        if (!prev.some(msg => msg.text === errorMessage && msg.sender === MessageSender.SYSTEM)) {
         return [...prev, {
            id: errorId,
            text: errorMessage,
            sender: MessageSender.SYSTEM,
            timestamp: new Date(),
          }];
        }
        return prev;
      });
      setIsLoading(false);
      setChatSession(null);
      return false;
    }
  }, [ai, documentContext, chatbotStyle, advancedChatSettings]);

  useEffect(() => {
    if (isAuthenticated && ai) {
      const chatInitializedSuccessfully = initializeChat(); 

      if (chatInitializedSuccessfully) {
        let styleName = "";
        if (chatbotStyle === ChatbotStyle.DETAILED_ASSISTANT) {
            styleName = "AI 비서 상세 답변";
        } else if (chatbotStyle === ChatbotStyle.USER_FRIENDLY_SIMPLE) {
            styleName = "친절한 어린이용 답변";
        } else if (chatbotStyle === ChatbotStyle.STRUCTURED_OUTLINE_STYLE) {
            styleName = "구조화된 개요 답변";
        }
        
        const docInfo = documentContext.trim() 
            ? `(현재 문서 길이: ${documentContext.length}자)` 
            : "(현재 제공된 문서 없음)";
        
        const sessionStartMessageText = `채팅 세션이 시작되었습니다. 현재 스타일: "${styleName}". 고급 설정 적용됨. ${documentContext.trim() ? "제공된 문서 내용을 기반으로 답변하거나, 관련 정보가 없을 시 일반 지식으로 답변합니다." : "일반 지식을 기반으로 답변합니다."} ${docInfo}`;
        const sessionStartMessageId = `init-success-${chatbotStyle}-${documentContext.length}-${JSON.stringify(advancedChatSettings)}`;

        setChatMessages(prev => {
          const hasSimilarMessage = prev.some(msg => msg.id.startsWith('init-success-') || msg.text.includes("채팅 세션이 시작되었습니다"));
          const isDocUpdateMessage = prev.some(msg => msg.id.startsWith('sys-doc-update-'));
          const isStyleChangeMessage = prev.some(msg => msg.id.startsWith('style-change-'));
          const isAdvSettingsChangeMessage = prev.some(msg => msg.id.startsWith('adv-settings-change-'));

          if (!hasSimilarMessage || isDocUpdateMessage || isStyleChangeMessage || isAdvSettingsChangeMessage) {
            if (isDocUpdateMessage || isStyleChangeMessage || isAdvSettingsChangeMessage) { 
                return prev.filter(m => !m.id.startsWith('init-success-') && !m.id.startsWith('no-doc-') ) 
                           .concat({
                                id: sessionStartMessageId,
                                text: sessionStartMessageText,
                                sender: MessageSender.SYSTEM,
                                timestamp: new Date(),
                            });

            } else if (!prev.some(m => m.id === sessionStartMessageId)){ 
                 return [...prev, {
                    id: sessionStartMessageId,
                    text: sessionStartMessageText,
                    sender: MessageSender.SYSTEM,
                    timestamp: new Date(),
                }];
            }
          }
          return prev;
        });

      } 
      // Removed the "no document" specific message since chat can now function without it.
      // else if (!documentContext.trim()) { ... }
    }
  }, [isAuthenticated, ai, documentContext, loggedInUser, chatbotStyle, advancedChatSettings, initializeChat]); 

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (messageText: string) => {
    const truncatedMessage = truncateInputForAI(messageText, 2000); 
    if (!truncatedMessage.trim()) return;

    for (const faq of faqList) {
      const keywords = faq.keyword.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0);
      const messageTextLower = truncatedMessage.toLowerCase();
      if (keywords.some(k => messageTextLower.includes(k))) {
        const faqMessage: ChatMessage = {
          id: `faq-${Date.now()}`,
          text: `FAQ 답변: ${faq.answer}`,
          sender: MessageSender.BOT,
          timestamp: new Date(),
        };
        const userMessageForFaq: ChatMessage = {
          id: Date.now().toString(),
          text: truncatedMessage,
          sender: MessageSender.USER,
          timestamp: new Date(),
        };
        setChatMessages(prevMessages => [...prevMessages, userMessageForFaq, faqMessage]);
        return; 
      }
    }

    if (!chatSession) {
      // This message might need adjustment if chat can initialize without document
      const systemMessageText = "채팅 세션이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요.";
      setError(systemMessageText);
       setChatMessages(prev => {
         if (!prev.some(msg => msg.text === systemMessageText && msg.sender === MessageSender.SYSTEM)){
            return [...prev, {
                id: `send-err-no-session-${Date.now()}`,
                text: systemMessageText,
                sender: MessageSender.SYSTEM,
                timestamp: new Date(),
            }];
         }
         return prev;
       });
      return;
    }

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      text: truncatedMessage,
      sender: MessageSender.USER,
      timestamp: new Date(),
    };
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const stream = await chatSession.sendMessageStream({ message: truncatedMessage });
      let botResponseText = '';
      const botMessageId = `bot-${Date.now()}`;
      
      setChatMessages(prevMessages => [...prevMessages, {
        id: botMessageId,
        text: '...', 
        sender: MessageSender.BOT,
        timestamp: new Date(),
      }]);

      for await (const chunk of stream) { 
        if (typeof chunk.text === 'string' && chunk.text.length > 0) {
            botResponseText += chunk.text;
        }
        setChatMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === botMessageId ? { ...msg, text: botResponseText || "..." } : msg
          )
        );
      }
       setChatMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === botMessageId ? { ...msg, text: botResponseText.trim() || "챗봇으로부터 응답을 받지 못했습니다." } : msg
          )
        );

    } catch (e) {
      console.error("메시지 전송 오류:", e);
      const errorMessage = `AI와 통신 중 오류 발생: ${e instanceof Error ? e.message : String(e)}`;
      setError(errorMessage);
      setChatMessages(prevMessages => {
          if (!prevMessages.some(msg => msg.text === errorMessage && msg.sender === MessageSender.SYSTEM)){
            return [...prevMessages, {
                id: `error-send-${Date.now()}`,
                text: errorMessage,
                sender: MessageSender.SYSTEM,
                timestamp: new Date(),
            }];
          }
          return prevMessages;
        });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAdminDocumentUpdate = (newContext: string) => {
    const messageText = newContext.trim()
        ? `관리자에 의해 문서가 업데이트되었습니다. (새 문서 길이: ${newContext.length}자). 새로운 내용으로 채팅 세션을 다시 초기화합니다.`
        : `관리자에 의해 문서가 삭제되었습니다. 이제 챗봇은 일반 지식으로 답변합니다. 채팅 세션을 다시 초기화합니다.`;

    setChatMessages((prev: ChatMessage[]) => [...prev.filter(m => !m.id.startsWith('sys-doc-update-')), { 
      id: `sys-doc-update-${Date.now()}`,
      text: messageText,
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
    }]);
    setDocumentContext(newContext); 
    localStorage.setItem('documentContext', newContext);
  };

  const handleLoginSuccess = (user: LoggedInUser) => {
    setLoggedInUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    setChatMessages([]); 
    setChatSession(null); 
    setError(null);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedInUser(null);
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('isAuthenticated');
    // Consider also clearing style and advanced settings on logout if desired
    // localStorage.removeItem('chatbotStyle');
    // localStorage.removeItem('advancedChatSettings');
    setChatMessages([]);
    setChatSession(null);
    setError(null);
  };
  
  if (!API_KEY && !ai && !isAuthenticated) { 
     return (
      <div className="flex items-center justify-center h-screen bg-red-100">
        <div className="p-8 bg-white shadow-xl rounded-lg text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-4">설정 오류</h1>
          <p className="text-red-600">{error || "API_KEY가 누락되었습니다. API_KEY 환경 변수를 배포 환경(예: Vercel)에 설정해주세요."}</p>
          <p className="mt-4 text-sm text-gray-600">이 애플리케이션은 유효한 API_KEY 없이 작동할 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const commonChatProps = {
    chatMessages,
    isLoading,
    error,
    handleSendMessage,
    chatContainerRef,
    chatSession,
  };

  const commonInterfaceProps = {
    loggedInUser,
    onLogout: handleLogout, 
    openSettingsModal: () => setIsSettingsModalOpen(true),
  };


  return (
    <>
      {loggedInUser?.isAdmin ? (
        <AdminDashboard
          {...commonInterfaceProps}
          currentDocumentContext={documentContext}
          onDocumentUpdate={handleAdminDocumentUpdate}
          {...commonChatProps}
          faqList={faqList}
          onFaqUpdate={handleFaqUpdate}
        />
      ) : (
        <UserChatInterface
          {...commonInterfaceProps}
          {...commonChatProps}
        />
      )}
      {isSettingsModalOpen && loggedInUser && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentStyle={chatbotStyle}
          onStyleChange={handleChatbotStyleChange}
          onLogout={handleLogout}
          advancedSettings={advancedChatSettings}
          onAdvancedSettingsChange={handleAdvancedSettingsChange}
        />
      )}
    </>
  );
};

export default App;