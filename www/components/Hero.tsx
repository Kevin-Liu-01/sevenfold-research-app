import Container from "./Container";
import { ButtonLink } from "./Buttons";
import EmbossedHeading from "./EmbossedHeading";

const HEADLINE = "Your Integrated Agentic Research Environment.";
const SUBHEAD =
  "Sevenfold helps you find, digest, and produce research in one centralized workplace, using project-aware intelligence to eliminate paper-chasing.";

const headlineWords = HEADLINE.split(" ");
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
const OPEN_APP_URL = APP_URL ?? "/app";
const CONTACT_EMAIL = "mailto:athan@sevenfold.so";

export default function Hero() {
  return (
    <section className="pt-10 pb-16 sm:pt-12 sm:pb-20">
      <Container>
        <div className="max-w-4xl space-y-6">
          <EmbossedHeading
            as="h1"
            className="text-5xl font-semibold tracking-tight text-zinc-700 sm:text-6xl"
          >
            {headlineWords.map((word, index) => {
              const hasComma = word.endsWith(",");
              const cleanWord = hasComma ? word.slice(0, -1) : word;
              const delay = index * 0.12;
              const needsSpace = !hasComma && index < headlineWords.length - 1;
              return (
                <span key={`${word}-${index}`} className="inline-block">
                  <span
                    className="hero-word inline-block opacity-0"
                    style={{ animationDelay: `${delay}s` }}
                  >
                    {cleanWord}
                    {hasComma && <span>,</span>}
                  </span>
                  {needsSpace && <span className="inline-block">&nbsp;</span>}
                  {hasComma && <br className="hidden sm:block" />}
                </span>
              );
            })}
          </EmbossedHeading>
          <p
            className="hero-fade text-lg text-muted-foreground opacity-0 sm:text-xl"
            style={{ animationDelay: `${headlineWords.length * 0.08 + 0.4}s` }}
          >
            {SUBHEAD}
          </p>
          <div
            className="hero-fade flex flex-wrap gap-3 pt-2 opacity-0"
            style={{ animationDelay: `${headlineWords.length * 0.08 + 0.8}s` }}
          >
            <ButtonLink href={OPEN_APP_URL} variant="solid" size="lg">
              Open App
            </ButtonLink>
            <ButtonLink href={CONTACT_EMAIL} variant="accent" size="lg">
              Get A Demo
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
