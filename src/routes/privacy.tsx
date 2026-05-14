import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
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

        <h1 className="mb-4 font-serif text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mb-12 text-sm text-gray-500">Last updated: May 2026</p>

        <div className="space-y-8 text-gray-600">
          <section>
            <h2 className="mb-4 text-2xl font-medium text-gray-900">1. Our Philosophy</h2>
            <p className="leading-relaxed">
              At Zen Writing, we believe a private writing space is sacred. Therefore, our core
              principle is simple:{" "}
              <strong>We do not want, nor do we need, your personal data.</strong>
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-gray-900">2. Your Text Data</h2>
            <p className="leading-relaxed">
              Everything you type in Zen Writing is processed entirely within your browser
              (Client-side). We do not transmit, back up, or store any of your writing on any
              server.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-gray-900">
              3. Third-Party Services (Unsplash)
            </h2>
            <p className="leading-relaxed">
              To provide a contextual visual experience, our system extracts standalone{" "}
              <strong>keywords</strong> from your text and sends only those keywords to the Unsplash
              API. Your complete sentences or personal context are never transmitted.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-medium text-gray-900">4. Local Storage</h2>
            <p className="leading-relaxed">
              We strictly use your browser's Local Storage to save basic UI preferences, ensuring a
              seamless experience for your next visit. No behavioral tracking codes or cookies are
              used.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
