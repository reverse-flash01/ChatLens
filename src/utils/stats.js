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

  const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

  messages.forEach(msg => {
    const sender = msg.sender_name;
    const date = new Date(msg.timestamp_ms);
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    const hour = date.getHours().toString();

    // Messages by Participant
    stats.messagesByParticipant[sender] = (stats.messagesByParticipant[sender] || 0) + 1;

    // Attachments
    const attachmentCount = msg.photos.length + msg.videos.length;
    if (attachmentCount > 0) {
      stats.totalAttachments += attachmentCount;
      stats.attachmentsByParticipant[sender] = (stats.attachmentsByParticipant[sender] || 0) + attachmentCount;
    }

    // Emojis
    if (msg.content) {
      const foundEmojis = msg.content.match(emojiRegex);
      if (foundEmojis) {
        foundEmojis.forEach(emoji => {
          if (!stats.emojis[emoji]) {
            stats.emojis[emoji] = { total: 0, byParticipant: {} };
          }
          stats.emojis[emoji].total += 1;
          stats.emojis[emoji].byParticipant[sender] = (stats.emojis[emoji].byParticipant[sender] || 0) + 1;
        });
      }
    }

    // Time-based
    stats.messagesByDayOfWeek[dayOfWeek] += 1;
    stats.messagesByHourOfDay[hour] += 1;
  });

  return stats;
};
