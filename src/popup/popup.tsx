import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RuleUpdaterService } from '../services/updater';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { DynamicRulesPackage, FilterMode, FlaggedItem, StopSlopSettings } from '../shared/types';
import { BackupService } from '../storage/backup';
import { BlocklistRepository } from '../storage/blocklist';
import { HistoryRepository } from '../storage/history';
import { DynamicRulesRepository } from '../storage/rules';
import { SettingsRepository } from '../storage/settings';

type Tab = 'rules' | 'channels' | 'keywords' | 'updates' | 'history';

export const PopupApp: React.FC = () => {
  const [settings, setSettings] = useState<StopSlopSettings>(DEFAULT_SETTINGS);
  const [blocklist, setBlocklist] = useState<string[]>([]);
  const [history, setHistory] = useState<FlaggedItem[]>([]);
  const [dynamicRules, setDynamicRules] = useState<DynamicRulesPackage | null>(null);
  const [stats, setStats] = useState<{ scanned: number; flagged: number }>({ scanned: 0, flagged: 0 });
  const [activeTab, setActiveTab] = useState<Tab>('rules');
  const [newChannel, setNewChannel] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Update State
  const [customRulesUrl, setCustomRulesUrl] = useState('');
  const [updatingRules, setUpdatingRules] = useState(false);
  const [ruleUpdateMsg, setRuleUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [checkingAppUpdate, setCheckingAppUpdate] = useState(false);
  const [appUpdateMsg, setAppUpdateMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const s = await SettingsRepository.get();
      const b = await BlocklistRepository.get();
      const h = await HistoryRepository.get();
      const r = await DynamicRulesRepository.get();
      setSettings(s);
      setBlocklist(b);
      setHistory(h);
      setDynamicRules(r);

      // Query active YouTube tab for stats
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0]?.id;
          if (tabId) {
            chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_STATS' }, (res) => {
              if (res) {
                setStats({ scanned: res.scanned || 0, flagged: res.flagged || 0 });
              }
            });
          }
        });
      }
    }
    loadData();
  }, []);

  const notifyTabs = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, { type: 'CONFIG_UPDATED' });
        }
      });
    }
  };

  const updateSettings = async (changes: Partial<StopSlopSettings>) => {
    const updated = await SettingsRepository.save(changes);
    setSettings(updated);
    notifyTabs();
  };

  const handleToggleMaster = () => {
    updateSettings({ enabled: !settings.enabled });
  };

  const handleFilterModeChange = (mode: FilterMode) => {
    updateSettings({ filterMode: mode });
  };

  const handleCategoryToggle = (key: keyof StopSlopSettings['categories']) => {
    const categories = {
      ...settings.categories,
      [key]: !settings.categories[key]
    };
    updateSettings({ categories });
  };

  const handleSensitivityChange = (val: number) => {
    updateSettings({ sensitivity: val });
  };

  const handleAddChannel = async () => {
    if (!newChannel.trim()) return;
    const updated = await BlocklistRepository.add(newChannel.trim());
    setBlocklist(updated);
    setNewChannel('');
    notifyTabs();
  };

  const handleRemoveChannel = async (name: string) => {
    const updated = await BlocklistRepository.remove(name);
    setBlocklist(updated);
    notifyTabs();
  };

  const handleAddKeyword = async () => {
    const kw = newKeyword.trim();
    if (!kw || settings.customKeywords.includes(kw)) return;
    const customKeywords = [...settings.customKeywords, kw];
    await updateSettings({ customKeywords });
    setNewKeyword('');
  };

  const handleRemoveKeyword = async (kw: string) => {
    const customKeywords = settings.customKeywords.filter(k => k !== kw);
    await updateSettings({ customKeywords });
  };

  const handleClearHistory = async () => {
    await HistoryRepository.clear();
    setHistory([]);
  };

  const handleWhitelistFromHistory = async (item: FlaggedItem) => {
    if (!item.videoId) return;
    if (!settings.whitelistedVideos.includes(item.videoId)) {
      const whitelistedVideos = [...settings.whitelistedVideos, item.videoId];
      await updateSettings({ whitelistedVideos });
    }
  };

  const handleRescan = () => {
    notifyTabs();
  };

  // Rule & App Update Handlers
  const handleUpdateRules = async () => {
    setUpdatingRules(true);
    setRuleUpdateMsg(null);
    const url = customRulesUrl.trim() || RuleUpdaterService.DEFAULT_RULES_URL;
    const res = await RuleUpdaterService.updateRules(url);
    setUpdatingRules(false);

    if (res.success) {
      setRuleUpdateMsg({ type: 'success', text: res.message });
      const r = await DynamicRulesRepository.get();
      setDynamicRules(r);
      notifyTabs();
    } else {
      setRuleUpdateMsg({ type: 'error', text: res.message });
    }
  };

  const handleCheckAppUpdate = async () => {
    setCheckingAppUpdate(true);
    setAppUpdateMsg(null);
    const res = await RuleUpdaterService.checkAppUpdate();
    setCheckingAppUpdate(false);
    setAppUpdateMsg(res.message);
  };

  const handleExportBackup = async () => {
    await BackupService.downloadBackup();
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await BackupService.importData(content);
        if (res.success) {
          const s = await SettingsRepository.get();
          const b = await BlocklistRepository.get();
          const r = await DynamicRulesRepository.get();
          setSettings(s);
          setBlocklist(b);
          setDynamicRules(r);
          notifyTabs();
          alert(res.message);
        } else {
          alert(`Import failed: ${res.message}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleOpenHelp = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('help/index.html') });
    } else {
      window.open('/help/index.html', '_blank');
    }
  };

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <img src="/icons/icon-48.png" alt="StopSlop Logo" className="logo-img" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1 className="title">StopSlop</h1>
              <span style={{ fontSize: 9, background: '#374151', padding: '1px 4px', borderRadius: 4, color: '#9ca3af' }}>v0.1.0</span>
            </div>
            <span className="subtitle">YouTube Slop & Clickbait Flagger</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleOpenHelp}
            className="btn-link"
            style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'none' }}
            title="Open Documentation & Help Guide"
          >
            📖 Help
          </button>
          <label className="switch" title="Toggle Auto-Flagger">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={handleToggleMaster}
            />
            <span className="slider"></span>
          </label>
        </div>
      </header>

      {/* Stats Card */}
      <section className="stats-card">
        <div className="stat-item">
          <span className="stat-value">{stats.scanned}</span>
          <span className="stat-label">Scanned</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value flag-val">{stats.flagged}</span>
          <span className="stat-label">Slop Flagged</span>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="tabs">
        <button
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Rules
        </button>
        <button
          className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
          onClick={() => setActiveTab('channels')}
        >
          Channels
        </button>
        <button
          className={`tab-btn ${activeTab === 'keywords' ? 'active' : ''}`}
          onClick={() => setActiveTab('keywords')}
        >
          Keywords
        </button>
        <button
          className={`tab-btn ${activeTab === 'updates' ? 'active' : ''}`}
          onClick={() => setActiveTab('updates')}
        >
          Updates 🔄
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </nav>

      {/* Tab: Rules */}
      {activeTab === 'rules' && (
        <main>
          <div className="section-title">Filter Mode</div>
          <div className="mode-selector">
            <label className="mode-option">
              <input
                type="radio"
                name="filterMode"
                value="blur-dim"
                checked={settings.filterMode === 'blur-dim'}
                onChange={() => handleFilterModeChange('blur-dim')}
              />
              <div className="mode-card">
                <span className="mode-icon">👁️</span>
                <div>
                  <div className="mode-name">Blur & Dim (Default)</div>
                  <div className="mode-desc">Blurs thumbnail with reveal button</div>
                </div>
              </div>
            </label>

            <label className="mode-option">
              <input
                type="radio"
                name="filterMode"
                value="badge-only"
                checked={settings.filterMode === 'badge-only'}
                onChange={() => handleFilterModeChange('badge-only')}
              />
              <div className="mode-card">
                <span className="mode-icon">🏷️</span>
                <div>
                  <div className="mode-name">Badge Only</div>
                  <div className="mode-desc">Visible red warning tag</div>
                </div>
              </div>
            </label>

            <label className="mode-option">
              <input
                type="radio"
                name="filterMode"
                value="hide"
                checked={settings.filterMode === 'hide'}
                onChange={() => handleFilterModeChange('hide')}
              />
              <div className="mode-card">
                <span className="mode-icon">🚫</span>
                <div>
                  <div className="mode-name">Hide Completely</div>
                  <div className="mode-desc">Removes video card from feed</div>
                </div>
              </div>
            </label>
          </div>

          <div className="section-title" style={{ marginTop: 10 }}>Detection Categories</div>
          <div className="category-list">
            <label className="category-item">
              <input
                type="checkbox"
                checked={settings.categories.aiSlop}
                onChange={() => handleCategoryToggle('aiSlop')}
              />
              <div className="cat-details">
                <span className="cat-name">🤖 AI Slop & Trailers</span>
                <span className="cat-sub">AI voice, Midjourney/ChatGPT spam</span>
              </div>
            </label>

            <label className="category-item">
              <input
                type="checkbox"
                checked={settings.categories.contentFarm}
                onChange={() => handleCategoryToggle('contentFarm')}
              />
              <div className="cat-details">
                <span className="cat-name">🚜 Content Farms</span>
                <span className="cat-sub">Listicles, "100 facts", repetitive formulas</span>
              </div>
            </label>

            <label className="category-item">
              <input
                type="checkbox"
                checked={settings.categories.brainrot}
                onChange={() => handleCategoryToggle('brainrot')}
              />
              <div className="cat-details">
                <span className="cat-name">🧠 Brainrot & Sensory Slop</span>
                <span className="cat-sub">Skibidi, subway surfers background, soap cutting</span>
              </div>
            </label>

            <label className="category-item">
              <input
                type="checkbox"
                checked={settings.categories.redditBot}
                onChange={() => handleCategoryToggle('redditBot')}
              />
              <div className="cat-details">
                <span className="cat-name">📢 Reddit Bot Narrations</span>
                <span className="cat-sub">Automated AITA / AskReddit story scraping</span>
              </div>
            </label>

            <label className="category-item">
              <input
                type="checkbox"
                checked={settings.categories.clickbait}
                onChange={() => handleCategoryToggle('clickbait')}
              />
              <div className="cat-details">
                <span className="cat-name">⚡ Sensational Clickbait</span>
                <span className="cat-sub">Excessive ALL-CAPS, ???/!!! punctuation</span>
              </div>
            </label>

            <label className="category-item">
              <input
                type="checkbox"
                checked={settings.categories.shortsSlop}
                onChange={() => handleCategoryToggle('shortsSlop')}
              />
              <div className="cat-details">
                <span className="cat-name">📱 Shorts Slop Format</span>
                <span className="cat-sub">Vertical video loops & split screens</span>
              </div>
            </label>
          </div>

          <div className="section-title" style={{ marginTop: 10 }}>
            Sensitivity Threshold: {settings.sensitivity}%
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="30"
              max="95"
              step="5"
              value={settings.sensitivity}
              onChange={(e) => handleSensitivityChange(Number(e.target.value))}
              className="range-slider"
            />
          </div>
        </main>
      )}

      {/* Tab: Channels */}
      {activeTab === 'channels' && (
        <section>
          <div className="section-title">Local User Blocklist ({blocklist.length})</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>
            Supports channel names, <code>@handles</code>, URLs, and wildcards (e.g. <code>*Slop*</code>).
          </div>
          <div className="input-row">
            <input
              type="text"
              placeholder="e.g. @SlopFactory, *AI Clips*, or URL"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
              className="text-input"
            />
            <button onClick={handleAddChannel} className="btn-primary">Block</button>
          </div>
          <div className="chip-container">
            {blocklist.length === 0 ? (
              <div className="empty-state">No blocked channels yet. Videos can also be blocked via the hover button on YouTube!</div>
            ) : (
              blocklist.map((ch) => (
                <div key={ch} className="chip">
                  <span>{ch}</span>
                  <button onClick={() => handleRemoveChannel(ch)} className="chip-remove" title="Unblock">×</button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Tab: Keywords */}
      {activeTab === 'keywords' && (
        <section>
          <div className="section-title">Custom Slop Keywords ({settings.customKeywords.length})</div>
          <div className="input-row">
            <input
              type="text"
              placeholder="Phrase (e.g. fake trailer)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              className="text-input"
            />
            <button onClick={handleAddKeyword} className="btn-primary">Add</button>
          </div>
          <div className="chip-container">
            {settings.customKeywords.length === 0 ? (
              <div className="empty-state">No custom keywords yet.</div>
            ) : (
              settings.customKeywords.map((kw) => (
                <div key={kw} className="chip">
                  <span>{kw}</span>
                  <button onClick={() => handleRemoveKeyword(kw)} className="chip-remove">×</button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Tab: Updates & Sync */}
      {activeTab === 'updates' && (
        <section>
          <div className="section-title">Updateable Slop Rules & Defs</div>
          <div style={{ background: '#1a1a22', padding: 10, borderRadius: 8, border: '1px solid #333342', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 12 }}>Rules Definitions</span>
              <span style={{ fontSize: 10, background: '#1e3a8a', color: '#93c5fd', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                {dynamicRules?.version || 'v0.1.0-rules'}
              </span>
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>
              Author: {dynamicRules?.author || 'Community Seed'} • Updated: {dynamicRules?.lastUpdated ? new Date(dynamicRules.lastUpdated).toLocaleDateString() : 'Initial'}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input
                type="text"
                placeholder="Custom Rules URL (leave blank for default)"
                value={customRulesUrl}
                onChange={(e) => setCustomRulesUrl(e.target.value)}
                className="text-input"
                style={{ fontSize: 10 }}
              />
              <button
                onClick={handleUpdateRules}
                disabled={updatingRules}
                className="btn-primary"
                style={{ fontSize: 11, padding: '0 10px', whiteSpace: 'nowrap' }}
              >
                {updatingRules ? 'Updating...' : '🔄 Update Rules'}
              </button>
            </div>
            {ruleUpdateMsg && (
              <div style={{ fontSize: 10, color: ruleUpdateMsg.type === 'success' ? '#4ade80' : '#f87171', marginTop: 4 }}>
                {ruleUpdateMsg.text}
              </div>
            )}
          </div>

          <div className="section-title">Extension Updates</div>
          <div style={{ background: '#1a1a22', padding: 10, borderRadius: 8, border: '1px solid #333342', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 12 }}>App Binary</span>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>v0.1.0</span>
            </div>
            <button
              onClick={handleCheckAppUpdate}
              disabled={checkingAppUpdate}
              className="btn-secondary"
              style={{ width: '100%', padding: '6px', fontSize: 11, textAlign: 'center' }}
            >
              {checkingAppUpdate ? 'Checking Chrome runtime...' : '🚀 Check for App Update'}
            </button>
            {appUpdateMsg && (
              <div style={{ fontSize: 10, color: '#60a5fa', marginTop: 6, textAlign: 'center' }}>
                {appUpdateMsg}
              </div>
            )}
          </div>

          <div className="section-title">Backup & Portability</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleExportBackup}
              className="btn-secondary"
              style={{ flex: 1, padding: '7px 4px', fontSize: 11 }}
            >
              ⬇️ Export Backup
            </button>
            <label
              className="btn-secondary"
              style={{ flex: 1, padding: '7px 4px', fontSize: 11, textAlign: 'center', cursor: 'pointer' }}
            >
              ⬆️ Import Backup
              <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
            </label>
          </div>
        </section>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <section>
          <div className="history-controls">
            <button onClick={handleClearHistory} className="btn-secondary">Clear History</button>
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="empty-state">No flagged videos in history.</div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-title" title={item.title}>{item.title}</div>
                  <div className="history-meta">
                    <span>{item.channel}</span>
                    <span className="history-badge">Score: {item.score}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: '#9ca3af' }}>{item.summaryReason}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {item.channel && !blocklist.includes(item.channel) && (
                        <button
                          onClick={async () => {
                            const updated = await BlocklistRepository.add(item.channel);
                            setBlocklist(updated);
                            notifyTabs();
                          }}
                          className="btn-link"
                          style={{ fontSize: 10, color: '#f87171' }}
                          title="Block this channel completely"
                        >
                          🚫 Block Channel
                        </button>
                      )}
                      {item.videoId && (
                        <button
                          onClick={() => handleWhitelistFromHistory(item)}
                          className="btn-link"
                          style={{ fontSize: 10 }}
                        >
                          Whitelist
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <span>StopSlop Protection Active</span>
        <button onClick={handleRescan} className="btn-link" title="Re-evaluate page">
          🔄 Re-scan Feed
        </button>
      </footer>
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<PopupApp />);
}
