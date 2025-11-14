import features from "@/data/features.json";
import Container from "./Container";
import EmbossedHeading from "./EmbossedHeading";

export default function Features() {
  return (
    <section className="py-16">
      <Container>
        <div className="mb-10">
          <p className="mb-3 text-base font-bold uppercase tracking-wider text-accent">
            Features
          </p>
          <EmbossedHeading
            as="h2"
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Every Step of the Research Workflow
          </EmbossedHeading>
        </div>
        <div className="grid gap-4 md:grid-cols-3 md:auto-rows-[220px] lg:auto-rows-[260px]">
          {features.map((feature: { title: string; body: string; span?: string }) => (
            <div
              key={feature.title}
              className={`rounded-2xl border bg-white p-6 shadow-[0_4px_12px_rgba(227,100,20,0.15)] hover:shadow-[0_6px_16px_rgba(227,100,20,0.2)] ${feature.span ?? ""}`}
            >
              <h3 className="mb-4 text-2xl font-semibold">{feature.title}</h3>
              <p className="text-base text-zinc-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
