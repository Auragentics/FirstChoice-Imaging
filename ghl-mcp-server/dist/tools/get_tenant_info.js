import { getUnits } from '../sheets-client.js';
export async function getTenantInfoHandler(args) {
    const units = await getUnits();
    const occupied = units.filter((u) => u.status === 'occupied');
    let match = null;
    if (args.unit_number) {
        match = occupied.find((u) => u.unitNumber.toLowerCase() === args.unit_number.toLowerCase());
    }
    else if (args.contact_id) {
        match = occupied.find((u) => u.tenantContactId === args.contact_id);
    }
    else if (args.name) {
        const q = args.name.toLowerCase();
        match = occupied.find((u) => u.tenantName.toLowerCase().includes(q));
    }
    if (!match) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'No tenant record found matching the provided information.',
                },
            ],
        };
    }
    return {
        content: [
            {
                type: 'text',
                text: [
                    `Tenant: ${match.tenantName}`,
                    `Unit: ${match.unitNumber} (${match.size}, ${match.sqFt} sq ft)`,
                    `Monthly Rate: $${match.monthlyRate}`,
                    `GHL Contact ID: ${match.tenantContactId || 'N/A'}`,
                    match.notes ? `Notes: ${match.notes}` : '',
                ]
                    .filter(Boolean)
                    .join('\n'),
            },
        ],
    };
}
