import ContactUs from "../../components/contact/ContactIndex.jsx";
import HomeHeaderPage from "../../components/home/layout/HomeHeader.jsx";
import FooterPage from "../../components/home/layout/Footer.jsx";
import StatsPage from "./Stats.jsx";
import WhatIsCoinQuestXPage from "./WhatIsCoinQuestX.jsx";
import FeaturesSection from "./FeaturesSection.jsx";
import TokenSection from "./TokenSection.jsx";
import ProfitCalculator from "./ProfitCalculator.jsx";
import TestimonyPage from "./Testimonials.jsx";
import QuestionAndAnswer from "./QuestionAndAnswer.jsx";
import PricingPlan from "./PricingPlan.jsx";
import HeroPage from "./Hero.jsx";
import RandomAlert from "../../constants/RandomAlert.jsx";
import ChatBot from "../../components/chatbot/ChatBot.jsx";

export default function HomePage() {
  return (
    <section className="min-h-screen overflow-x-hidden bg-slate-950">
      <HomeHeaderPage />
      <HeroPage />
      <StatsPage />
      <WhatIsCoinQuestXPage />
      <FeaturesSection />
      <TokenSection />
      <ProfitCalculator />
      <TestimonyPage />
      <QuestionAndAnswer />
      <PricingPlan />
      <ContactUs />
      <FooterPage />
      <RandomAlert />
      <ChatBot forceDark />
    </section>
  );
}
