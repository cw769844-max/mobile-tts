import {
  ref, set, get, update, push, onValue, off, runTransaction, DataSnapshot,
} from 'firebase/database';
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL,
} from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { db, auth, storage } from './config';
import { GameRoom, GameConfig, GameState, Token, PlayerScore, PlayerId, VpEntry, DEFAULT_CONFIG, StratagemLog } from '../types/game';
import { v4 as uuidv4 } from 'uuid';

// ---- Auth ----

export async function ensureAuth(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.uid;
  const cred = await signInAnonymously(auth);
  return cred.user.uid;
}

// ---- Room creation ----

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createGame(hostName: string): Promise<{ gameId: string; code: string }> {
  const uid = await ensureAuth();
  const gameId = uuidv4();
  const code = generateCode();

  const now = Date.now();
  const initialRoom: GameRoom = {
    id: gameId,
    meta: {
      code,
      createdAt: now,
      p1: { uid, name: hostName, connected: true },
      p2: null,
    },
    config: DEFAULT_CONFIG,
    state: {
      round: 1,
      phase: 'command',
      activePlayer: 'p1',
      status: 'waiting',
    },
    scores: {
      p1: { vp: 0, cp: 0, vpLog: [] },
      p2: { vp: 0, cp: 0, vpLog: [] },
    },
    tokens: {},
  };

  await set(ref(db, `games/${gameId}`), initialRoom);
  await set(ref(db, `gameCodes/${code}`), gameId);

  return { gameId, code };
}

export async function joinGame(code: string, guestName: string): Promise<string> {
  const uid = await ensureAuth();
  const snap = await get(ref(db, `gameCodes/${code.toUpperCase()}`));
  if (!snap.exists()) throw new Error('Game not found. Check your invite code.');
  const gameId = snap.val() as string;

  await update(ref(db, `games/${gameId}/meta/p2`), {
    uid, name: guestName, connected: true,
  });

  return gameId;
}

export async function startGame(gameId: string): Promise<void> {
  await update(ref(db, `games/${gameId}/state`), { status: 'active' });
}

// ---- Subscriptions ----

export function subscribeGame(gameId: string, cb: (room: GameRoom | null) => void): () => void {
  const gameRef = ref(db, `games/${gameId}`);
  const handler = (snap: DataSnapshot) => cb(snap.exists() ? (snap.val() as GameRoom) : null);
  onValue(gameRef, handler);
  return () => off(gameRef, 'value', handler);
}

// ---- Token operations ----

export async function upsertToken(gameId: string, token: Token): Promise<void> {
  await set(ref(db, `games/${gameId}/tokens/${token.id}`), token);
}

export async function updateTokenPosition(gameId: string, tokenId: string, x: number, y: number): Promise<void> {
  await update(ref(db, `games/${gameId}/tokens/${tokenId}`), { x, y });
}

export async function updateTokenData(gameId: string, tokenId: string, partial: Partial<Token>): Promise<void> {
  await update(ref(db, `games/${gameId}/tokens/${tokenId}`), partial);
}

export async function removeToken(gameId: string, tokenId: string): Promise<void> {
  await set(ref(db, `games/${gameId}/tokens/${tokenId}`), null);
}

// ---- Phase/state ----

export async function updateGameState(gameId: string, state: Partial<GameState>): Promise<void> {
  await update(ref(db, `games/${gameId}/state`), state);
}

export async function updateConfig(gameId: string, config: Partial<GameConfig>): Promise<void> {
  await update(ref(db, `games/${gameId}/config`), config);
}

// ---- Scoring ----

export async function incrementVP(gameId: string, player: PlayerId, amount: number): Promise<void> {
  await runTransaction(ref(db, `games/${gameId}/scores/${player}/vp`), (current) =>
    (current ?? 0) + amount,
  );
}

export async function adjustCP(gameId: string, player: PlayerId, delta: number): Promise<void> {
  await runTransaction(ref(db, `games/${gameId}/scores/${player}/cp`), (current) =>
    Math.max(0, (current ?? 0) + delta),
  );
}

export async function appendVpLog(gameId: string, entry: VpEntry): Promise<void> {
  await push(ref(db, `games/${gameId}/scores/${entry.player}/vpLog`), entry);
}

export async function appendStratagemLog(gameId: string, entry: StratagemLog): Promise<void> {
  await push(ref(db, `games/${gameId}/stratagemLog`), entry);
}

// ---- Image upload ----

export async function uploadImage(
  localUri: string,
  path: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const sRef = storageRef(storage, path);
  const task = uploadBytesResumable(sRef, blob);

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(snap.bytesTransferred / snap.totalBytes),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref)),
    );
  });
}

// ---- Presence ----

export async function setConnected(gameId: string, player: PlayerId, connected: boolean): Promise<void> {
  await update(ref(db, `games/${gameId}/meta/${player}`), { connected });
}
