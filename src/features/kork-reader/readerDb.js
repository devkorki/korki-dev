const DB_NAME = 'kork-reader-v1';
const DB_VERSION = 1;
const BOOKS = 'books';
const READING = 'reading';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BOOKS)) {
        const store = db.createObjectStore(BOOKS, { keyPath: 'id' });
        store.createIndex('lastOpenedAt', 'lastOpenedAt');
        store.createIndex('addedAt', 'addedAt');
      }
      if (!db.objectStoreNames.contains(READING)) {
        db.createObjectStore(READING, { keyPath: 'bookId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction(storeName, mode, handler) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        let result;
        try {
          result = handler(store);
        } catch (error) {
          db.close();
          reject(error);
          return;
        }

        tx.oncomplete = () => {
          db.close();
          resolve(result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error || new Error('IndexedDB transaction aborted.'));
        };
      }),
  );
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listBooks() {
  const db = await openDb();
  try {
    const tx = db.transaction(BOOKS, 'readonly');
    const rows = await requestToPromise(tx.objectStore(BOOKS).getAll());
    return rows.sort((a, b) => (b.lastOpenedAt || b.addedAt || 0) - (a.lastOpenedAt || a.addedAt || 0));
  } finally {
    db.close();
  }
}

export async function getBook(bookId) {
  const db = await openDb();
  try {
    const tx = db.transaction(BOOKS, 'readonly');
    return await requestToPromise(tx.objectStore(BOOKS).get(bookId));
  } finally {
    db.close();
  }
}

export async function putBook(book) {
  return transaction(BOOKS, 'readwrite', (store) => store.put(book));
}

export async function updateBook(bookId, patch) {
  const current = await getBook(bookId);
  if (!current) return null;
  const next = { ...current, ...patch };
  await putBook(next);
  return next;
}

export async function deleteBook(bookId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([BOOKS, READING], 'readwrite');
    tx.objectStore(BOOKS).delete(bookId);
    tx.objectStore(READING).delete(bookId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getReadingState(bookId) {
  const db = await openDb();
  try {
    const tx = db.transaction(READING, 'readonly');
    return await requestToPromise(tx.objectStore(READING).get(bookId));
  } finally {
    db.close();
  }
}

export async function putReadingState(state) {
  return transaction(READING, 'readwrite', (store) => store.put(state));
}

export async function patchReadingState(bookId, patch) {
  const current = (await getReadingState(bookId)) || {
    bookId,
    cfi: null,
    percentage: 0,
    chapterLabel: '',
    bookmarks: [],
    settings: {
      theme: 'light',
      fontScale: 100,
      fontFamily: 'serif',
      lineHeight: 1.65,
      margin: 28,
    },
  };
  const next = {
    ...current,
    ...patch,
    settings: patch.settings ? { ...current.settings, ...patch.settings } : current.settings,
    updatedAt: Date.now(),
  };
  await putReadingState(next);
  return next;
}

export async function estimateStorage() {
  if (!navigator.storage?.estimate) return null;
  try {
    return await navigator.storage.estimate();
  } catch {
    return null;
  }
}
