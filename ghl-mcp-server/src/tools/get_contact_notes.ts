import { ghlRequest } from '../ghl-client.js';

interface Note {
  id: string;
  body: string;
  dateAdded: string;
  userId?: string;
}

interface NotesResponse {
  notes: Note[];
  total: number;
}

export function makeGetContactNotesHandler(tenant: string) {
  return async (args: { contact_id: string }) => {
    const data = await ghlRequest<NotesResponse>(
      tenant,
      'GET',
      `/contacts/${args.contact_id}/notes`
    );

    if (!data.notes || data.notes.length === 0) {
      return {
        content: [{ type: 'text' as const, text: `No notes found for contact ${args.contact_id}` }],
      };
    }

    const noteLines = data.notes.map((n) =>
      `[${n.dateAdded}] (by: ${n.userId || 'unknown'})\n${n.body}`
    ).join('\n\n---\n\n');

    return {
      content: [{ type: 'text' as const, text: `${data.notes.length} note(s):\n\n${noteLines}` }],
    };
  };
}
