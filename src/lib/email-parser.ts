/**
 * Email Parser Engine
 * Parses Zomato and Swiggy daily summary emails
 * Uses subject + snippet first, falls back to full body
 */

// ─── ZOMATO PATTERNS ──────────────────────────────────────────────────────────

const ZOMATO_PATTERNS = {
    subjectPatterns: [
      /zomato.*daily.*summary/i,
      /zomato.*sales.*report/i,
      /your.*zomato.*performance/i,
      /zomato.*order.*summary/i,
      /daily.*report.*zomato/i,
    ],
  
    senderPatterns: [
      /noreply@zomato\.com/i,
      /reports@zomato\.com/i,
      /restaurant@zomato\.com/i,
      /notifications@zomato\.com/i,
    ],
  
    dataPatterns: {
      revenue: [
        /total\s+revenue(?:[^\d]*?(?:₹|Rs\.?|INR))?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /earnings(?:[^\d]*?(?:₹|Rs\.?|INR))?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /net\s+payout(?:[^\d]*?(?:₹|Rs\.?|INR))?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:earned|received|total)/i,
      ],
      orders: [
        /total.*orders[:\s]+([0-9]+)/i,
        /orders.*delivered[:\s]+([0-9]+)/i,
        /([0-9]+)\s*orders?\s*(?:delivered|completed)/i,
        /order.*count[:\s]+([0-9]+)/i,
      ],
      cancelled: [
        /cancelled.*orders[:\s]+([0-9]+)/i,
        /cancellations[:\s]+([0-9]+)/i,
        /([0-9]+)\s*cancellations?/i,
      ],
      rating: [
        /rating[:\s]+([0-9]+(?:\.[0-9])?)/i,
        /customer.*rating[:\s]+([0-9]+(?:\.[0-9])?)/i,
        /([0-9]+(?:\.[0-9])?)\s*\/\s*5/i,
      ],
    },
};
  
// ─── SWIGGY PATTERNS ──────────────────────────────────────────────────────────
  
const SWIGGY_PATTERNS = {
    subjectPatterns: [
      /swiggy.*daily.*report/i,
      /swiggy.*sales.*summary/i,
      /your.*swiggy.*performance/i,
      /swiggy.*order.*report/i,
      /daily.*summary.*swiggy/i,
    ],
  
    senderPatterns: [
      /noreply@swiggy\.in/i,
      /reports@swiggy\.in/i,
      /partner@swiggy\.in/i,
      /restaurant@swiggy\.in/i,
    ],
  
    dataPatterns: {
      revenue: [
        /gross\s+order\s+value(?:[^\d]*?(?:₹|Rs\.?|INR))?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /total\s+sales(?:[^\d]*?(?:₹|Rs\.?|INR))?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /revenue(?:[^\d]*?(?:₹|Rs\.?|INR))?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:total|gross|sales)/i,
      ],
      orders: [
        /orders?\s*delivered[:\s]+([0-9]+)/i,
        /total.*orders[:\s]+([0-9]+)/i,
        /([0-9]+)\s*orders?\s*(?:delivered|completed|placed)/i,
        /successful.*orders[:\s]+([0-9]+)/i,
      ],
      cancelled: [
        /cancelled[:\s]+([0-9]+)/i,
        /rejected.*orders[:\s]+([0-9]+)/i,
        /([0-9]+)\s*(?:cancelled|rejected)/i,
      ],
      rating: [
        /restaurant.*rating[:\s]+([0-9]+(?:\.[0-9])?)/i,
        /customer.*rating[:\s]+([0-9]+(?:\.[0-9])?)/i,
        /ratings?[:\s]+([0-9]+(?:\.[0-9])?)/i,
      ],
    },
};
  
// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
  
function parseNumber(str: string): number {
    if (!str) return 0;
    return parseFloat(str.replace(/,/g, '')) || 0;
}
  
function extractWithPatterns(text: string, patterns: RegExp[]): number | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseNumber(match[1]);
      }
    }
    return null;
}
  
export function detectPlatform(subject: string, sender: string, snippet: string): "zomato" | "swiggy" | null {
    const sub = (subject || '').toLowerCase();
    const send = (sender || '').toLowerCase();
    const snip = (snippet || '').toLowerCase();
  
    // Check Zomato
    const isZomato =
      ZOMATO_PATTERNS.subjectPatterns.some(p => p.test(sub)) ||
      ZOMATO_PATTERNS.senderPatterns.some(p => p.test(send)) ||
      sub.includes('zomato') ||
      send.includes('zomato') ||
      snip.includes('zomato');
  
    if (isZomato) return 'zomato';
  
    // Check Swiggy
    const isSwiggy =
      SWIGGY_PATTERNS.subjectPatterns.some(p => p.test(sub)) ||
      SWIGGY_PATTERNS.senderPatterns.some(p => p.test(send)) ||
      sub.includes('swiggy') ||
      send.includes('swiggy') ||
      snip.includes('swiggy');
  
    if (isSwiggy) return 'swiggy';
  
    return null;
}
  
function extractDateFromEmail(headersDate: string | undefined): Date {
    if (headersDate) {
      const d = new Date(headersDate);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}
  
// ─── MAIN PARSER ──────────────────────────────────────────────────────────────
  
export function parseEmail(email: {
    id: string;
    subject: string;
    sender: string;
    date: string;
    snippet: string;
    body?: string;
}) {
    const platform = detectPlatform(email.subject, email.sender, email.snippet);
    if (!platform) return null;
  
    const patterns = platform === 'zomato' ? ZOMATO_PATTERNS : SWIGGY_PATTERNS;
  
    // Combine subject + snippet + body for parsing
    // Prefer snippet (faster) — fall back to body
    const textToSearch = [
      email.subject || '',
      email.snippet || '',
      email.body || '',
    ].join(' ');
  
    const revenue = extractWithPatterns(textToSearch, patterns.dataPatterns.revenue);
    const orders = extractWithPatterns(textToSearch, patterns.dataPatterns.orders);
    const cancelled = extractWithPatterns(textToSearch, patterns.dataPatterns.cancelled);
    const rating = extractWithPatterns(textToSearch, patterns.dataPatterns.rating);
  
    // If we couldn't extract revenue AND orders, skip this email
    if (revenue === null && orders === null) {
      return null;
    }
  
    const date = extractDateFromEmail(email.date);
    const totalRevenue = revenue || 0;
    const totalOrders = orders || 0;
  
    return {
      platform,
      date,
      totalRevenue,
      totalOrders,
      cancelledOrders: cancelled || 0,
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      rating: rating || null,
      sourceEmailId: email.id,
      rawSnippet: email.snippet?.substring(0, 300) || '',
    };
}
