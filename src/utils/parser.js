/**
 * Parses Instagram DM export files (JSON and HTML)
 */

export const parseInstagramZip = async (files) => {
  let allMessages = [];
  let participants = new Set();
  let chatTitle = "Instagram Chat";
  
  for (const file of files) {
    if (file.name.endsWith('.json')) {
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        
        // Extract participants
        if (data.participants) {
          data.participants.forEach(p => participants.add(decodeUtf8(p.name)));
        } else if (data.title) {
           chatTitle = decodeUtf8(data.title);
        }
        
        // Process messages
        if (data.messages && Array.isArray(data.messages)) {
          const parsedMsgs = data.messages.map(msg => ({
            sender_name: msg.sender_name ? decodeUtf8(msg.sender_name) : 'Unknown',
            timestamp_ms: msg.timestamp_ms || new Date(msg.timestamp).getTime() || Date.now(),
            content: msg.content ? decodeUtf8(msg.content) : null,
            photos: msg.photos || [],
            videos: msg.videos || [],
            is_deleted: msg.is_deleted || false,
            reactions: msg.reactions || [],
            type: msg.type || 'Generic'
          }));
          
          parsedMsgs.forEach(m => participants.add(m.sender_name));
          allMessages = allMessages.concat(parsedMsgs);
        }
      } catch (err) {
        console.error('Failed to parse JSON', err);
      }
    } else if (file.name.endsWith('.html')) {
       // HTML parser for Instagram exports
       const text = await file.text();
       const parser = new DOMParser();
       const doc = parser.parseFromString(text, 'text/html');
       
       // Also try to extract title
       const titleEl = doc.querySelector('title');
       if (titleEl && chatTitle === "Instagram Chat") {
         chatTitle = decodeUtf8(titleEl.textContent);
       }
       
       // Try old class selectors first, fallback to robust scanning for new format
       let messageDivs = doc.querySelectorAll('.pam._3-95._2pi0._2lej.uiBoxWhite.noborder');
       if (messageDivs.length === 0) {
         messageDivs = doc.querySelectorAll('div.uiBoxWhite.noborder');
       }
       
       if (messageDivs.length > 0) {
         messageDivs.forEach(div => {
           try {
             // Sender mapping
             const header = div.querySelector('._3-96._2pio._2lek._2lel') || div.querySelector('h2');
             const senderName = header ? decodeUtf8(header.textContent) : 'Unknown';
             
             // Time mapping
             const meta = div.querySelector('._3-94._2lem') || div.querySelector('div[class*="_3-94"]');
             let timestamp = Date.now();
             if (meta) {
               timestamp = new Date(meta.textContent).getTime();
             } else {
               // Fallback: look at the very last child div which contains the timestamp in newest formats
               const children = div.children;
               if (children.length > 0) {
                 const lastChild = children[children.length - 1];
                 const parsed = new Date(lastChild.textContent).getTime();
                 if (!isNaN(parsed)) timestamp = parsed;
               }
             }
             
             // Content text grouping
             let contentDiv = div.querySelector('._3-96._2let');
             let content = null;
             
             if (contentDiv) {
               content = contentDiv.textContent;
             } else {
                // New logic fallback
                // The content block usually follows the h2 tag
                const pBlock = div.querySelector('h2') ? div.querySelector('h2').nextElementSibling : null;
                if (pBlock && pBlock.tagName === 'DIV') {
                  const clone = pBlock.cloneNode(true);
                  // Remove reaction lists so they don't pollute message content
                  const uls = clone.querySelectorAll('ul');
                  uls.forEach(ul => ul.remove());
                  content = clone.textContent.trim() || null;
                }
             }
             
             if (content) content = decodeUtf8(content);
             
             // Extract Media
             let photos = [];
             let videos = [];
             
             const imgs = div.querySelectorAll('img:not(.tracking_pixel)');
             imgs.forEach(img => {
                const src = img.getAttribute('src');
                // Ignore structural UI images
                if (src && !src.includes('Instagram-Logo') && !src.includes('static.xx.fbcdn')) {
                  photos.push({ uri: src });
                }
             });
             
             const vids = div.querySelectorAll('video');
             vids.forEach(vid => {
                const src = vid.getAttribute('src') || vid.querySelector('source')?.getAttribute('src');
                if (src) videos.push({ uri: src });
             });
             
             const links = div.querySelectorAll('a[href]');
             links.forEach(a => {
                const href = a.getAttribute('href');
                if (href) {
                  const lowerHref = href.toLowerCase();
                  if (lowerHref.endsWith('.jpg') || lowerHref.endsWith('.png') || lowerHref.endsWith('.jpeg')) {
                     if (!photos.some(p => p.uri === href)) photos.push({ uri: href });
                  } else if (lowerHref.endsWith('.mp4') || lowerHref.endsWith('.mov')) {
                     if (!videos.some(v => v.uri === href)) videos.push({ uri: href });
                  }
                }
             });

             participants.add(senderName);
             allMessages.push({
               sender_name: senderName,
               timestamp_ms: timestamp,
               content: content,
               photos: photos,
               videos: videos,
               is_deleted: false,
               reactions: [],
               type: 'Generic'
             });
           } catch(e) {
             // skip
           }
         });
       }
    }
  }

  // Sort messages chronologically
  allMessages.sort((a, b) => a.timestamp_ms - b.timestamp_ms);
  
  if (allMessages.length > 0) {
    chatTitle = chatTitle !== "Instagram Chat" ? chatTitle : Array.from(participants).join(", ");
  }
  
  return {
    title: chatTitle,
    participants: Array.from(participants),
    messages: allMessages
  };
};

/**
 * Fix Mojibake encoding issues typical in Instagram JSON exports
 */
function decodeUtf8(str) {
  if (!str) return str;
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
}
