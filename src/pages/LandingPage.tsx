import React from "react";
import { Footer } from "../components/default/footer";
import { Navbar } from "../components/default/navbar";
import { Hero } from "../components/default/hero";
import { Carousel } from "../components/default/carousel";
import { Features } from "../components/default/features";

const LandingPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Carousel />
      <Features />
      <Footer />
    </>
  );
};

export default LandingPage;
