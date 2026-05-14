import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
});

function FAQPage() {
  const faqs = [
    {
      question: "What is Zen Writing?",
      answer:
        "Zen Writing is a tranquil writing space designed to eliminate distractions. As you type, the system automatically captures emotional keywords and displays corresponding art photography, creating a seamless flow between words and images.",
    },
    {
      question: "Is my writing saved on a server?",
      answer:
        "Absolutely not. True to the spirit of 'Zen', what you write exists only in the present moment and is temporarily saved in your browser (Local Storage). We do not store any of your text on our servers.",
    },
    {
      question: "Where do the images come from?",
      answer:
        "The images are sourced directly from the Unsplash API, one of the world's largest libraries of high-quality, freely usable photography.",
    },
    {
      question: "Can I use Zen Writing on my phone?",
      answer:
        "Yes. The Zen Writing interface is fully responsive, designed to work seamlessly on phones, tablets, and desktop computers.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#FDFCF8] px-6 py-12 text-gray-800 md:px-12 lg:px-24"
    >
      <div className="mx-auto max-w-3xl">
        {/* Nút Back */}
        <Link
          to="/"
          className="group mb-10 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to home
        </Link>

        <h1 className="mb-12 font-serif text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
          Frequently Asked Questions
        </h1>

        <div className="space-y-10">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-8">
              <h3 className="mb-4 text-xl font-medium text-gray-900">{faq.question}</h3>
              <p className="leading-relaxed text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
