// ============================================================
// Cold Outreach Email Templates
// Template variables: {{businessName}}, {{category}}, {{city}},
//                     {{websiteIssue}}, {{yourName}}, {{yourWebsite}}
// ============================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "friendly-intro",
    name: "Friendly Introduction",
    subject: "Quick question about {{businessName}}'s online presence",
    body: `Hi there,

I'm {{yourName}}, a local web developer based near {{city}}. I was looking for {{category}} businesses in the area and came across {{businessName}}.

{{websiteIssue}}

I'd love to help you get a professional website up and running. A clean, mobile-friendly site can help you:

• Show up in Google searches when people look for {{category}} in {{city}}
• Let customers see your hours, services, and contact info instantly
• Build trust with new customers before they even walk through the door

I keep things simple and affordable — no long contracts or hidden fees.

Would you be open to a quick 10-minute chat this week? I can show you what I have in mind.

Best,
{{yourName}}
{{yourWebsite}}`,
  },
  {
    id: "value-proposition",
    name: "Value Proposition",
    subject: "Helping {{businessName}} get found online",
    body: `Hello,

My name is {{yourName}} and I build websites for local businesses in {{city}}.

I noticed that {{businessName}} {{websiteIssue}} — and that means you might be missing out on customers who search online for {{category}} in your area.

Here's what I typically see:
→ 97% of consumers search online for local businesses
→ 75% judge a company's credibility based on their website
→ Businesses with websites get 2-3x more inquiries than those without

I specialize in building fast, modern websites for {{category}} businesses. My sites are:
✓ Mobile-friendly (most searches happen on phones)
✓ Fast-loading (under 3 seconds)
✓ Designed to convert visitors into customers

I'd be happy to put together a free mockup for {{businessName}} — no obligation, just to show you what's possible.

Interested? Just reply to this email or give me a call.

Thanks,
{{yourName}}
{{yourWebsite}}`,
  },
  {
    id: "social-proof",
    name: "Social Proof",
    subject: "I helped [similar business] — can I help {{businessName}} too?",
    body: `Hi,

I'm {{yourName}}, a web developer who works with {{category}} businesses in the {{city}} area.

I recently helped a similar {{category}} business get their first website, and within the first month they saw:
• 40% increase in phone calls
• New customers mentioning they found them on Google
• A professional online presence that matched the quality of their service

I noticed that {{businessName}} {{websiteIssue}}, and I think I could help you get similar results.

Your Google reviews show that customers love what you do — a great website would help even more people discover {{businessName}}.

I'd love to offer you a free consultation to discuss what would work best for your business. No pressure, no sales pitch — just an honest conversation about your options.

Would sometime this week work for a quick call?

Best regards,
{{yourName}}
{{yourWebsite}}`,
  },
];

/**
 * Generate the website issue text based on the lead's status
 */
export function getWebsiteIssueText(
  hasWebsite: boolean,
  websiteStatus: string | null
): string {
  if (!hasWebsite) {
    return "doesn't appear to have a website yet";
  }

  switch (websiteStatus) {
    case "slow":
      return "has a website that loads slowly and may not be mobile-friendly";
    case "error":
      return "has a website that appears to be down or broken";
    case "missing":
      return "doesn't appear to have a website yet";
    default:
      return "could benefit from a website refresh";
  }
}

/**
 * Fill in template variables with actual lead data
 */
export function renderTemplate(
  template: EmailTemplate,
  data: {
    businessName: string;
    category: string;
    city: string;
    hasWebsite: boolean;
    websiteStatus: string | null;
    yourName: string;
    yourWebsite: string;
  }
): { subject: string; body: string } {
  const websiteIssue = getWebsiteIssueText(data.hasWebsite, data.websiteStatus);

  const replace = (text: string) =>
    text
      .replace(/\{\{businessName\}\}/g, data.businessName)
      .replace(/\{\{category\}\}/g, data.category.replace(/_/g, " "))
      .replace(/\{\{city\}\}/g, data.city)
      .replace(/\{\{websiteIssue\}\}/g, websiteIssue)
      .replace(/\{\{yourName\}\}/g, data.yourName || "[Your Name]")
      .replace(/\{\{yourWebsite\}\}/g, data.yourWebsite || "[Your Website]");

  return {
    subject: replace(template.subject),
    body: replace(template.body),
  };
}
