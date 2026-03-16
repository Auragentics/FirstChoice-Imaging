import { getUnits } from '../sheets-client.js';

export async function checkUnitAvailabilityHandler(args: { size?: string }) {
  const units = await getUnits();
  const available = units.filter((u) => u.status === 'available');

  if (available.length === 0) {
    return {
      content: [{ type: 'text' as const, text: 'No units are currently available.' }],
    };
  }

  // Filter by size if provided
  const sizeQuery = (args.size || '').toLowerCase().replace(/\s/g, '');
  const filtered = sizeQuery
    ? available.filter((u) => u.size.toLowerCase().replace(/\s/g, '').includes(sizeQuery))
    : available;

  if (filtered.length === 0) {
    const sizes = [...new Set(available.map((u) => u.size))].join(', ');
    return {
      content: [
        {
          type: 'text' as const,
          text: `No available units match size "${args.size}". Available sizes: ${sizes}`,
        },
      ],
    };
  }

  const lines = filtered.map(
    (u) =>
      `Unit ${u.unitNumber}: ${u.size} (${u.sqFt} sq ft) — $${u.monthlyRate}/month${u.notes ? ` — ${u.notes}` : ''}`
  );

  return {
    content: [
      {
        type: 'text' as const,
        text: `Found ${filtered.length} available unit(s):\n${lines.join('\n')}`,
      },
    ],
  };
}
