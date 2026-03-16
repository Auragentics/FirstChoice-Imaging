import { getUnits } from '../sheets-client.js';

export async function getAllPricingHandler(_args: Record<string, never>) {
  const units = await getUnits();

  // Group by size, show lowest price and availability count
  const sizeMap = new Map<string, { minRate: number; total: number; available: number; sqFt: number }>();

  for (const u of units) {
    const existing = sizeMap.get(u.size);
    if (!existing) {
      sizeMap.set(u.size, {
        minRate: u.monthlyRate,
        total: 1,
        available: u.status === 'available' ? 1 : 0,
        sqFt: u.sqFt,
      });
    } else {
      existing.total += 1;
      if (u.status === 'available') existing.available += 1;
      if (u.monthlyRate < existing.minRate) existing.minRate = u.monthlyRate;
    }
  }

  if (sizeMap.size === 0) {
    return {
      content: [{ type: 'text' as const, text: 'No unit pricing information available.' }],
    };
  }

  const lines = Array.from(sizeMap.entries())
    .sort((a, b) => a[1].sqFt - b[1].sqFt)
    .map(
      ([size, info]) =>
        `${size} (${info.sqFt} sq ft): $${info.minRate}/month — ${info.available} of ${info.total} available`
    );

  return {
    content: [
      {
        type: 'text' as const,
        text: `Storage unit pricing and availability:\n${lines.join('\n')}`,
      },
    ],
  };
}
