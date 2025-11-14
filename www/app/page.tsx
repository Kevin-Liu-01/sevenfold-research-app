import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Faqs from "@/components/Faqs";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Tools from "@/components/Tools";
import AsciiDemo from "@/components/AsciiDemo";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <div className="space-y-16 pb-20">
          <Hero />
          <AsciiDemo />
          <Features />
          <Tools />
          <Faqs />
        </div>
      </main>
      <Footer />
    </div>
  );
}
