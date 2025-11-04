import type { Conversation, Message } from '../types';

const STORAGE_CONV = 'mc_conversations_v1';
const STORAGE_MSG = 'mc_messages_v1';

function readConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CONV);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function writeConversations(items: Conversation[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_CONV, JSON.stringify(items));
}

function readMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_MSG);
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
}

function writeMessages(items: Message[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_MSG, JSON.stringify(items));
}

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export const messaging = {
  listConversationsByUser(userId: string): Conversation[] {
    const convs = readConversations();
    return convs.filter(c => c.mentorId === userId || c.menteeId === userId)
      .sort((a, b) => (b.lastMessageAt || b.createdAt).localeCompare(a.lastMessageAt || a.createdAt));
  },

  getConversationById(id: string): Conversation | undefined {
    return readConversations().find(c => c.id === id);
  },

  getOrCreateConversation(params: { mentorId: string; menteeId: string; bookingId?: string }): Conversation {
    const convs = readConversations();
    const existing = convs.find(c => c.mentorId === params.mentorId && c.menteeId === params.menteeId && c.bookingId === params.bookingId);
    if (existing) return existing;
    const id = genId('cv');
    const createdAt = nowIso();
    const conv: Conversation = { id, mentorId: params.mentorId, menteeId: params.menteeId, bookingId: params.bookingId, createdAt };
    convs.push(conv);
    writeConversations(convs);
    return conv;
  },

  listMessages(conversationId: string): Message[] {
    return readMessages()
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  sendMessage(conversationId: string, senderUserId: string, content: string): Message {
    const msgs = readMessages();
    const id = genId('msg');
    const createdAt = nowIso();
    const message: Message = { id, conversationId, senderUserId, content, type: 'text', createdAt };
    msgs.push(message);
    writeMessages(msgs);

    // bump conversation timestamp
    const convs = readConversations();
    const idx = convs.findIndex(c => c.id === conversationId);
    if (idx !== -1) {
      convs[idx] = { ...convs[idx], lastMessageAt: createdAt };
      writeConversations(convs);
    }

    return message;
  },
};

export type { Conversation, Message };

