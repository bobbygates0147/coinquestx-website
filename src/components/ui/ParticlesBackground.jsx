import Particles, { initParticlesEngine } from "@tsparticles/react";
import { useEffect, useMemo, useState } from "react";
import { loadSlim } from "@tsparticles/slim";
import PropTypes from "prop-types";

const ParticlesComponent = (props) => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const particlesLoaded = async (container) => {
    if (container) console.log("Particles loaded:", container);
  };

  const options = useMemo(
    () => ({
      fullScreen: { enable: false, zIndex: -1 },
      background: {
        color: { value: props.bgColor || "transparent" },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: { enable: true, mode: "repulse" },
          onHover: { enable: false },
        },
        modes: { repulse: { distance: 100, duration: 0.4 } },
      },
      particles: {
        color: { value: "#FFFFFF" },
        move: {
          direction: "top",
          enable: true,
          outModes: { default: "out" },
          random: false,
          speed: 0.5,
          straight: true,
        },
        life: {
          duration: 0,
          count: 0,
        },
        number: {
          value: props.particleDensity || 150,
          density: { enable: true, area: 800 },
        },
        opacity: { value: 0.5 },
        shape: { type: "circle" },
        size: { value: { min: 0.5, max: 1.5 }, random: true },
      },
      detectRetina: true,
      responsive: [
        {
          maxWidth: 768,
          options: {
            particles: {
              number: {
                value: props.particleDensity ? props.particleDensity * 0.7 : 100,
                density: {
                  enable: true,
                  area: 400,
                }
              },
              move: {
                speed: 0.3,
              }
            }
          }
        },
        {
          maxWidth: 480,
          options: {
            particles: {
              number: {
                value: props.particleDensity ? props.particleDensity * 0.5 : 75,
                density: {
                  enable: true,
                  area: 200,
                }
              },
              move: {
                speed: 0.2,
              },
              size: {
                value: { min: 0.3, max: 1.2 },
              }
            }
          }
        }
      ]
    }),
    [props.bgColor, props.particleDensity]
  );

  if (!init) return null;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <Particles
        id={props.id || "tsparticles"}
        particlesLoaded={particlesLoaded}
        options={options}
      />
    </div>
  );
};

ParticlesComponent.propTypes = {
  bgColor: PropTypes.string,
  particleDensity: PropTypes.number,
  id: PropTypes.string,
};

export default ParticlesComponent;
