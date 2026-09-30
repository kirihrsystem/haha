import { 
  DocumentData,
  UpdateData,
  WithFieldValue
} from 'firebase/firestore';

// Mock types
export type DocumentReference<T = DocumentData> = { id: string; path: string; type: 'doc' };
export type CollectionReference<T = DocumentData> = { path: string; type: 'collection' };
export type Query<T = DocumentData> = { path: string; type: 'query'; conditions: any[]; _orderBy?: any; _limit?: any };

export function collection(db: any, path: string): CollectionReference {
  return { path, type: 'collection' };
}

export function doc(db: any, path: string, id?: string): DocumentReference {
  const finalPath = id ? `${path}/${id}` : path;
  const parts = finalPath.split('/');
  const docId = parts[parts.length - 1];
  return { id: docId, path: finalPath, type: 'doc' };
}

export function query(collectionRef: CollectionReference | Query, ...queryConstraints: any[]): Query {
  const conditions = (collectionRef as any).conditions ? [...(collectionRef as any).conditions] : [];
  let _orderBy = (collectionRef as any)._orderBy;
  let _limit = (collectionRef as any)._limit;

  queryConstraints.forEach(constraint => {
      if (constraint.type === 'where') conditions.push(constraint);
      if (constraint.type === 'orderBy') _orderBy = constraint;
      if (constraint.type === 'limit') _limit = constraint;
  });

  return { path: collectionRef.path, type: 'query', conditions, _orderBy, _limit };
}

export function where(fieldPath: string, opStr: string, value: any) {
  return { type: 'where', fieldPath, opStr, value };
}

export function orderBy(fieldPath: string, directionStr: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', fieldPath, directionStr };
}

export function limit(n: number) {
  return { type: 'limit', n };
}

// Subscribers list for real-time pub-sub
type Subscriber = {
  ref: any;
  callback: (snap: any) => void;
  onError?: (error: any) => void;
};

const subscribers: Subscriber[] = [];

function notifySubscribers(path: string) {
  subscribers.forEach(sub => {
    // Check if the subscription matches the modified path or is a parent/child matching path
    const subPath = sub.ref.path;
    const isMatch = subPath === path || 
                    path.startsWith(subPath + '/') || 
                    subPath.startsWith(path + '/');
    if (isMatch) {
      if (sub.ref.type === 'doc') {
        getDoc(sub.ref).then(sub.callback).catch(sub.onError);
      } else {
        getDocs(sub.ref).then(sub.callback).catch(sub.onError);
      }
    }
  });
}

export function onSnapshot(ref: any, callback: (snap: any) => void, onError?: (error: any) => void) {
  const sub: Subscriber = { ref, callback, onError };
  subscribers.push(sub);

  // Initial immediate call
  if (ref.type === 'doc') {
    getDoc(ref).then(callback).catch(onError);
  } else {
    getDocs(ref).then(callback).catch(onError);
  }

  // Return unsubscribe function
  return () => {
    const idx = subscribers.indexOf(sub);
    if (idx > -1) {
      subscribers.splice(idx, 1);
    }
  };
}

function getLocalData() {
  const data = localStorage.getItem('mock_db');
  return data ? JSON.parse(data) : {};
}

function saveLocalData(data: any) {
  localStorage.setItem('mock_db', JSON.stringify(data));
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export async function addDoc<T extends DocumentData>(reference: CollectionReference<T>, data: WithFieldValue<T>): Promise<DocumentReference<T>> {
  const db = getLocalData();
  const collectionName = reference.path;
  if (!db[collectionName]) db[collectionName] = {};
  
  const id = generateId();
  db[collectionName][id] = { ...data };
  saveLocalData(db);
  
  notifySubscribers(collectionName);
  return doc(null, collectionName, id) as DocumentReference<T>;
}

export async function setDoc<T extends DocumentData>(reference: DocumentReference<T>, data: WithFieldValue<T>): Promise<void> {
  const db = getLocalData();
  const parts = reference.path.split('/');
  const collectionName = parts.slice(0, -1).join('/');
  
  if (!db[collectionName]) db[collectionName] = {};
  db[collectionName][reference.id] = { ...db[collectionName][reference.id], ...data };
  saveLocalData(db);

  notifySubscribers(collectionName);
  notifySubscribers(reference.path);
}

export async function updateDoc<T extends DocumentData>(reference: DocumentReference<T>, data: UpdateData<T>): Promise<void> {
  const db = getLocalData();
  const parts = reference.path.split('/');
  const collectionName = parts.slice(0, -1).join('/');
  
  if (!db[collectionName]) db[collectionName] = {};
  if (!db[collectionName][reference.id]) throw new Error("Document not found");
  
  db[collectionName][reference.id] = { ...db[collectionName][reference.id], ...data };
  saveLocalData(db);

  notifySubscribers(collectionName);
  notifySubscribers(reference.path);
}

export async function deleteDoc<T extends DocumentData>(reference: DocumentReference<T>): Promise<void> {
  const db = getLocalData();
  const parts = reference.path.split('/');
  const collectionName = parts.slice(0, -1).join('/');
  
  if (db[collectionName] && db[collectionName][reference.id]) {
    delete db[collectionName][reference.id];
    saveLocalData(db);
  }

  notifySubscribers(collectionName);
  notifySubscribers(reference.path);
}

export async function getDoc<T extends DocumentData>(reference: DocumentReference<T>) {
  const db = getLocalData();
  const parts = reference.path.split('/');
  const collectionName = parts.slice(0, -1).join('/');
  
  const data = db[collectionName]?.[reference.id] || null;
  return {
    id: reference.id,
    exists: () => !!data,
    data: () => data
  };
}

export async function getDocs<T extends DocumentData>(queryRef: Query<T> | CollectionReference<T>) {
  const db = getLocalData();
  const collectionName = queryRef.path;
  const docs = db[collectionName] || {};
  
  let results = Object.keys(docs).map(id => ({
    id,
    data: () => docs[id]
  }));

  if (queryRef.type === 'query' && (queryRef as Query).conditions) {
    for (const cond of (queryRef as Query).conditions) {
      if (cond.opStr === '==') {
        results = results.filter(d => Boolean(d.data()[cond.fieldPath] === cond.value));
      } else if (cond.opStr === '>=') {
        results = results.filter(d => Boolean(d.data()[cond.fieldPath] >= cond.value));
      } else if (cond.opStr === '<=') {
        results = results.filter(d => Boolean(d.data()[cond.fieldPath] <= cond.value));
      } else if (cond.opStr === 'array-contains') {
        results = results.filter(d => Boolean(Array.isArray(d.data()[cond.fieldPath]) && d.data()[cond.fieldPath].includes(cond.value)));
      } else if (cond.opStr === '>') {
        results = results.filter(d => Boolean(d.data()[cond.fieldPath] > cond.value));
      } else if (cond.opStr === '<') {
        results = results.filter(d => Boolean(d.data()[cond.fieldPath] < cond.value));
      }
    }
  }
  
  // Sort
  if (queryRef.type === 'query' && (queryRef as Query)._orderBy) {
    const ob = (queryRef as Query)._orderBy;
    results.sort((a, b) => {
      const vA = a.data()[ob.fieldPath];
      const vB = b.data()[ob.fieldPath];
      if (vA < vB) return ob.directionStr === 'asc' ? -1 : 1;
      if (vA > vB) return ob.directionStr === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Limit
  if (queryRef.type === 'query' && (queryRef as Query)._limit) {
    results = results.slice(0, (queryRef as Query)._limit.n);
  }

  return {
    empty: results.length === 0,
    docs: results,
    forEach: (cb: any) => results.forEach(cb)
  };
}
