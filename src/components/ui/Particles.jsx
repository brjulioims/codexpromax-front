import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

const particlesOptions = {
  background: {
    color: {
      value: "transparent",
    },
  },
  fpsLimit: 90,
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "grab",
      },
      resize: {
        enable: true,
      },
    },
    modes: {
      grab: {
        distance: 145,
        links: {
          opacity: 0.22,
        },
      },
    },
  },
  particles: {
    color: {
      value: ["#ffffff", "#d15f03", "#93a4d1", "#f8c49b"],
    },
    links: {
      color: "#ffffff",
      distance: 135,
      enable: true,
      opacity: 0.12,
      width: 1,
    },
    move: {
      direction: "none",
      enable: true,
      outModes: {
        default: "out",
      },
      random: false,
      speed: 0.9,
      straight: false,
    },
    number: {
      density: {
        enable: true,
        area: 980,
      },
      value: 54,
    },
    opacity: {
      value: { min: 0.16, max: 0.42 },
    },
    shape: {
      type: "circle",
    },
    size: {
      value: { min: 1, max: 2.8 },
    },
  },
  detectRetina: true,
};

export default function LoginParticles({ className = "absolute inset-0" }) {
  const [particlesReady, setParticlesReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setParticlesReady(true);
    });
  }, []);

  if (!particlesReady) {
    return null;
  }

  return (
    <Particles
      id="asigno-login-particles"
      className={className}
      options={particlesOptions}
    />
  );
}
