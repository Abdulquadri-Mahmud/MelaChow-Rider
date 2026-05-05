/**
 * JsonLd — Injects structured data (Schema.org JSON-LD) into the page <head>.
 * 
 * Usage: <JsonLd data={schemaObject} />
 * For multiple schemas, pass an array.
 */
export default function JsonLd({ data }) {
  const schema = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema.length === 1 ? schema[0] : schema) }}
    />
  );
}
