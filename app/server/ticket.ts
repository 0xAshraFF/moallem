// Read flights off a photo of a Hajj air ticket with Gemini vision (REST, no SDK).
// Needs GEMINI_API_KEY; without it the app falls back to a short manual form.

export interface ParsedFlight { flightNo: string; date: string; time?: string; from: string; to: string }
export interface ParsedTicket { pilgrimName?: string; pnr?: string; inbound: ParsedFlight; outbound: ParsedFlight }

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    pilgrimName: { type: 'STRING' },
    pnr: { type: 'STRING' },
    flights: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          flightNo: { type: 'STRING' }, date: { type: 'STRING', description: 'YYYY-MM-DD' },
          time: { type: 'STRING', description: 'HH:MM 24h local departure' }, from: { type: 'STRING', description: 'IATA' }, to: { type: 'STRING', description: 'IATA' },
        },
        required: ['flightNo', 'date', 'from', 'to'],
      },
    },
  },
  required: ['flights'],
};

const PROMPT = 'This is a Hajj air ticket or itinerary of a Bangladeshi pilgrim (Biman, Saudia, Flynas or similar). '
  + 'Extract the passenger name, PNR/booking reference and every flight segment with flight number, date, departure time and IATA airport codes. '
  + 'Use only what is printed. Dhaka is DAC, Jeddah JED, Madinah MED.';

export async function parseTicketImage(imageBase64: string, mimeType: string): Promise<ParsedTicket | { error: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { error: 'no_ai' };
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType, data: imageBase64.replace(/^data:[^,]+,/, '') } }, { text: PROMPT }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0 },
      }),
    });
    clearTimeout(timer);
    if (!r.ok) return { error: `ai_${r.status}` };
    const j = await r.json();
    const parsed = JSON.parse(j.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}');
    const flights: ParsedFlight[] = (parsed.flights ?? []).filter((f: ParsedFlight) => /^\d{4}-\d{2}-\d{2}$/.test(f.date))
      .sort((a: ParsedFlight, b: ParsedFlight) => a.date.localeCompare(b.date));
    const inbound = flights.find((f) => f.to === 'JED' || f.to === 'MED');
    const outbound = [...flights].reverse().find((f) => f.from === 'JED' || f.from === 'MED');
    if (!inbound || !outbound) return { error: 'flights_not_found' };
    return { pilgrimName: parsed.pilgrimName, pnr: parsed.pnr, inbound, outbound };
  } catch {
    return { error: 'ai_failed' };
  }
}
