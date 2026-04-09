export const computeStats = (messages) => {
  if (!messages || messages.length === 0) return null;

  const stats = {
    totalMessages: messages.length,
    messagesByParticipant: {},
    totalAttachments: 0,
    attachmentsByParticipant: {},
    dateRange: { start: messages[0].timestamp_ms, end: messages[messages.length - 1].timestamp_ms },
    emojis: {},
    messagesByDayOfWeek: { "Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0 },
    messagesByHourOfDay: Array(24).fill(0).reduce((acc, _, i) => { acc[i.toString()] = 0; return acc; }, {}),
  };

  // Refined strict unicode mapping specifically omitting generic punctuation symbols. 
  // Focuses exclusively on Pictographs, Faces, and Miscellaneous UI Symbols (e.g., U+2600 onward).
  const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2600-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

  const stopWords = new Set(['the', 'and', 'to', 'is', 'a', 'of', 'in', 'it', 'you', 'i', 'that', 'with', 'for', 'on', 'this', 'but', 'my', 'me', 'so', 'was', 'are', 'we', 'have', 'be', 'at', 'not', 'can', 'do', 'as', 'if', 'all', 'your', 'just', 'like', 'how', 'what', 'an', 'there', 'who', 'they', 'im', 'its', 'no', 'yes', 'or', 'about', 'from', 'get', 'will', 'out', 'up', 'when', 'he', 'she', 'has', 'would', 'know', 'good', 'some', 'one', 'then', 'go', 'gonna', 'got', 'its', 'dont', 'yeah', 'that', 'thats', 'been']);

  const wordMap = {};
  const wordMapByParticipant = {};
  const responseTimesByParticipant = {};

  const CONVERSATION_GAP_MS = 4 * 60 * 60 * 1000;
  let conversations = [];
  let currentConversation = { startMs: messages[0].timestamp_ms, starter: messages[0].sender_name, ender: null, messageCount: 0, endMs: messages[0].timestamp_ms };

  let bursts = [];
  let currentBurst = { msgs: [messages[0]], startMs: messages[0].timestamp_ms, initiator: messages[0].sender_name };

  const dailyActivity = {}; // { 'YYYY-MM-DD': count }

  let previousMessage = null;

  messages.forEach(msg => {
    const sender = msg.sender_name;
    const date = new Date(msg.timestamp_ms);
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    const hour = date.getHours().toString();
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Messages by Participant
    stats.messagesByParticipant[sender] = (stats.messagesByParticipant[sender] || 0) + 1;

    // Attachments
    const attachmentCount = msg.photos.length + msg.videos.length;
    if (attachmentCount > 0) {
      stats.totalAttachments += attachmentCount;
      stats.attachmentsByParticipant[sender] = (stats.attachmentsByParticipant[sender] || 0) + attachmentCount;
    }

    // Process Text (Words, Emojis)
    if (msg.content) {
      // Emojis
      const foundEmojis = msg.content.match(emojiRegex);
      if (foundEmojis) {
        foundEmojis.forEach(emoji => {
          if (!stats.emojis[emoji]) stats.emojis[emoji] = { total: 0, byParticipant: {} };
          stats.emojis[emoji].total += 1;
          stats.emojis[emoji].byParticipant[sender] = (stats.emojis[emoji].byParticipant[sender] || 0) + 1;
        });
      }

      // Words
      const words = msg.content.toLowerCase().replace(/[^\w\s\']/g, "").split(/\s+/);
      if (!wordMapByParticipant[sender]) wordMapByParticipant[sender] = {};
      words.forEach(w => {
        if (w.length >= 3 && !stopWords.has(w)) {
          wordMap[w] = (wordMap[w] || 0) + 1;
          wordMapByParticipant[sender][w] = (wordMapByParticipant[sender][w] || 0) + 1;
        }
      });
    }

    // Time-based
    stats.messagesByDayOfWeek[dayOfWeek] += 1;
    stats.messagesByHourOfDay[hour] += 1;
    dailyActivity[dateString] = (dailyActivity[dateString] || 0) + 1;

    // Response Times, Conversations, & Bursts
    if (previousMessage) {
      const timeDiff = msg.timestamp_ms - previousMessage.timestamp_ms;

      // Conversation Analysis
      if (timeDiff > CONVERSATION_GAP_MS) {
        currentConversation.endMs = previousMessage.timestamp_ms;
        currentConversation.ender = previousMessage.sender_name;
        conversations.push(currentConversation);

        currentConversation = { startMs: msg.timestamp_ms, starter: sender, messageCount: 0, endMs: msg.timestamp_ms };
      }
      currentConversation.messageCount += 1;

      // Response Time
      if (sender !== previousMessage.sender_name && timeDiff <= CONVERSATION_GAP_MS) {
        if (!responseTimesByParticipant[sender]) responseTimesByParticipant[sender] = [];
        responseTimesByParticipant[sender].push(timeDiff);
      }

      // Burst Detection (gap <= 5 mins)
      if (timeDiff <= 5 * 60 * 1000) {
        currentBurst.msgs.push(msg);
      } else {
        if (currentBurst.msgs.length >= 10) {
          currentBurst.endMs = previousMessage.timestamp_ms;
          currentBurst.durationMs = currentBurst.endMs - currentBurst.startMs;
          bursts.push(currentBurst);
        }
        currentBurst = { msgs: [msg], startMs: msg.timestamp_ms, initiator: msg.sender_name };
      }
    }

    previousMessage = msg;
  });

  // Close the last conversation & burst
  if (currentConversation.messageCount > 0) {
    currentConversation.endMs = previousMessage.timestamp_ms;
    currentConversation.ender = previousMessage.sender_name;
    conversations.push(currentConversation);
  }
  if (currentBurst.msgs.length >= 10) {
    currentBurst.endMs = previousMessage.timestamp_ms;
    currentBurst.durationMs = currentBurst.endMs - currentBurst.startMs;
    bursts.push(currentBurst);
  }

  // --- Compile Final Specialized Metrics ---

  // 1. Word Cloud
  const sortedWords = Object.entries(wordMap).sort((a, b) => b[1] - a[1]).slice(0, 80).map(x => ({ text: x[0], value: x[1] }));
  const perParticipantWords = {};
  Object.keys(wordMapByParticipant).forEach(p => {
    perParticipantWords[p] = Object.entries(wordMapByParticipant[p]).sort((a, b) => b[1] - a[1]).slice(0, 50).map(x => ({ text: x[0], value: x[1] }));
  });
  stats.words = { all: sortedWords, byParticipant: perParticipantWords };

  // 2. Response Times
  stats.responseTimes = {};
  Object.keys(responseTimesByParticipant).forEach(p => {
    const times = responseTimesByParticipant[p].sort((a, b) => a - b);
    if (times.length > 0) {
      const sum = times.reduce((a, b) => a + b, 0);
      stats.responseTimes[p] = {
        avg: sum / times.length,
        median: times[Math.floor(times.length / 2)],
        fastest: times[0],
        slowest: times[times.length - 1],
        samples: times.length
      };
    }
  });

  // 3. Conversation Rhythm
  stats.conversations = { total: conversations.length, starters: {}, enders: {}, longest: null };
  let longestLength = 0;
  conversations.forEach(c => {
    stats.conversations.starters[c.starter] = (stats.conversations.starters[c.starter] || 0) + 1;
    stats.conversations.enders[c.ender] = (stats.conversations.enders[c.ender] || 0) + 1;
    if (c.messageCount > longestLength) {
      longestLength = c.messageCount;
      stats.conversations.longest = c;
    }
  });

  // 4. Streaks
  const dates = Object.keys(dailyActivity).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let maxGap = 0;
  if (dates.length > 0) {
    longestStreak = 1; currentStreak = 1;
    let prevDate = new Date(dates[0]);
    for (let i = 1; i < dates.length; i++) {
      const d = new Date(dates[i]);
      const diffDays = Math.round((d - prevDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (diffDays > 1) {
        currentStreak = 1;
        maxGap = Math.max(maxGap, diffDays);
      }
      prevDate = d;
    }
    // Check if the current streak is still ongoing relative to the end date of the export
    const msSinceLastActive = (new Date(messages[messages.length - 1].timestamp_ms) - prevDate);
    if (msSinceLastActive > 48 * 60 * 60 * 1000) currentStreak = 0;
  }
  stats.streaks = { totalActiveDays: dates.length, longestStreak, currentStreak, maxGapDays: maxGap };

  // 5. Bursts
  let maxBurstMsgs = 0;
  let maxBurstDuration = 0;
  let longestBurst = null;
  let busiestBurst = null;
  let burstInitiators = {};

  bursts.forEach(b => {
    burstInitiators[b.initiator] = (burstInitiators[b.initiator] || 0) + 1;
    if (b.msgs.length > maxBurstMsgs) {
      maxBurstMsgs = b.msgs.length;
      busiestBurst = b;
    }
    if (b.durationMs > maxBurstDuration) {
      maxBurstDuration = b.durationMs;
      longestBurst = b;
    }
  });

  stats.bursts = {
    total: bursts.length,
    averageLength: bursts.length > 0 ? Math.round(bursts.reduce((a, b) => a + b.msgs.length, 0) / bursts.length) : 0,
    averageDuration: bursts.length > 0 ? bursts.reduce((a, b) => a + b.durationMs, 0) / bursts.length : 0,
    busiestBurst: busiestBurst,
    longestBurst: longestBurst,
    initiators: burstInitiators,
    timeline: bursts
  };

  return stats;
};
