import { useState } from 'react';
import { FaLinkedin } from 'react-icons/fa';
import {
  SiSpringboot, SiPostgresql, SiDocker, SiTailwindcss,
  SiReact, SiOpenjdk, SiGooglegemini,
} from 'react-icons/si';

const API_BASE = 'http://localhost:8080/api';
const LINKEDIN_URL = 'https://www.linkedin.com/in/lokeshsun';

const SUGGESTED_QUESTIONS = [
  'What does this codebase do?',
  'How is the code organized?',
  'What are the main classes or modules?',
  'Are there any notable design patterns used here?',
];

const TECH_STACK = [
  { name: 'Java', icon: SiOpenjdk },
  { name: 'Spring Boot', icon: SiSpringboot },
  { name: 'PostgreSQL / pgvector', icon: SiPostgresql },
  { name: 'Google Gemini', icon: SiGooglegemini },
  { name: 'React', icon: SiReact },
  { name: 'Tailwind CSS', icon: SiTailwindcss },
  { name: 'Docker', icon: SiDocker },
];

const SUGGESTED_REPOS = [
  {
    name: 'SureSeat',
    url: 'https://github.com/silver-bullet007/SureSeat',
    description: 'A concurrent ticket-booking system built to prevent race-condition booking errors.',
  },
  {
    name: 'SporadicNews',
    url: 'https://github.com/silver-bullet007/SporadicNews',
    description: 'An automated news aggregation bot that scrapes, filters with Gemini, and posts to Twitter.',
  },
];

function App() {
  const [tab, setTab] = useState('chat');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId] = useState(() => crypto.randomUUID());
  const [loading, setLoading] = useState(false);

  const [repoUrl, setRepoUrl] = useState('');
  const [ingestStatus, setIngestStatus] = useState('');
  const [ingesting, setIngesting] = useState(false);

  const [code, setCode] = useState('');
  const [review, setReview] = useState(null);
  const [reviewing, setReviewing] = useState(false);

  async function sendMessage(overrideText) {
    const userMessage = overrideText ?? input;
    if (!userMessage.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);
    try {
      const params = new URLSearchParams({ message: userMessage, conversationId });
      const response = await fetch(`${API_BASE}/chat?${params}`);
      const text = await response.text();
      setMessages(prev => [...prev, { role: 'assistant', text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  function useSuggestedQuestion(question) {
    setInput(question);
  }

  async function ingestRepo() {
    if (!repoUrl.trim()) return;
    setIngesting(true);
    setIngestStatus('Cloning and ingesting — larger repos may take a few minutes due to API rate limits...');
    try {
      const params = new URLSearchParams({ repoUrl });
      const response = await fetch(`${API_BASE}/ingest?${params}`, { method: 'POST' });
      const text = await response.text();
      setIngestStatus(text);
    } catch (err) {
      setIngestStatus('Error: ' + err.message);
    } finally {
      setIngesting(false);
    }
  }

  async function reviewCode() {
    if (!code.trim()) return;
    setReviewing(true);
    setReview(null);
    try {
      const response = await fetch(`${API_BASE}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: code,
      });
      const data = await response.json();
      setReview(data);
    } catch (err) {
      setReview({ error: err.message });
    } finally {
      setReviewing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-5xl mx-auto p-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-50">CodeSentry</h1>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors"
          >
            <FaLinkedin size={22} />
            <span className="text-sm hidden sm:inline">Built by Lokesh</span>
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-slate-700">
          {['chat', 'ingest', 'review'].map(t => (
            <button
              key={t}
              className={`px-3 py-2 capitalize ${tab === t ? 'border-b-2 border-blue-400 font-semibold text-slate-50' : 'text-slate-400'}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_180px] gap-4">

          {/* Left: main panel */}
          <div>
            {tab === 'chat' && (
              <div>
                <div className="border border-slate-700 rounded p-4 h-96 overflow-y-auto mb-3 space-y-2 bg-slate-800">
                  {messages.length === 0 && (
                    <p className="text-slate-400 text-sm">Try one of the suggested questions to the right, or ask your own below.</p>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                      <span className={`inline-block px-3 py-2 rounded ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100'}`}>
                        {m.text}
                      </span>
                    </div>
                  ))}
                  {loading && <div className="text-slate-400">Thinking...</div>}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-slate-600 rounded px-3 py-2 bg-slate-800 text-slate-100 placeholder-slate-500"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about the codebase..."
                  />
                  <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50" onClick={() => sendMessage()} disabled={loading}>
                    Send
                  </button>
                </div>
              </div>
            )}

            {tab === 'ingest' && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Load a public GitHub repository to chat about. This replaces whatever is currently loaded.</p>
                <div className="flex gap-2 mb-3">
                  <input
                    className="flex-1 border border-slate-600 rounded px-3 py-2 bg-slate-800 text-slate-100 placeholder-slate-500"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                  />
                  <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50" onClick={ingestRepo} disabled={ingesting}>
                    {ingesting ? 'Ingesting...' : 'Load'}
                  </button>
                </div>
                {ingestStatus && <div className="border border-slate-700 rounded p-3 bg-slate-800 text-sm mb-4">{ingestStatus}</div>}

                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2 mt-4">Or try one of these</p>
                <div className="flex flex-col gap-2 max-w-md">
                  {SUGGESTED_REPOS.map((r) => (
                    <button
                      key={r.url}
                      onClick={() => setRepoUrl(r.url)}
                      className="text-left border border-slate-700 rounded px-3 py-2 bg-slate-800 hover:bg-slate-700 hover:border-blue-400 transition-colors"
                    >
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs text-slate-400">{r.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'review' && (
              <div>
                <textarea
                  className="w-full border border-slate-600 rounded px-3 py-2 h-40 font-mono text-sm mb-3 bg-slate-800 text-slate-100 placeholder-slate-500"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Paste a Java code snippet to review..."
                />
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 mb-3" onClick={reviewCode} disabled={reviewing}>
                  {reviewing ? 'Reviewing...' : 'Review'}
                </button>
                {review && !review.error && (
                  <div className="border border-slate-700 rounded p-3 space-y-2 bg-slate-800">
                    <div><span className="font-semibold">Summary: </span>{review.summary}</div>
                    <div><span className="font-semibold">Overall: </span>{review.overallRating}</div>
                    <div className="font-semibold">Issues:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {review.issues?.map((issue, i) => (
                        <li key={i}>
                          <span className="font-mono text-xs bg-slate-700 px-1 rounded">{issue.severity}</span>{' '}
                          {issue.description} — <span className="italic text-slate-300">{issue.suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {review?.error && <div className="text-red-400">{review.error}</div>}
              </div>
            )}
          </div>

          {/* Middle: suggested questions (chat tab only) */}
          {tab === 'chat' && (
            <div className="flex flex-col gap-2 md:w-56">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Try asking</p>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => useSuggestedQuestion(q)}
                  className="text-left text-sm border border-slate-700 rounded px-3 py-2 bg-slate-800 hover:bg-slate-700 hover:border-blue-400 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Right: tech stack */}
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Built with</p>
            {TECH_STACK.map(({ name, icon: Icon }) => (
              <div key={name} className="flex items-center gap-2 text-slate-300 text-sm">
                <Icon size={18} />
                <span>{name}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div >
  );
}

export default App;