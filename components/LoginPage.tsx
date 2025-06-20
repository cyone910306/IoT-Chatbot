
import React, { useState, useEffect } from 'react';
import { LoggedInUser, UserCredentials } from '../types'; // UserCredentials import

interface LoginPageProps {
  onLoginSuccess: (user: LoggedInUser) => void;
}

// 관리자 계정 정보
const admins: Record<string, string> = {
  '원창연': '1234',
  '오종하': '1234',
  '김태현': '1234'
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [currentView, setCurrentView] = useState<'loginForm' | 'registerForm'>('loginForm'); // 기본 뷰를 로그인 폼으로 변경
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerTeam, setRegisterTeam] = useState('');
  const [registerMessage, setRegisterMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

  const [users, setUsers] = useState<UserCredentials[]>(() => {
    const savedUsers = localStorage.getItem('appUsers');
    return savedUsers ? JSON.parse(savedUsers) : [];
  });

  const [rememberId, setRememberId] = useState<boolean>(false);

  useEffect(() => {
    // 컴포넌트 마운트 시 localStorage에서 아이디 저장 상태 및 아이디 불러오기
    const savedRememberStatus = localStorage.getItem('rememberLoginIdChecked');
    if (savedRememberStatus === 'true') {
      const savedId = localStorage.getItem('savedLoginId');
      if (savedId) {
        setLoginUsername(savedId);
      }
      setRememberId(true);
    }
  }, []);

  useEffect(() => {
    // users state가 변경될 때마다 localStorage에 저장
    localStorage.setItem('appUsers', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    // rememberId 또는 loginUsername 상태 변경 시 localStorage 업데이트
    if (rememberId) {
      localStorage.setItem('rememberLoginIdChecked', 'true');
      if (loginUsername.trim()) {
        localStorage.setItem('savedLoginId', loginUsername);
      } else {
        // 아이디를 저장하기로 했지만 아이디 입력값이 비면 저장된 아이디도 지움
        localStorage.removeItem('savedLoginId');
      }
    } else {
      localStorage.setItem('rememberLoginIdChecked', 'false');
      localStorage.removeItem('savedLoginId');
    }
  }, [rememberId, loginUsername]);


  const teamOptions = [
    "IoT개발팀", "IoT기획팀", "IoT서비스개발TF", "IoT플랫폼팀", 
    "ITQA팀", "메가존", "모바일앱개발팀", "프론트엔드개발팀"
  ].sort((a, b) => a.localeCompare(b, 'ko'));

  const showLoginForm = () => {
    setCurrentView('loginForm');
    setRegisterMessage({ text: '', type: '' }); // 회원가입 메시지 초기화
    setLoginMessage({ text: '', type: ''}); // 로그인 메시지도 초기화 (회원가입 -> 로그인 이동 시)
  };

  const showRegisterForm = () => {
    setCurrentView('registerForm');
    setLoginMessage({ text: '', type: '' }); // 로그인 메시지 초기화
    setRegisterMessage({ text: '', type: '' }); // 회원가입 메시지 초기화
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setLoginMessage({ text: '아이디와 비밀번호를 모두 입력해주세요.', type: 'error' });
      return;
    }

    if (admins[loginUsername] && admins[loginUsername] === loginPassword) {
      setLoginMessage({ text: `관리자 ${loginUsername}님, 로그인 성공!`, type: 'success' });
      onLoginSuccess({ username: loginUsername, team: null, isAdmin: true });
      return;
    }

    const userIndex = users.findIndex(user => user.username === loginUsername && user.password === loginPassword);
    if (userIndex !== -1) {
      const foundUser = users[userIndex];
      const updatedUsers = [...users];
      updatedUsers[userIndex] = { ...foundUser, lastLogin: new Date().toISOString() };
      setUsers(updatedUsers);

      setLoginMessage({ text: `환영합니다, ${loginUsername}님! (소속: ${foundUser.team})`, type: 'success' });
      onLoginSuccess({ username: loginUsername, team: foundUser.team, isAdmin: false });
    } else {
      setLoginMessage({ text: '아이디 또는 비밀번호가 올바르지 않습니다.', type: 'error' });
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername || !registerPassword || !registerTeam) {
      setRegisterMessage({ text: '모든 정보를 입력해주세요.', type: 'error' });
      return;
    }

    if (users.some(user => user.username === registerUsername) || admins[registerUsername]) {
      setRegisterMessage({ text: '이미 사용 중인 아이디입니다.', type: 'error' });
      return;
    }

    const newUser: UserCredentials = { username: registerUsername, password: registerPassword, team: registerTeam };
    setUsers(prevUsers => [...prevUsers, newUser]);
    
    setLoginMessage({ text: `회원가입이 완료되었습니다! (아이디: ${newUser.username}) 이제 로그인해주세요.`, type: 'success' });
    
    const newUsernameForLogin = newUser.username;
    setRegisterUsername('');
    setRegisterPassword('');
    setRegisterTeam('');
    setRegisterMessage({text: '', type: ''});

    showLoginForm();
    setLoginUsername(newUsernameForLogin);
    setLoginPassword('');
  };

  const renderMessage = (message: { text: string; type: 'success' | 'error' | '' }) => {
    if (!message.text) return null;
    const colorClass = message.type === 'success' ? 'text-green-500' : 'text-red-500';
    return <p className={`mt-4 font-semibold ${colorClass}`} role="alert">{message.text}</p>;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4" role="main">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        {currentView === 'loginForm' && (
          <div id="loginForm">
            <h2 className="text-2xl font-bold mb-6 text-gray-700">IoT서비스 챗봇</h2>
            {renderMessage(loginMessage)}
            <form onSubmit={handleLogin}>
              <input 
                type="text" 
                id="loginUsername" 
                placeholder="아이디" 
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required 
                className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                aria-label="로그인 아이디"
              />
              <input 
                type="password" 
                id="loginPassword" 
                placeholder="비밀번호" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required 
                className="w-full p-3 mb-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                aria-label="로그인 비밀번호"
                autoFocus={loginMessage.type === 'success'}
              />
              <div className="flex justify-between items-center mb-4 mt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberId"
                    checked={rememberId}
                    onChange={(e) => setRememberId(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    aria-labelledby="rememberIdLabel"
                  />
                  <label 
                    htmlFor="rememberId" 
                    id="rememberIdLabel"
                    className="ml-2 block text-sm text-gray-700 cursor-pointer select-none"
                  >
                    아이디 저장
                  </label>
                </div>
                <button
                  type="button"
                  onClick={showRegisterForm}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                  aria-label="회원가입 페이지로 이동"
                >
                  회원가입
                </button>
              </div>
              <button 
                type="submit"
                className="w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3 text-lg"
              >
                로그인
              </button>
              {/* 로그인 폼에서 '뒤로가기' 버튼은 제거됨 */}
            </form>
          </div>
        )}

        {currentView === 'registerForm' && (
          <div id="registerForm">
            <h2 className="text-2xl font-bold mb-6 text-gray-700">회원가입</h2>
            {renderMessage(registerMessage)}
            <form onSubmit={handleRegister}>
              <input 
                type="text" 
                id="registerUsername" 
                placeholder="아이디 (이메일이 아니어도 됨)" 
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                required 
                className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                aria-label="회원가입 아이디"
              />
              <input 
                type="password" 
                id="registerPassword" 
                placeholder="비밀번호" 
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required 
                className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                aria-label="회원가입 비밀번호"
              />
              <select 
                id="teamSelect" 
                value={registerTeam}
                onChange={(e) => setRegisterTeam(e.target.value)}
                required
                className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm appearance-none"
                aria-label="팀 소속 선택"
              >
                <option value="">팀 소속 선택</option>
                {teamOptions.map(team => <option key={team} value={team}>{team}</option>)}
              </select>
              <button 
                type="submit"
                className="w-full p-3 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 mb-3 text-lg"
              >
                회원가입
              </button>
              <button 
                type="button"
                onClick={showLoginForm} // '뒤로가기'를 누르면 로그인 폼으로 이동
                className="w-full p-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 text-lg"
                aria-label="취소하고 로그인 화면으로 돌아가기"
              >
                취소
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;