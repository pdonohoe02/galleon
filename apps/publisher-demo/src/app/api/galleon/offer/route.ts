import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "unavailable",
    source: {
      resource_id: "00000000-0000-4000-8000-000000000003",
      canonical_url: "http://127.0.0.1:3001/",
      title: "What changes when a source can quote its own price?",
      description:
        "A field study of independent publishers testing machine-readable, one-off source access.",
      publisher_name: "Northline Review",
      authors: ["Mara Venn"],
      published_at: "2026-08-28T09:00:00Z",
      content_type: "report",
      language: "en",
      topics: ["agent commerce", "digital publishing", "micropayments"],
      questions_answered: [
        "How did independent publishers respond to one-off agent purchases?",
        "Which offer attributes affected source purchase conversion?",
      ],
      citation: {
        display_text:
          "Venn, M. (2026). What changes when a source can quote its own price? Northline Review.",
        canonical_url: "http://127.0.0.1:3001/",
      },
    },
    message: "Signed offers arrive in the contracts and ledger phase.",
  });
}
