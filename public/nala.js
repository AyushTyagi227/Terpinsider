
const chatHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('nala-form');
  const input = document.getElementById('nala-input');
  const chatEl = document.getElementById('chat-messages');
  const sendBtn = document.getElementById('nala-send');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    appendMessage('user', text);
    input.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = 'Thinking…';

    const loadingId = appendMessage('assistant', 'Nala is thinking…', true);

    try {
      const res = await fetch('/api/nala', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory,
        }),
      });

      const data = await res.json();
      removeMessage(loadingId);

      if (!res.ok) {
        appendMessage('assistant', data.error || 'Something went wrong. Try again.');
        return;
      }

      chatHistory.push({ role: 'user', content: text });
      chatHistory.push({ role: 'assistant', content: data.reply });

      appendNalaReply(data.reply, data.recommendations || []);
    } catch (err) {
      console.error(err);
      removeMessage(loadingId);
      appendMessage('assistant', 'Could not reach Nala. Is the server running?');
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
      input.focus();
    }
  });

  function appendMessage(role, text, isLoading) {
    const wrap = document.createElement('div');
    wrap.className = `chat-bubble ${role}${isLoading ? ' loading' : ''}`;
    const label = role === 'user' ? 'You' : 'Nala';
    wrap.innerHTML = `<strong>${label}</strong><p>${escapeHtml(text)}</p>`;
    chatEl.appendChild(wrap);
    chatEl.scrollTop = chatEl.scrollHeight;
    return wrap;
  }

  function removeMessage(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function appendNalaReply(reply, recommendations) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-bubble assistant';

    let html = `<strong>Nala</strong><p>${escapeHtml(reply)}</p>`;

    if (recommendations.length > 0) {
      html += '<div class="nala-recs">';
      recommendations.forEach((rec) => {
        html += `
          <a class="nala-rec-card" href="club.html?id=${rec.id}">
            <span class="category">${escapeHtml(rec.category || 'Club')}</span>
            <h4>${escapeHtml(rec.clubName)}</h4>
            <p>${escapeHtml(rec.reason)}</p>
            <span class="rec-link">View club &rarr;</span>
          </a>
        `;
      });
      html += '</div>';
    }

    wrap.innerHTML = html;
    chatEl.appendChild(wrap);
    chatEl.scrollTop = chatEl.scrollHeight;
  }
});

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
