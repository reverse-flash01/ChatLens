import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { ArrowDown, Search } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';

const ChatViewer = ({ data, jumpDateMs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startIndex, setStartIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(100);
  const containerRef = useRef(null);

  const primaryUser = useMemo(() => {
    let counts = {};
    data.messages.forEach(m => {
      counts[m.sender_name] = (counts[m.sender_name] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }, [data.messages]);

  const filteredMessages = useMemo(() => {
    if (!searchTerm) return data.messages;
    const term = searchTerm.toLowerCase();
    return data.messages.filter(m => m.content && m.content.toLowerCase().includes(term));
  }, [data.messages, searchTerm]);

  const messagesToDisplay = filteredMessages.slice(startIndex, startIndex + displayCount);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 2) {
      if (startIndex + displayCount < filteredMessages.length) {
        setDisplayCount(prev => Math.min(prev + 100, filteredMessages.length - startIndex));
      }
    }
  };

  const scrollToBottom = () => {
    setStartIndex(Math.max(0, filteredMessages.length - 100));
    setDisplayCount(100);
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 100);
  };

  const jumpToDate = (e) => {
    const targetDate = new Date(e.target.value).getTime();
    if (isNaN(targetDate)) return;

    const index = filteredMessages.findIndex(m => m.timestamp_ms >= targetDate);
    if (index !== -1) {
      setStartIndex(Math.max(0, index - 10)); // Give 10 messages of preceding context
      setDisplayCount(100);
    }
  };

  const formatMessageTime = (ts) => format(new Date(ts), 'h:mm a');

  const generateColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  let lastDate = null;

  useEffect(() => {
    if (jumpDateMs) {
      setSearchTerm('');
      const index = data.messages.findIndex(m => m.timestamp_ms >= jumpDateMs);
      if (index !== -1) {
        setStartIndex(Math.max(0, index - 5));
        setDisplayCount(100);
        setTimeout(() => {
           const el = document.getElementById(`msg-${jumpDateMs}`);
           if (el && containerRef.current) {
              containerRef.current.scrollTop = el.offsetTop - 100;
              el.classList.add('highlight-jump');
              setTimeout(() => el.classList.remove('highlight-jump'), 4000);
           }
        }, 300);
      }
    }
  }, [jumpDateMs, data.messages]);

  return (
    <div className="chat-viewer glass-panel fade-in">
      <div className="chat-controls">
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setStartIndex(0); setDisplayCount(100); }}
            className="search-input"
          />
        </div>

        <div className="jump-to-date">
          <span className="jump-label">Jump to:</span>
          <input
            type="date"
            onChange={jumpToDate}
            className="date-input"
          />
        </div>

        <div className="showing-count">
          Showing {messagesToDisplay.length} of {filteredMessages.length}
        </div>
      </div>

      <div
        ref={containerRef}
        className="messages-list"
        onScroll={handleScroll}
      >
        {startIndex > 0 && (
          <div style={{ textAlign: 'center', padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
            <button 
              className="btn-secondary" 
              onClick={() => {
                const shift = Math.min(100, startIndex);
                setStartIndex(prev => prev - shift);
                setDisplayCount(prev => prev + shift);
              }}
            >
              ⬆ Load Previous Messages
            </button>
          </div>
        )}

        {messagesToDisplay.map((msg, idx) => {
          const isUser = msg.sender_name === primaryUser;
          const msgDate = new Date(msg.timestamp_ms);

          let showDateHeader = false;
          if (!lastDate || !isSameDay(msgDate, lastDate)) {
            showDateHeader = true;
            lastDate = msgDate;
          }

          const initials = msg.sender_name.charAt(0).toUpperCase();

          return (
            <React.Fragment key={idx}>
              {showDateHeader && (
                <div className="date-divider">
                  <div className="date-badge glass-card">
                    {format(msgDate, 'MMMM d, yyyy')}
                  </div>
                </div>
              )}

              <div id={`msg-${msg.timestamp_ms}`} className={`message-row ${isUser ? 'is-user' : ''}`}>
                {!isUser && (
                  <div
                    className="avatar"
                    style={{ backgroundColor: generateColor(msg.sender_name) }}
                  >
                    {initials}
                  </div>
                )}

                <div className={`message-content-wrapper ${isUser ? 'items-end' : 'items-start'}`}>
                  {!isUser && <span className="sender-name">{msg.sender_name}</span>}

                  <div className={`message-bubble ${isUser ? 'bubble-user' : 'bubble-other'}`}>
                    {msg.content && <p className="message-text">{msg.content}</p>}

                    {(msg.photos?.length > 0 || msg.videos?.length > 0) && (
                      <div className="attachments-list">
                        {msg.photos?.map((p, i) => (
                          <div key={i} className="attachment-item">
                            <ImageIcon size={14} className="attachment-icon" />
                            <span>Photo</span>
                          </div>
                        ))}
                        {msg.videos?.map((v, i) => (
                          <div key={i} className="attachment-item">
                            <ImageIcon size={14} className="attachment-icon" />
                            <span>Video/Reel</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="message-time">
                    {formatMessageTime(msg.timestamp_ms)}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <button
        onClick={scrollToBottom}
        className="scroll-bottom-btn shadow-lg"
        title="Scroll to bottom"
      >
        <ArrowDown size={20} />
      </button>
    </div>
  );
};

export default ChatViewer;
