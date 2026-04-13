import { useState, useEffect, useRef } from "react";

const SkillsSection = () => {
  const skills = [
    { name: "Digital Art", percentage: 90 },
    { name: "Support", percentage: 80 },
    { name: "Marketing", percentage: 85 },
    { name: "Blockchain", percentage: 70 },
  ];

  const sectionRef = useRef(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated) {
          setAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [animated]);

  return (
    <div ref={sectionRef} className="bg-slate-950 py-16 px-4 sm:px-8 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">
          Skills and Abilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Description Column */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-teal-400">
              CoinQuestX Expertise
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              At CoinQuestX, we pride ourselves on our team of skilled and
              experienced professionals who are dedicated to providing our users
              with the best possible investment experience. Our team includes
              experts in cryptocurrency, blockchain technology, mining
              operations, and security, all of whom are committed to staying
              up-to-date on the latest industry developments and trends.
            </p>
          </div>

          {/* Skills Column */}
          <div className="space-y-8">
            {skills.map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300 font-medium">
                    {skill.name}
                  </span>
                  <span className="text-teal-400 font-semibold">
                    {skill.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: animated ? `${skill.percentage}%` : "0%",
                      transitionDelay: animated
                        ? `${Math.random() * 300}ms`
                        : "0ms",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsSection;
