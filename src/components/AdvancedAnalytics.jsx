import React, { useState, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import { format, formatDistance } from 'date-fns';
import { Cloud, Clock, Zap, Target, Flame, Camera, Download, Info } from 'lucide-react';

const COLORS = ['#8B5CF6', '#06B6D4', '#ec4899', '#f59e0b', '#10b981'];

const InfoTooltip = ({ text }) => (
  <div className="info-tooltip-container">
    <Info size={16} />
    <span className="info-tooltip-text">{text}</span>
  </div>
);

export const AdvancedAnalytics = ({ stats, participants, onJump }) => {
  const [wordCloudView, setWordCloudView] = useState('all');
  const [showAllBursts, setShowAllBursts] = useState(false);
  const printRef = useRef(null);

  if (!stats || !stats.words) return null;

  // Render Word Cloud
  const renderWordCloud = () => {
    let wordData = wordCloudView === 'all' ? stats.words.all : stats.words.byParticipant[wordCloudView] || [];
    
    // Scale font sizes
    const maxVal = Math.max(...wordData.map(w => w.value), 1);
    const minVal = Math.min(...wordData.map(w => w.value), 1);
    const getFontSize = (val) => {
      const minFont = 14; const maxFont = 48;
      if (maxVal === minVal) return (minFont + maxFont) / 2;
      return minFont + ((val - minVal) / (maxVal - minVal)) * (maxFont - minFont);
    };

    return (
      <div className="word-cloud-container glass-card fade-in">
        <div className="panel-header">
          <Cloud className="panel-icon" />
          <h2 className="panel-title">Word Cloud <InfoTooltip text="Visualizes the most frequently used words across the chat. Basic stop-words (like 'the', 'and') and words under 3 characters are automatically excluded. Words scale dynamically by their frequency count." /></h2>
          <select className="view-selector" value={wordCloudView} onChange={e => setWordCloudView(e.target.value)}>
            <option value="all">All Chats</option>
            {participants.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="cloud-wrapper">
          {wordData.length > 0 ? wordData.map((w, i) => (
            <span 
              key={w.text} 
              className="cloud-word" 
              style={{ fontSize: `${getFontSize(w.value)}px`, color: COLORS[i % COLORS.length] }}
              title={`Used ${w.value} times`}
            >
              {w.text}
            </span>
          )) : <p>No words found.</p>}
        </div>
      </div>
    );
  };

  // Render Response Time
  const renderResponseTimes = () => {
    const data = Object.keys(stats.responseTimes).map(p => ({
      name: p,
      avgMins: Math.round(stats.responseTimes[p].avg / 60000),
      medianMins: Math.round(stats.responseTimes[p].median / 60000)
    }));

    return (
      <div className="response-times glass-card fade-in">
        <div className="panel-header">
          <Clock className="panel-icon" />
          <h2 className="panel-title">Response Times <InfoTooltip text="Calculates the time it takes for a user to respond when the sender switches during an active dialogue. Ignores continuous double-texting from the same person." /></h2>
        </div>
        <div className="metrics-grid">
          {Object.entries(stats.responseTimes).map(([p, data]) => (
             <div key={p} className="metric-box glass-panel">
               <h4>{p}</h4>
               <p className="avg-time gradient-text">{Math.round(data.avg / 60000)} mins avg</p>
               <p className="detail-time">Fastest: {Math.round(data.fastest / 60000)}m | Slowest: {Math.round(data.slowest / 60000)}m</p>
             </div>
          ))}
        </div>
        <div className="chart-wrapper bar-chart-wrapper" style={{ marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <RechartsTooltip cursor={{fill: 'var(--glass-bg)'}} />
              <Bar dataKey="avgMins" name="Average (mins)" fill="var(--primary)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render Conversation Rhythm
  const renderRhythm = () => {
    const starterData = Object.entries(stats.conversations.starters).map(([name, val]) => ({ name, value: val }));
    
    return (
      <div className="rhythm-card glass-card fade-in">
         <div className="panel-header">
          <Zap className="panel-icon" />
          <h2 className="panel-title">Conversation Rhythm <InfoTooltip text="A 'conversation' is defined as any continuous cluster of messages followed by a break of more than 4 hours. The chart tracks who initiates the dialogue ('Starter') versus who sends the final text ('Ender')." /></h2>
        </div>
        <div className="rhythm-split">
          <div className="rhythm-chart">
            <h4 className="chart-label">Who Starts Conversations?</h4>
            <div className="chart-wrapper" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={starterData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {starterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="legend">
              {starterData.map((d, i) => (
                <span key={d.name} style={{ color: COLORS[i % COLORS.length] }}>{d.name}: {d.value}</span>
              ))}
            </div>
          </div>
          <div className="rhythm-details">
             <div className="insight-box">
                <h5>Total Conversations</h5>
                <p className="large-stat">{stats.conversations.total}</p>
             </div>
             <div className="insight-box">
                <h5>Longest Marathon</h5>
                {stats.conversations.longest ? (
                  <p className="small-detail">
                    {stats.conversations.longest.messageCount} messages starting on {format(new Date(stats.conversations.longest.startMs), 'MMM d, yyyy')}
                  </p>
                ) : <p>N/A</p>}
             </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Ratio Data
  const renderRatio = () => {
    return (
       <div className="ratio-card glass-card fade-in">
         <div className="panel-header">
          <Target className="panel-icon" />
          <h2 className="panel-title">Response Ratio <InfoTooltip text="Visualizes the total absolute distribution of message volume mapping out exactly how 'balanced' the communication flow is between participants." /></h2>
        </div>
        <div className="ratio-bar-container">
          <div className="ratio-bar">
             {participants.map((p, i) => {
                const count = stats.messagesByParticipant[p] || 0;
                const pct = (count / stats.totalMessages) * 100;
                return (
                  <div key={p} className="ratio-segment" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}>
                     {pct > 10 && <span className="ratio-label">{Math.round(pct)}%</span>}
                  </div>
                );
             })}
          </div>
          <div className="ratio-legend">
            {participants.map((p, i) => (
              <div key={p} className="legend-item">
                <span className="dot" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
       </div>
    );
  };

  // Render Streak
  const renderStreak = () => {
    return (
       <div className="streak-card glass-card fade-in">
         <div className="panel-header">
          <Flame className="panel-icon" color="#f59e0b" />
          <h2 className="panel-title">Activity Streaks <InfoTooltip text="Measures consecutive days where at least one message was sent. The 'Current Streak' indicates real-time continuous daily messaging leading up to the exact date of your export." /></h2>
        </div>
        <div className="streak-grid">
           <div className="streak-box fire-box">
              <h3>Current Streak</h3>
              <p className="streak-val">{stats.streaks.currentStreak} <span className="flame">🔥</span></p>
              <p className="streak-sub">Days in a row</p>
           </div>
           <div className="streak-box">
              <h3>Longest Streak</h3>
              <p className="streak-val">{stats.streaks.longestStreak} <span className="flame">🔥</span></p>
           </div>
           <div className="streak-box">
              <h3>Total Active Days</h3>
              <p className="streak-val">{stats.streaks.totalActiveDays}</p>
           </div>
           <div className="streak-box">
              <h3>Longest Gap</h3>
              <p className="streak-val">{stats.streaks.maxGapDays} <span className="mute">Days</span></p>
           </div>
        </div>
       </div>
    );
  };

  // Render Burst Detection
  const renderBursts = () => {
    if (!stats.bursts || stats.bursts.total === 0) return null;

    const initiatorsData = Object.entries(stats.bursts.initiators).map(([name, val]) => ({ name, value: val }));
    const topInitiator = initiatorsData.sort((a,b) => b.value - a.value)[0]?.name || "N/A";
    const sortedBursts = [...stats.bursts.timeline].sort((a,b) => b.msgs.length - a.msgs.length);

    return (
       <div className="burst-card glass-card fade-in" style={{ gridColumn: '1 / -1', width: '100%', marginTop: '1rem', padding: '1.5rem' }}>
         <div className="panel-header" style={{ position: 'relative' }}>
          <Zap className="panel-icon burst-icon" fill="var(--primary)" />
          <h2 className="panel-title">Rapid-Fire Bursts <InfoTooltip text="Detects intense messaging sessions where at least 10 messages were exchanged with less than 5 minutes between each text." /></h2>
        </div>
        
        <div className="burst-grid">
           <div className="insight-box highlight-box">
              <h5>Total Bursts Detected</h5>
              <p className="large-stat pulse-number">{stats.bursts.total}</p>
              <p className="small-detail">You had {stats.bursts.total} intense chat sessions.</p>
           </div>
           
           <div className="insight-box">
              <h5>Longest Marathon</h5>
              <p className="large-stat">
                 {stats.bursts.longestBurst ? Math.round(stats.bursts.longestBurst.durationMs / 60000) : 0} <span className="mute">mins</span>
              </p>
              <p className="small-detail">Straight continuous texting!</p>
           </div>

           <div className="insight-box">
              <h5>Busiest Spike</h5>
              <p className="large-stat">
                 {stats.bursts.busiestBurst ? stats.bursts.busiestBurst.msgs.length : 0} <span className="mute">texts</span>
              </p>
              <p className="small-detail">In a single burst incident.</p>
           </div>

           <div className="insight-box">
              <h5>Top Instigator</h5>
              <p className="large-stat">{topInitiator}</p>
              <p className="small-detail">Usually starts the excitement.</p>
           </div>
        </div>

        {sortedBursts.length > 0 && (
          <div className="burst-highlight-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: 0 }}>{showAllBursts ? "Burst Catalog (Ranked by Volume)" : "Snapshot of The Heaviest Burst"}</h4>
              {sortedBursts.length > 1 && (
                <button 
                  onClick={() => setShowAllBursts(!showAllBursts)}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  {showAllBursts ? "Close Catalog" : "View All Bursts"}
                </button>
              )}
            </div>

            <div className="bursts-list" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxHeight: showAllBursts ? '400px' : 'auto', overflowY: showAllBursts ? 'auto' : 'visible', paddingRight: showAllBursts ? '1rem' : '0' }}>
               {(showAllBursts ? sortedBursts : [sortedBursts[0]]).filter(Boolean).map((burst, idx) => (
                  <div key={burst.startMs + idx} className="burst-item-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                      <span className="burst-date-tag" style={{ marginBottom: 0, marginTop: 0 }}>
                        #{idx + 1} - {format(new Date(burst.startMs), 'MMM d, yyyy @ h:mm a')}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {burst.msgs.length} texts • {Math.max(1, Math.round(burst.durationMs / 60000))} mins
                        </span>
                        {onJump && (
                          <button onClick={() => onJump(burst.startMs)} className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
                            View in Chat
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="burst-timeline">
                       {burst.msgs.slice(0, Math.min(5, burst.msgs.length)).map((msg, i) => (
                         <div key={`${msg.timestamp_ms}-${i}`} className="burst-msg-chip">
                            <strong>{msg.sender_name}:</strong> {msg.content || '[Media Attached]'}
                         </div>
                       ))}
                       {burst.msgs.length > 5 && (
                         <div className="burst-msg-chip more-chip">... and {burst.msgs.length - 5} more messages!</div>
                       )}
                    </div>
                  </div>
               ))}
            </div>
          </div>
        )}
       </div>
    );
  };

  // Export Screenshot Feature
  const handleExport = () => {
    if (printRef.current === null) return;
    toPng(printRef.current, { cacheBust: true, style: { background: 'var(--bg-color)' } })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `ChatLens-Stats-${format(new Date(), 'yyyy-MM-dd')}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to export', err);
      });
  };

  return (
    <div className="advanced-analytics dashboard">
      <div className="export-controls" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={handleExport} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <Camera size={18} /> Export Overview Card
        </button>
      </div>

      <div ref={printRef} className="print-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem', width: '100%' }}>
        {renderWordCloud()}
        <div className="charts-grid">
          {renderResponseTimes()}
          {renderRhythm()}
        </div>
        {renderBursts()}
        {renderStreak()}
        {renderRatio()}
      </div>
    </div>
  );
};
