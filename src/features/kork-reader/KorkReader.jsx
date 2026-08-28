import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ePub from 'epubjs';
import {
  BookmarkIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExpandIcon,
  LibraryIcon,
  MenuIcon,
  MinusIcon,
  MoonIcon,
  PlusIcon,
  SettingsIcon,
  SunIcon,
  TrashIcon,
  UploadIcon,
  XIcon,
} from './icons';
import {
  deleteBook,
  estimateStorage,
  getBook,
  getReadingState,
  listBooks,
  patchReadingState,
  putBook,
  updateBook,
} from './readerDb';
import './KorkReader.css';

const DEFAULT_SETTINGS = {
  theme: 'light',
  fontScale: 100,
  fontFamily: 'serif',
  lineHeight: 1.65,
  margin: 28,
};

const THEMES = {
  light: {
    body: { color: '#282723', background: '#f6f3eb' },
    a: { color: '#705b3a' },
    '::selection': { background: 'rgba(181, 145, 83, 0.28)' },
  },
  sepia: {
    body: { color: '#3a3024', background: '#eadfc7' },
    a: { color: '#775f39' },
    '::selection': { background: 'rgba(139, 103, 54, 0.28)' },
  },
  dark: {
    body: { color: '#dedbd4', background: '#161819' },
    a: { color: '#d5ad68' },
    '::selection': { background: 'rgba(213, 173, 104, 0.32)' },
  },
};

const FONT_STACKS = {
  serif: 'Georgia, Cambria, "Times New Roman", serif',
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  book: 'Charter, "Bitstream Charter", Georgia, serif',
};

function bytesToSize(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** order).toFixed(order > 1 ? 1 : 0)} ${units[order]}`;
}

function normalizeCreator(creator) {
  if (!creator) return 'Unknown author';
  if (Array.isArray(creator)) return creator.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean).join(', ') || 'Unknown author';
  if (typeof creator === 'object') return creator.name || creator.value || 'Unknown author';
  return String(creator);
}

async function hashArrayBuffer(buffer) {
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
  }
  const bytes = new Uint8Array(buffer);
  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 16777619);
  }
  return `book-${(hash >>> 0).toString(16)}-${bytes.length}`;
}

function flattenToc(items = [], depth = 0) {
  return items.flatMap((item) => [
    { ...item, depth },
    ...flattenToc(item.subitems || item.children || [], depth + 1),
  ]);
}

function findChapterLabel(toc, href) {
  if (!href) return '';
  const clean = href.split('#')[0];
  const exact = toc.find((item) => item.href?.split('#')[0] === clean);
  return exact?.label?.trim() || '';
}

function IconButton({ label, children, className = '', ...props }) {
  return (
    <button type="button" className={`kr-icon-button ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

function ProgressRing({ value = 0 }) {
  const progress = Math.max(0, Math.min(100, value));
  return (
    <span className="kr-progress-ring" style={{ '--kr-progress': `${progress * 3.6}deg` }} aria-label={`${Math.round(progress)}% read`}>
      <span>{Math.round(progress)}%</span>
    </span>
  );
}

export default function KorkReader() {
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const epubRef = useRef(null);
  const activeBookIdRef = useRef(null);
  const currentCfiRef = useRef(null);
  const touchStartRef = useRef(null);
  const saveTimerRef = useRef(null);

  const [books, setBooks] = useState([]);
  const [activeBook, setActiveBook] = useState(null);
  const [readingState, setReadingState] = useState(null);
  const [toc, setToc] = useState([]);
  const [progress, setProgress] = useState(0);
  const [chapterLabel, setChapterLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Opening book…');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('contents');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [storage, setStorage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const settings = { ...DEFAULT_SETTINGS, ...(readingState?.settings || {}) };
  const bookmarks = readingState?.bookmarks || [];

  const refreshLibrary = useCallback(async () => {
    const [bookRows, storageInfo] = await Promise.all([listBooks(), estimateStorage()]);
    const withProgress = await Promise.all(
      bookRows.map(async (book) => ({
        ...book,
        reading: await getReadingState(book.id),
      })),
    );
    setBooks(withProgress);
    setStorage(storageInfo);
  }, []);

  useEffect(() => {
    refreshLibrary().catch((err) => setError(err.message || 'Could not load the local library.'));
  }, [refreshLibrary]);

  const applySettings = useCallback((nextSettings) => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    const next = { ...DEFAULT_SETTINGS, ...nextSettings };
    rendition.themes.select(next.theme);
    rendition.themes.fontSize(`${next.fontScale}%`);
    rendition.themes.font(FONT_STACKS[next.fontFamily] || FONT_STACKS.serif);
    rendition.themes.override('line-height', String(next.lineHeight), true);
    rendition.themes.override('padding-left', `${next.margin}px`, true);
    rendition.themes.override('padding-right', `${next.margin}px`, true);
    rendition.themes.override('max-width', 'none', true);
  }, []);

  const persistSettings = useCallback(async (patch) => {
    if (!activeBookIdRef.current) return;
    const next = await patchReadingState(activeBookIdRef.current, { settings: patch });
    setReadingState(next);
    applySettings(next.settings);
  }, [applySettings]);

  const cleanupReader = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    try { renditionRef.current?.destroy(); } catch { /* noop */ }
    try { epubRef.current?.destroy(); } catch { /* noop */ }
    renditionRef.current = null;
    epubRef.current = null;
    activeBookIdRef.current = null;
    currentCfiRef.current = null;
    if (viewerRef.current) viewerRef.current.innerHTML = '';
  }, []);

  useEffect(() => cleanupReader, [cleanupReader]);

  const schedulePositionSave = useCallback((bookId, cfi, percentage, label) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const next = await patchReadingState(bookId, {
          cfi,
          percentage,
          chapterLabel: label,
          lastReadAt: Date.now(),
        });
        if (activeBookIdRef.current === bookId) setReadingState(next);
        await updateBook(bookId, { lastOpenedAt: Date.now() });
      } catch (err) {
        console.warn('Kork Reader could not persist the reading position.', err);
      }
    }, 220);
  }, []);

  const openBook = useCallback(async (bookId) => {
    setLoading(true);
    setLoadingText('Opening book…');
    setError('');
    setSidebarOpen(false);
    setSettingsOpen(false);
    cleanupReader();

    try {
      const record = await getBook(bookId);
      if (!record) throw new Error('This book is no longer in the local library.');
      const state = (await getReadingState(bookId)) || await patchReadingState(bookId, {});
      setActiveBook(record);
      setReadingState(state);
      setProgress(state.percentage || 0);
      setChapterLabel(state.chapterLabel || '');
      activeBookIdRef.current = bookId;

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (!viewerRef.current) throw new Error('The reader view could not be created.');

      const book = ePub(record.data.slice(0));
      epubRef.current = book;
      await book.ready;

      const navigation = await book.loaded.navigation;
      const flatToc = flattenToc(navigation?.toc || []);
      setToc(flatToc);

      if (record.locations) {
        try { book.locations.load(record.locations); } catch { /* generate below */ }
      }

      const rendition = book.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        flow: 'paginated',
        spread: 'auto',
        minSpreadWidth: 1100,
        allowScriptedContent: false,
      });
      renditionRef.current = rendition;

      Object.entries(THEMES).forEach(([name, rules]) => rendition.themes.register(name, rules));

      // EPUB.js renders chapters in an iframe, so mobile gestures must be
      // registered inside each rendered EPUB document rather than only on
      // the outer React shell.
      rendition.hooks.content.register((contents) => {
        let gestureStart = null;
        const documentRef = contents.document;

        const onTouchStart = (event) => {
          const touch = event.changedTouches?.[0];
          if (!touch) return;
          gestureStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
        };

        const onTouchEnd = (event) => {
          const start = gestureStart;
          const touch = event.changedTouches?.[0];
          gestureStart = null;
          if (!start || !touch) return;

          const target = event.target;
          if (target?.closest?.('a, button, input, select, textarea')) return;
          if (contents.window.getSelection?.()?.toString()) return;

          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          const elapsed = Date.now() - start.time;

          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25 && elapsed < 700) {
            if (dx < 0) rendition.next();
            else rendition.prev();
            return;
          }

          if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && elapsed < 450) {
            const width = contents.window.innerWidth || documentRef.documentElement.clientWidth || 1;
            const ratio = touch.clientX / width;
            if (ratio < 0.24) rendition.prev();
            else if (ratio > 0.76) rendition.next();
            else setControlsVisible((visible) => !visible);
          }
        };

        documentRef.addEventListener('touchstart', onTouchStart, { passive: true });
        documentRef.addEventListener('touchend', onTouchEnd, { passive: true });
      });

      applySettings(state.settings || DEFAULT_SETTINGS);

      rendition.on('relocated', (location) => {
        const cfi = location?.start?.cfi;
        if (!cfi) return;
        currentCfiRef.current = cfi;
        let percentage = location?.start?.percentage;
        if (book.locations?.length?.() > 0) {
          try { percentage = book.locations.percentageFromCfi(cfi); } catch { /* use rendition value */ }
        }
        const percentValue = Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage * 100)) : 0;
        const label = findChapterLabel(flatToc, location?.start?.href) || state.chapterLabel || '';
        setProgress(percentValue);
        setChapterLabel(label);
        schedulePositionSave(bookId, cfi, percentValue, label);
      });

      rendition.on('keyup', (event) => {
        if (event.key === 'ArrowLeft') rendition.prev();
        if (event.key === 'ArrowRight') rendition.next();
      });

      await rendition.display(state.cfi || undefined).catch(() => rendition.display());
      applySettings(state.settings || DEFAULT_SETTINGS);
      setLoading(false);

      if (!record.locations) {
        setLoadingText('Preparing progress tracking…');
        book.locations.generate(1600).then(async () => {
          if (activeBookIdRef.current !== bookId) return;
          try {
            await updateBook(bookId, { locations: book.locations.save() });
            const cfi = currentCfiRef.current;
            if (cfi) {
              const pct = book.locations.percentageFromCfi(cfi) * 100;
              setProgress(pct);
              const locationNow = rendition.location;
              const labelNow = findChapterLabel(flatToc, locationNow?.start?.href) || state.chapterLabel || '';
              schedulePositionSave(bookId, cfi, pct, labelNow);
            }
          } catch (err) {
            console.warn('Could not cache EPUB locations.', err);
          }
        }).catch((err) => console.warn('Could not generate EPUB locations.', err));
      }

      updateBook(bookId, { lastOpenedAt: Date.now() }).catch(() => { });
    } catch (err) {
      cleanupReader();
      setActiveBook(null);
      setReadingState(null);
      setLoading(false);
      setError(err?.message || 'Could not open this EPUB.');
    }
  }, [applySettings, cleanupReader, schedulePositionSave]);

  const importFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.epub')) {
      setError('Kork Reader 0.1 supports EPUB files. Please choose a .epub file.');
      return;
    }

    setLoading(true);
    setLoadingText('Adding to this browser…');
    setError('');
    let tempBook;
    try {
      const data = await file.arrayBuffer();
      const id = await hashArrayBuffer(data);
      const existing = await getBook(id);
      if (existing) {
        setLoading(false);
        await openBook(id);
        return;
      }

      tempBook = ePub(data.slice(0));
      await tempBook.ready;
      const metadata = await tempBook.loaded.metadata;
      const now = Date.now();
      await putBook({
        id,
        fileName: file.name,
        fileSize: file.size,
        title: metadata?.title?.trim() || file.name.replace(/\.epub$/i, ''),
        creator: normalizeCreator(metadata?.creator),
        language: metadata?.language || '',
        identifier: metadata?.identifier || '',
        data,
        addedAt: now,
        lastOpenedAt: now,
      });
      await patchReadingState(id, {});
      tempBook.destroy();
      tempBook = null;
      await refreshLibrary();
      setLoading(false);
      await openBook(id);
    } catch (err) {
      try { tempBook?.destroy(); } catch { /* noop */ }
      setLoading(false);
      setError(err?.message || 'This EPUB could not be imported.');
    }
  }, [openBook, refreshLibrary]);

  const removeBook = useCallback(async (bookId) => {
    if (activeBookIdRef.current === bookId) {
      cleanupReader();
      setActiveBook(null);
      setReadingState(null);
    }
    await deleteBook(bookId);
    await refreshLibrary();
  }, [cleanupReader, refreshLibrary]);

  const goLibrary = useCallback(async () => {
    cleanupReader();
    setActiveBook(null);
    setReadingState(null);
    setToc([]);
    setSidebarOpen(false);
    setSettingsOpen(false);
    await refreshLibrary();
  }, [cleanupReader, refreshLibrary]);

  const nextPage = useCallback(() => renditionRef.current?.next(), []);
  const prevPage = useCallback(() => renditionRef.current?.prev(), []);

  useEffect(() => {
    const onKey = (event) => {
      if (!activeBook || event.defaultPrevented) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); prevPage(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); nextPage(); }
      if (event.key === 'Escape') { setSettingsOpen(false); setSidebarOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeBook, nextPage, prevPage]);

  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (err) {
      setError(err?.message || 'Fullscreen is unavailable in this browser.');
    }
  }, []);

  const jumpTo = useCallback((hrefOrCfi) => {
    renditionRef.current?.display(hrefOrCfi);
    setSidebarOpen(false);
  }, []);

  const currentBookmarked = useMemo(() => {
    const cfi = currentCfiRef.current || readingState?.cfi;
    return Boolean(cfi && bookmarks.some((item) => item.cfi === cfi));
  }, [bookmarks, readingState?.cfi, progress]);

  const toggleBookmark = useCallback(async () => {
    const bookId = activeBookIdRef.current;
    const cfi = currentCfiRef.current || readingState?.cfi;
    if (!bookId || !cfi) return;
    const exists = bookmarks.some((item) => item.cfi === cfi);
    const nextBookmarks = exists
      ? bookmarks.filter((item) => item.cfi !== cfi)
      : [...bookmarks, { cfi, percentage: progress, chapterLabel, createdAt: Date.now() }]
        .sort((a, b) => a.percentage - b.percentage);
    const next = await patchReadingState(bookId, { bookmarks: nextBookmarks });
    setReadingState(next);
  }, [bookmarks, chapterLabel, progress, readingState?.cfi]);

  const updateSetting = useCallback((key, value) => {
    persistSettings({ [key]: value }).catch((err) => setError(err.message));
  }, [persistSettings]);

  const handleTouchStart = (event) => {
    const touch = event.changedTouches?.[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25 && Date.now() - start.time < 700) {
      if (dx < 0) nextPage(); else prevPage();
    }
  };

  const handleReaderTap = (event) => {
    if (event.target.closest('button, input, select, a')) return;
    if (window.matchMedia('(min-width: 761px)').matches) return;
    const ratio = event.clientX / window.innerWidth;
    if (ratio < 0.24) prevPage();
    else if (ratio > 0.76) nextPage();
    else setControlsVisible((visible) => !visible);
  };

  const storageLabel = storage?.usage != null && storage?.quota
    ? `${bytesToSize(storage.usage)} used of ${bytesToSize(storage.quota)} browser storage`
    : 'Stored in this browser only';

  if (!activeBook) {
    return (
      <main className="kr-shell kr-library-shell">
        <header className="kr-library-header">
          <div className="kr-brand-mark"><BookOpenIcon size={24} /></div>
          <div>
            <p className="kr-eyebrow">Korki.dev</p>
            <h1>Kork Reader</h1>
          </div>
          <span className="kr-version">0.1</span>
        </header>

        <section className="kr-hero">
          <div className="kr-hero-copy">

            <h2>Your EPUBs stay on your device.</h2>

          </div>

          <label
            className={`kr-dropzone ${dragging ? 'is-dragging' : ''}`}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              importFile(event.dataTransfer.files?.[0]);
            }}
          >
            <input type="file" accept=".epub,application/epub+zip" onChange={(event) => importFile(event.target.files?.[0])} />
            <UploadIcon size={30} />
            <strong>Open an EPUB</strong>
            <span>Drag & drop or choose a file</span>
          </label>
        </section>

        {error && <div className="kr-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')}><XIcon /></button></div>}
        {loading && <div className="kr-loading-card"><span className="kr-spinner" /><span>{loadingText}</span></div>}

        <section className="kr-library-section">
          <div className="kr-section-heading">
            <div>
              <p className="kr-eyebrow">On this device</p>
              <h2>Library</h2>
            </div>
            <span className="kr-storage-label">{storageLabel}</span>
          </div>

          {books.length === 0 ? (
            <div className="kr-empty-library">
              <LibraryIcon size={34} />
              <h3>No local books yet</h3>
              <p>Your first EPUB will appear here after you open it.</p>
            </div>
          ) : (
            <div className="kr-book-grid">
              {books.map((book) => {
                const pct = book.reading?.percentage || 0;
                return (
                  <article className="kr-book-card" key={book.id}>
                    <button type="button" className="kr-book-main" onClick={() => openBook(book.id)}>
                      <div className="kr-book-cover" aria-hidden="true">
                        <span className="kr-book-cover-k">K</span>
                        <span>EPUB</span>
                      </div>
                      <div className="kr-book-info">
                        <h3>{book.title}</h3>
                        <p>{book.creator}</p>
                        <span>{book.reading?.chapterLabel || (pct > 0 ? 'Continue reading' : 'Not started')}</span>
                        <div className="kr-card-progress"><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
                        <strong>{pct > 0 ? `${Math.round(pct)}% read` : 'Open book'}</strong>
                      </div>
                    </button>
                    <button type="button" className="kr-delete-book" aria-label={`Remove ${book.title} from this browser`} title="Remove from this browser" onClick={() => removeBook(book.id)}>
                      <TrashIcon size={18} />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="kr-library-footer">No account · no upload · no server storage</footer>
      </main>
    );
  }

  return (
    <main
      className={`kr-shell kr-reader-shell kr-theme-${settings.theme} ${controlsVisible ? 'controls-visible' : 'controls-hidden'} ${isFullscreen ? 'is-fullscreen' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleReaderTap}
    >
      <header className="kr-reader-topbar">
        <div className="kr-topbar-left">
          <IconButton
            label="Back to local library"
            className="kr-back-library-button"
            onClick={(e) => {
              e.stopPropagation();
              goLibrary();
            }}
          >
            <ChevronLeftIcon size={18} />
            <LibraryIcon size={20} />
          </IconButton>          <IconButton label="Table of contents and bookmarks" onClick={(e) => { e.stopPropagation(); setSidebarOpen((v) => !v); setSettingsOpen(false); }}><MenuIcon /></IconButton>
        </div>
        <div className="kr-book-heading">
          <strong>{activeBook.title}</strong>
          <span>{chapterLabel || activeBook.creator}</span>
        </div>
        <div className="kr-topbar-right">
          <ProgressRing value={progress} />
          <IconButton label={currentBookmarked ? 'Remove bookmark' : 'Bookmark this page'} onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}>
            <BookmarkIcon filled={currentBookmarked} />
          </IconButton>
          <IconButton label="Reading settings" onClick={(e) => { e.stopPropagation(); setSettingsOpen((v) => !v); setSidebarOpen(false); }}><SettingsIcon /></IconButton>
          <IconButton label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}><ExpandIcon /></IconButton>
        </div>
      </header>

      {error && <div className="kr-reader-error" role="alert">{error}<button type="button" onClick={() => setError('')}><XIcon /></button></div>}

      <aside className={`kr-sidebar ${sidebarOpen ? 'is-open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="kr-sidebar-header">
          <div className="kr-sidebar-tabs">
            <button type="button" className={sidebarTab === 'contents' ? 'active' : ''} onClick={() => setSidebarTab('contents')}>Contents</button>
            <button type="button" className={sidebarTab === 'bookmarks' ? 'active' : ''} onClick={() => setSidebarTab('bookmarks')}>Bookmarks <span>{bookmarks.length}</span></button>
          </div>
          <IconButton label="Close panel" onClick={() => setSidebarOpen(false)}><XIcon /></IconButton>
        </div>

        {sidebarTab === 'contents' ? (
          <nav className="kr-toc" aria-label="Table of contents">
            {toc.length ? toc.map((item, index) => (
              <button key={`${item.href}-${index}`} type="button" style={{ '--depth': item.depth }} onClick={() => jumpTo(item.href)}>
                {item.label?.trim() || `Section ${index + 1}`}
              </button>
            )) : <p className="kr-panel-empty">This EPUB does not provide a table of contents.</p>}
          </nav>
        ) : (
          <div className="kr-bookmarks-list">
            {bookmarks.length ? bookmarks.map((bookmark, index) => (
              <div className="kr-bookmark-row" key={bookmark.cfi}>
                <button type="button" onClick={() => jumpTo(bookmark.cfi)}>
                  <strong>{bookmark.chapterLabel || `Bookmark ${index + 1}`}</strong>
                  <span>{Math.round(bookmark.percentage || 0)}%</span>
                </button>
                <IconButton label="Remove bookmark" onClick={async () => {
                  const next = await patchReadingState(activeBook.id, { bookmarks: bookmarks.filter((b) => b.cfi !== bookmark.cfi) });
                  setReadingState(next);
                }}><TrashIcon size={17} /></IconButton>
              </div>
            )) : <p className="kr-panel-empty">Bookmark a page and it will appear here.</p>}
          </div>
        )}
      </aside>

      {sidebarOpen && <button type="button" className="kr-panel-scrim" aria-label="Close panel" onClick={(e) => { e.stopPropagation(); setSidebarOpen(false); }} />}

      <section className={`kr-settings-popover ${settingsOpen ? 'is-open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="kr-settings-heading"><strong>Reading settings</strong><IconButton label="Close settings" onClick={() => setSettingsOpen(false)}><XIcon size={18} /></IconButton></div>

        <div className="kr-setting-row kr-theme-row">
          <span>Theme</span>
          <div className="kr-segmented">
            <button type="button" className={settings.theme === 'light' ? 'active' : ''} onClick={() => updateSetting('theme', 'light')}><SunIcon size={16} /> Light</button>
            <button type="button" className={settings.theme === 'sepia' ? 'active' : ''} onClick={() => updateSetting('theme', 'sepia')}>Aa Sepia</button>
            <button type="button" className={settings.theme === 'dark' ? 'active' : ''} onClick={() => updateSetting('theme', 'dark')}><MoonIcon size={16} /> Dark</button>
          </div>
        </div>

        <div className="kr-setting-row">
          <span>Text size</span>
          <div className="kr-stepper">
            <IconButton label="Smaller text" disabled={settings.fontScale <= 75} onClick={() => updateSetting('fontScale', Math.max(75, settings.fontScale - 10))}><MinusIcon size={17} /></IconButton>
            <strong>{settings.fontScale}%</strong>
            <IconButton label="Larger text" disabled={settings.fontScale >= 180} onClick={() => updateSetting('fontScale', Math.min(180, settings.fontScale + 10))}><PlusIcon size={17} /></IconButton>
          </div>
        </div>

        <label className="kr-setting-row">
          <span>Font</span>
          <select value={settings.fontFamily} onChange={(e) => updateSetting('fontFamily', e.target.value)}>
            <option value="book">Book</option>
            <option value="serif">Serif</option>
            <option value="sans">Sans serif</option>
          </select>
        </label>

        <label className="kr-setting-slider">
          <span><span>Line spacing</span><strong>{settings.lineHeight.toFixed(2)}</strong></span>
          <input type="range" min="1.25" max="2.1" step="0.05" value={settings.lineHeight} onChange={(e) => updateSetting('lineHeight', Number(e.target.value))} />
        </label>

        <label className="kr-setting-slider">
          <span><span>Page margins</span><strong>{settings.margin}px</strong></span>
          <input type="range" min="8" max="72" step="4" value={settings.margin} onChange={(e) => updateSetting('margin', Number(e.target.value))} />
        </label>
      </section>

      <section className="kr-reader-stage">
        {loading && <div className="kr-reader-loading"><span className="kr-spinner" /><span>{loadingText}</span></div>}
        <button type="button" className="kr-page-arrow kr-page-arrow-left" aria-label="Previous page" onClick={(e) => { e.stopPropagation(); prevPage(); }}><ChevronLeftIcon size={30} /></button>
        <div className="kr-epub-frame" ref={viewerRef} />
        <button type="button" className="kr-page-arrow kr-page-arrow-right" aria-label="Next page" onClick={(e) => { e.stopPropagation(); nextPage(); }}><ChevronRightIcon size={30} /></button>
      </section>

      <footer className="kr-reader-bottombar">
        <button type="button" onClick={(e) => { e.stopPropagation(); prevPage(); }}><ChevronLeftIcon size={20} /> Previous</button>
        <div className="kr-bottom-progress">
          <span><strong>{Math.round(progress)}%</strong> read</span>
          <div><i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); nextPage(); }}>Next <ChevronRightIcon size={20} /></button>
      </footer>
    </main>
  );
}
