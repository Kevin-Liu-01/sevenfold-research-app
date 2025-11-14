import Image from "next/image";
import Link from "next/link";
import Container from "./Container";
import { ButtonLink } from "./Buttons";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
const OPEN_APP_URL = APP_URL ?? "/app";
const SIGN_UP_URL = APP_URL ? `${APP_URL}/signup` : "/signup";

export default function Navbar() {
  return (
    <header className="bg-transparent py-4">
      <Container className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <Image src="/logo-long.svg" alt="Sevenfold" width={140} height={32} />
        </Link>
        <nav className="flex items-center gap-2">
          <ButtonLink
            href={SIGN_UP_URL}
            variant="ghost"
            size="sm"
            className="rounded-full"
          >
            Sign Up
          </ButtonLink>
          <ButtonLink
            href={OPEN_APP_URL}
            variant="solid"
            size="sm"
            className="rounded-full"
          >
            Open App
          </ButtonLink>
        </nav>
      </Container>
    </header>
  );
}
