import { BrowserRouter } from "react-router-dom";

import {
  About,
  Contact,
  Blog,
  Hero,
  Navbar,
  Works,
  Footer,
} from "./components";
import Certifications from "./components/Certifications";
import { SnowOverlay } from "react-snow-overlay";

const App = () => {
  return (
    <BrowserRouter>
      <SnowOverlay maxParticles={25} disabledOnSingleCpuDevices={true}>
        {" "}
      </SnowOverlay>
      <div className="relative z-0 bg-primary">
        <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
          <Navbar />
          <Hero />
        </div>
        <Works />
        <Certifications />
        <About />
        <Blog />
        <Contact />
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
