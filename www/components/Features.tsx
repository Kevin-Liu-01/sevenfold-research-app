import features from "@/data/features.json";
import Container from "./Container";
import EmbossedHeading from "./EmbossedHeading";

type Feature = {
  title: string;
  body: string;
  span?: string;
};

export default function Features() {
  const featureItems = features as Feature[];
  const baseCardClass =
    "group relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-[0_12px_28px_rgba(15,15,15,0.05)] backdrop-blur transition-all duration-300 hover:border-white/90 hover:shadow-[0_20px_55px_rgba(15,15,15,0.12)]";
  return (
    <section className="py-16">
      <Container>
        <div className="flex flex-col gap-3">
          <p className="inline-flex w-fit items-center rounded-full border border-accent bg-accent px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-background">
            Features
          </p>
          <EmbossedHeading
            as="h2"
            className="text-3xl font-semibold tracking-tight text-zinc-700 sm:text-4xl"
          >
            Every Step of the Research Workflow
          </EmbossedHeading>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3 md:auto-rows-[220px] lg:auto-rows-[260px]">
          {featureItems.map((feature) => (
            <div
              key={feature.title}
              className={`${baseCardClass} ${feature.span ?? ""}`}
            >
              <div className="relative flex h-full flex-col justify-between">
                <h3 className="text-2xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-4 text-sm text-zinc-600">{feature.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
