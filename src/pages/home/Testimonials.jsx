import dp1 from "../../pictures/dp10.jpg";
import dp2 from "../../pictures/dp1.jpeg";
import dp3 from "../../pictures/dp7.avif";
import dp4 from "../../pictures/dp4.jpg";
import dp5 from "../../pictures/dp8.jpg";
import dp6 from "../../pictures/dp6.jpg";
import { useState } from "react";

const reviews = [
  {
    image: dp1,
    title: "Amy Whyatt",
    description:
      "I've been investing with CoinQuestX for over a year now, and I'm extremely satisfied with their services. The team is knowledgeable, responsive, and always keeps me updated on the latest cryptocurrency trends. Thanks to their expertise, my investments have grown significantly!",
    lineColor: "#FF9E64",
  },
  {
    image: dp2,
    title: "Michel Murphy",
    description:
      "CoinQuestX is the best cryptocurrency investment company I've come across. Their team of professionals guided me through the investment process, answered all my questions, and helped me make informed decisions. I've seen remarkable returns on my investments, and I highly recommend them to anyone looking to enter the world of cryptocurrencies.",
    lineColor: "#2DD4BF",
  },
  {
    image: dp3,
    title: "Abraham Wilson",
    description:
      "I can't thank CoinQuestX enough for their exceptional services. Their platform is user-friendly, their investment strategies are well-researched, and their customer support is top-notch. They genuinely care about their clients' success and go the extra mile to ensure we achieve our financial goals. I'm thrilled to be a part of the CoinQuestX community!",
    lineColor: "#60A5FA",
  },
  {
    image: dp4,
    title: "Daniel Morris",
    description:
      "CoinQuestX has revolutionized my approach to investing. With their expert advice and seamless platform, I've diversified my portfolio and gained exposure to a variety of cryptocurrencies. The team's transparency and dedication to delivering consistent results have earned my trust, and I'm excited to continue growing my investments with them.",
    lineColor: "#C084FC",
  },
  {
    image: dp5,
    title: "Sophia Luther",
    description:
      "Choosing CoinQuestX was the best decision I made for my cryptocurrency investments. Their team possesses in-depth knowledge of the market, and they tailor their strategies to individual investors' goals. I've experienced significant growth in my portfolio, and I'm grateful for their guidance and support. I wholeheartedly recommend CoinQuestX to anyone seeking reliable and profitable cryptocurrency investments.",
    lineColor: "#60A5FA",
  },
  {
    image: dp6,
    title: "Jeff Botch",
    description:
      "CoinQuestX has provided me with an excellent investment experience. Their platform is intuitive, their investment options are diverse, and their team is professional and friendly. I've witnessed remarkable returns on my investments, and I appreciate the peace of mind that comes with knowing my assets are in capable hands. I couldn't be happier with their services!",
    lineColor: "#F87171",
  },
];

export default function TestimonyPage() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 py-16 px-4 md:px-8 lg:px-16 xl:px-24 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-teal-900/20 blur-3xl"></div>
      <div className="absolute bottom-10 left-0 w-80 h-80 rounded-full bg-purple-900/20 blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Heading Section */}
        <div className="text-center mb-16">
          <div className="inline-block relative mb-5">
            <span className="text-teal-400 text-sm font-semibold tracking-wider uppercase bg-teal-400/10 px-4 py-1.5 rounded-full">
              CoinQuestX TESTIMONIALS
            </span>
            <div className="absolute inset-0 bg-teal-400 rounded-full blur-lg opacity-20 -z-10 animate-pulse"></div>
          </div>

          <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-6 max-w-3xl mx-auto">
            Real Success Stories from Our Clients
          </h2>

          <div className="relative inline-block">
            <h4 className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto relative z-10">
              Investing in cryptocurrency is a smart choice for those who want
              to capitalize on the growth of this rapidly-evolving field.
            </h4>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-teal-500/20 -z-0"></div>
          </div>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div
              key={index}
              className={`bg-gradient-to-b from-gray-900/50 to-gray-800/20 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl relative overflow-hidden group ${
                hoveredIndex === index ? "ring-2 ring-opacity-50" : ""
              }`}
              style={{
                boxShadow: "0 10px 30px -15px rgba(0,0,0,0.3)",
                borderTop: `3px solid ${review.lineColor}`,
                ringColor:
                  hoveredIndex === index ? review.lineColor : "transparent",
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Animated sideline */}
              <div
                className="absolute left-0 top-0 h-full w-1.5 rounded-r-lg transition-all duration-500"
                style={{
                  background: `linear-gradient(to bottom, ${review.lineColor}, transparent)`,
                  boxShadow:
                    hoveredIndex === index
                      ? `0 0 15px ${review.lineColor}`
                      : "none",
                  opacity: hoveredIndex === index ? 1 : 0.7,
                }}
              ></div>

              <div className="flex flex-col">
                <div className="flex items-center mb-6">
                  <div className="relative">
                    <div
                      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-300"
                      style={{ backgroundColor: review.lineColor }}
                    ></div>
                    <img
                      src={review.image}
                      alt={review.title}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-800 relative z-10"
                    />
                  </div>
                  <div className="ml-4">
                    {/* Glowing name on hover */}
                    <h3
                      className={`text-white font-semibold text-lg transition-all duration-300 ${
                        hoveredIndex === index ? "tracking-wide" : ""
                      }`}
                      style={{
                        textShadow:
                          hoveredIndex === index
                            ? `0 0 10px ${review.lineColor}, 0 0 20px ${review.lineColor}`
                            : "none",
                      }}
                    >
                      {review.title}
                    </h3>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-4 h-4 text-amber-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative pl-2">
                  <p className="text-gray-400 text-base leading-relaxed">
                    {review.description}
                  </p>
                </div>
              </div>

              {/* Quote icon */}
              <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-30 transition-opacity">
                <svg
                  className="w-12 h-12"
                  fill={review.lineColor}
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
