import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { computeStats } from '../utils/stats';
import { format } from 'date-fns';
import { MessageCircle, Image as ImageIcon, Calendar, Clock, Smile } from 'lucide-react';
import { AdvancedAnalytics } from './AdvancedAnalytics';

const StatCard = ({ icon: Icon, title, value, subtitle }) => (
  <div className="stat-card glass-card">
    <Icon className="stat-icon" size={32} />
    <h3 className="stat-title">{title}</h3>
    <div className="stat-value gradient-text">{value}</div>
    {subtitle && <p className="stat-subtitle">{subtitle}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip glass-card">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="tooltip-value" style={{ color: entry.color }}>
            {entry.name}: <span>{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = ({ data, onJump }) => {
  const minTime = data.messages[0]?.timestamp_ms || 0;
  const maxTime = data.messages[data.messages.length - 1]?.timestamp_ms || Date.now();

  const [dateRangeFilter, setDateRangeFilter] = useState({
    start: minTime,
    end: maxTime
  });

  const [sliderValue, setSliderValue] = useState(maxTime);

  const yearMarkers = useMemo(() => {
    if (!minTime || !maxTime) return [];
    const minYear = new Date(minTime).getFullYear();
    const maxYear = new Date(maxTime).getFullYear();
    const markers = [];
    for (let y = minYear + 1; y <= maxYear; y++) {
      const ts = new Date(y, 0, 1).getTime();
      if (ts > minTime && ts < maxTime) {
        markers.push({
          year: y,
          pct: ((ts - minTime) / (maxTime - minTime)) * 100
        });
      }
    }
    return markers;
  }, [minTime, maxTime]);

  const handleSliderCommit = () => {
    setDateRangeFilter(prev => ({ ...prev, end: sliderValue }));
  };

  const filteredMessages = useMemo(() => {
    return data.messages.filter(m => m.timestamp_ms >= dateRangeFilter.start && m.timestamp_ms <= dateRangeFilter.end);
  }, [data.messages, dateRangeFilter]);

  const stats = useMemo(() => computeStats(filteredMessages), [filteredMessages]);

  if (!stats) return <div className="no-data"><p>No data available to display.</p></div>;

  const dayOfWeekData = Object.keys(stats.messagesByDayOfWeek).map(day => ({
    name: day,
    messages: stats.messagesByDayOfWeek[day]
  }));

  const hourOfDayData = Object.keys(stats.messagesByHourOfDay).map(hour => ({
    name: `${hour}:00`,
    messages: stats.messagesByHourOfDay[hour]
  }));

  const topEmojis = Object.entries(stats.emojis)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15);

  const formatTimestamp = (ts) => format(new Date(ts), 'MMM d, yyyy');

  return (
    <div className="dashboard fade-in slide-in">

      {/* Date Timeline Filter */}
      <div className="timeline-filter glass-panel">
        <div className="panel-header">
          <Calendar className="panel-icon" />
          <h2 className="panel-title">Timeline Filter</h2>
        </div>
        <div className="timeline-labels">
          <span>{formatTimestamp(data.messages[0]?.timestamp_ms)}</span>
          <span>{formatTimestamp(data.messages[data.messages.length - 1]?.timestamp_ms)}</span>
        </div>
        <div className="timeline-slider-wrapper">
          {yearMarkers.map(m => (
            <div
              key={m.year}
              className="timeline-marker"
              style={{ left: `${m.pct}%` }}
            >
              <div className="timeline-marker-tick"></div>
              <div className="timeline-marker-label">{m.year}</div>
            </div>
          ))}

          <div
            className="timeline-popup"
            style={{
              left: `calc(${((sliderValue - minTime) / Math.max(1, maxTime - minTime)) * 100 || 0}%)`
            }}
          >
            {format(new Date(sliderValue), 'yyyy, MMMM')}
          </div>
          <input
            type="range"
            min={minTime}
            max={maxTime}
            value={sliderValue}
            onChange={(e) => setSliderValue(parseInt(e.target.value))}
            onMouseUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            className="timeline-slider"
          />
        </div>
        <div className="timeline-summary">
          Showing: {formatTimestamp(dateRangeFilter.start)} - {formatTimestamp(dateRangeFilter.end)}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid">
        <StatCard
          icon={MessageCircle}
          title="Total Messages"
          value={stats.totalMessages.toLocaleString()}
        />
        <StatCard
          icon={ImageIcon}
          title="Total Attachments"
          value={stats.totalAttachments.toLocaleString()}
        />
        <div className="breakdown-card glass-card">
          <h3 className="breakdown-title">Message Breakdown</h3>
          <div className="breakdown-list">
            {Object.entries(stats.messagesByParticipant)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => {
                const percentage = ((count / stats.totalMessages) * 100).toFixed(1);
                // System messages and bots cause clutter with 0.0% volume
                if (percentage === "0.0") return null;

                return (
                  <div key={name} className="breakdown-item">
                    <div className="breakdown-labels">
                      <span className="breakdown-name">{name}</span>
                      <span className="breakdown-count">{count.toLocaleString()} ({percentage}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Time Trends */}
        <div className="trends-panel glass-panel">
          <div className="panel-header">
            <Clock className="panel-icon" />
            <h2 className="panel-title">Activity Time Trends</h2>
          </div>

          <h3 className="chart-title">By Hour of Day</h3>
          <div className="chart-wrapper area-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourOfDayData}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="messages" stroke="var(--primary)" fillOpacity={1} fill="url(#colorMessages)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <h3 className="chart-title">By Day of Week</h3>
          <div className="chart-wrapper bar-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--glass-bg)' }} />
                <Bar dataKey="messages" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emoji Analysis */}
        <div className="emoji-panel glass-panel">
          <div className="panel-header">
            <Smile className="panel-icon" />
            <h2 className="panel-title">Top Emojis</h2>
          </div>
          <div className="emoji-grid">
            {topEmojis.map(([emoji, data], index) => (
              <div key={emoji} className="emoji-card glass-card">
                <div className="emoji-card-hover-bg"></div>
                <span className="emoji-char">{emoji}</span>
                <span className="emoji-count">{data.total.toLocaleString()}</span>

                <div className="emoji-distribution">
                  {Object.entries(data.byParticipant).map(([name, count], i) => {
                    const pct = (count / data.total) * 100;
                    return (
                      <div
                        key={name}
                        className={`emoji-dot ${i % 2 === 0 ? 'dot-primary' : 'dot-secondary'}`}
                        style={{ width: `${pct}%` }}
                        title={`${name}: ${count}`}
                      ></div>
                    );
                  })}
                </div>
              </div>
            ))}
            {topEmojis.length === 0 && <p className="no-emojis">No emojis found in these messages.</p>}
          </div>
        </div>
      </div>

      {/* Advanced Analytics Modules */}
      <AdvancedAnalytics stats={stats} participants={data.participants} onJump={onJump} />
    </div>
  );
};

export default Dashboard;
