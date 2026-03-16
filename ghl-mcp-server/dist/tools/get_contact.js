import { ghlRequest } from '../ghl-client.js';
export function makeGetContactHandler(tenant) {
    return async (args) => {
        const data = await ghlRequest(tenant, 'GET', `/contacts/${args.contact_id}`);
        const c = data.contact;
        const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || '(No name)';
        const customFieldLines = (c.customFields || [])
            .filter((f) => f.value !== null && f.value !== undefined && f.value !== '')
            .map((f) => `  ${f.fieldKey || f.key || f.id}: ${JSON.stringify(f.value)}`);
        const lines = [
            `ID: ${c.id}`,
            `Name: ${name}`,
            `Email: ${c.email ?? '(none)'}`,
            `Phone: ${c.phone ?? '(none)'}`,
            `Tags: ${c.tags?.join(', ') || '(none)'}`,
            `Source: ${c.source ?? '(none)'}`,
            `Date Added: ${c.dateAdded ?? 'unknown'}`,
        ];
        if (customFieldLines.length > 0) {
            lines.push(`Custom Fields:\n${customFieldLines.join('\n')}`);
        }
        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    };
}
