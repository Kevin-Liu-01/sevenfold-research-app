import React from "react";
// import { Link } from "react-router-dom";
import { Footer } from "../components/default/footer";
import { Navbar } from "../components/default/navbar";
import { Hero } from "../components/default/hero";
import { Carousel } from "../components/default/carousel";
// import { Features } from "../components/default/features";

const LandingPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Carousel />
      <Footer />
    </>
  );
};

export default LandingPage;
