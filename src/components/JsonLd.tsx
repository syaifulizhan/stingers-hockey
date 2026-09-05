// Satu blok structured data. JSON-LD ialah DATA, bukan skrip boleh-laku —
// inilah corak rasmi App Router untuk menyuntiknya.
export default function JsonLd({ json }: { json: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
