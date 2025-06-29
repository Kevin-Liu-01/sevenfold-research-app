import React from "react";
import { Footer } from "../components/default/Footer";
import { Navbar } from "../components/default/Navbar";
import { Hero } from "../components/default/Hero";
import { Carousel } from "../components/default/Carousel";
// import { Features } from "../components/default/features";

const LandingPage: React.FC = () => {
  return (
    <>
      <Sidebar />
      <Navbar />
      <Hero />
      <Carousel />
      <Footer />
    </>
  );
};

export default LandingPage;
