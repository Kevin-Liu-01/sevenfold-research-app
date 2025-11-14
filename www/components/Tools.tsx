import Image from "next/image";
import Container from "./Container";
import EmbossedHeading from "./EmbossedHeading";

const tools = [
  { name: "ChatGPT", src: "/icons/chatgpt_icon.png" },
  { name: "Google Drive", src: "/icons/gdrive_icon.png" },
  { name: "Google Scholar", src: "/icons/gscholar_icon.png" },
  { name: "Mendeley", src: "/icons/mendeley_icon.png" },
  { name: "Overleaf", src: "/icons/overleaf_icon.png" },
  { name: "Zotero", src: "/icons/zotero_icon.png" },
];

export default function Tools() {
  return (
    <section className="py-16">
      <Container className="grid items-center gap-10 md:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
        <div>
          <EmbossedHeading
            as="h2"
            className="text-3xl font-semibold tracking-tight text-zinc-700 sm:text-4xl"
          >
            Replace Existing Tools
          </EmbossedHeading>
          <p className="mt-3 text-sm text-zinc-600">
            Bring your researchers together without juggling inboxes, docs, and plug-ins.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-6">
          {tools.map((tool) => (
            <Image
              key={tool.name}
              src={tool.src}
              alt={tool.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-2xl object-contain shadow-[0_12px_30px_rgba(15,15,15,0.08)]"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
