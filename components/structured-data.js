export default function StructuredData({ value }) {
  // Escape script-opening characters even when a title contains HTML-like text.
  const serialized = JSON.stringify(value).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw JSON; '<' is escaped above.
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}
