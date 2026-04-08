import React, { useState, useEffect } from 'react';
import { Moon, Sun, MessageSquare, BarChart2 } from 'lucide-react';
import FileImport from './components/FileImport';
import Dashboard from './components/Dashboard';
import ChatViewer from './components/ChatViewer';
import './index.css';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [chatData, setChatData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const resetData = () => {
    setChatData(null);
  };

  return (
    <div className="app-wrapper fade-in">
      {/* Top Navbar */}
      <nav className="glass-panel main-nav">
        <div className="nav-brand">
          <div className="brand-icon">
            <MessageSquare size={16} />
          </div>
          <h1 className="brand-title gradient-text hidden-sm">ChatLens</h1>
        </div>
        
        {chatData && (
          <div className="nav-tabs glass-panel-inner">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <BarChart2 size={16} />
              <span className="hidden-sm">Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('viewer')}
              className={`nav-tab ${activeTab === 'viewer' ? 'active' : ''}`}
            >
              <MessageSquare size={16} />
              <span className="hidden-sm">Chat Viewer</span>
            </button>
          </div>
        )}

        <div className="nav-actions">
          {chatData && (
            <button onClick={resetData} className="btn-secondary nav-action-btn">
              New File
            </button>
          )}

          <div className="theme-toggle" onClick={toggleTheme}>
            <div className={`theme-toggle-knob ${theme === 'dark' ? 'dark' : 'light'}`}>
              {theme === 'dark' ? <Moon size={14} className="icon-primary"/> : <Sun size={14} className="icon-secondary"/>}
            </div>
            <div className="theme-toggle-bg">
               <Sun size={12} />
               <Moon size={12} />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content container text-center">
        {!chatData ? (
          <FileImport onDataParsed={setChatData} />
        ) : (
          <div className="content-wrapper">
            <div className="chat-header fade-in">
              <h2 className="chat-title">{chatData.title || 'Chat History'}</h2>
              <p className="chat-subtitle">
                {chatData.participants.length} participants • {chatData.messages.length.toLocaleString()} messages
              </p>
            </div>

            {activeTab === 'dashboard' ? (
              <Dashboard data={chatData} />
            ) : (
              <ChatViewer data={chatData} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
