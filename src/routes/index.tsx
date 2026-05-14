import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16 lg:px-8 lg:py-20">
        {/* Signum Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          tabIndex={1}
          title="Writing with Open Access"
          className="signum-button mb-8 flex items-center gap-3 rounded text-left focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 focus:ring-offset-stone-50 focus:outline-none md:mb-12"
        >
          <img
            src="/assets/zen_logo.png"
            alt="Zen Writing Logo"
            className="h-6 w-6 object-contain md:h-7 md:w-7"
          />
          <span
            className="font-sans text-sm text-black transition-colors"
            style={{ fontSize: "1rem", textTransform: "uppercase" }}
          >
            Write with Open Access
          </span>
        </motion.button>

        {/* Main Content */}
        <div className="content mb-12 md:mb-16">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            tabIndex={1}
            className="title mb-8 font-serif text-4xl leading-tight text-stone-900 md:mb-12 md:text-5xl lg:text-6xl"
            style={{
              fontSize: "4rem",
              fontWeight: "600",
              fontStyle: "normal",
              color: "#212738",
            }}
          >
            <span className="block">Gain a new perspective</span>
            <span className="block">on your writing with the</span>
            <span className="block">help of Unsplash's</span>
            <span className="block">Open Access.</span>
          </motion.h1>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8 md:mb-12"
          >
            <Link
              tabIndex={1}
              id="start-cta"
              to="/write"
              className="action-start action-button mb-6 inline-block rounded-sm bg-stone-900 px-8 py-4 font-sans text-lg text-stone-50 transition-all duration-200 hover:bg-stone-800 focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 focus:ring-offset-stone-50 focus:outline-none active:bg-stone-700 md:text-xl"
              style={{
                textTransform: "uppercase",
                fontSize: "1rem",
                borderRadius: "2rem",
              }}
            >
              Start Writing
            </Link>

            <p className="for-screens" style={{ marginLeft: "0.5rem" }}>
              <a
                tabIndex={1}
                href="https://www.youtube.com/watch?v=lkbrWTHyr3I"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 font-sans text-sm text-stone-700 transition-colors hover:text-red-600 md:text-base"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 100 100"
                  className="h-4 w-4 fill-current md:h-5 md:w-5"
                >
                  <path d="M45,66.25,64.458,51.667a2.069,2.069,0,0,0,0-3.334L45,33.75a2.082,2.082,0,0,0-3.333,1.667V64.583A2.082,2.082,0,0,0,45,66.25ZM50,8.333A41.667,41.667,0,1,0,91.667,50,41.682,41.682,0,0,0,50,8.333Zm0,75A33.333,33.333,0,1,1,83.333,50,33.377,33.377,0,0,1,50,83.333Z" />
                </svg>
                Watch the video
              </a>
            </p>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            tabIndex={1}
            className="description space-y-4 font-sans leading-relaxed text-stone-700 md:space-y-6"
          >
            <p
              className="font-sans text-base md:text-lg"
              style={{ fontSize: "1.2rem", color: "#999999" }}
            >
              Unsplash provides millions of high-quality, open-access images from photographers
              around the world. Using today's technology, we can bring these images to you in
              surprising ways.
            </p>
            <p
              className="for-screens font-sans text-base md:text-lg"
              style={{ fontSize: "1.2rem", color: "#999999" }}
            >
              After you write something, the application responds with images from Unsplash that
              reflect your thoughts.
            </p>
            <p
              className="for-screens font-sans text-base md:text-lg"
              style={{ fontSize: "1.2rem" }}
            >
              <label
                htmlFor="start-cta"
                className="cta cursor-pointer font-sans text-[#999999] transition-colors hover:text-black"
                style={{ fontSize: "1.2rem" }}
              >
                Sound good? Then let's go.
              </label>
            </p>
            <p
              className="for-pdfs font-sans text-base md:text-lg"
              style={{ fontSize: "1.2rem", color: "#999999" }}
            >
              This document is a keepsake for exploring your writing in a novel way, with the
              support of Unsplash's Open Access collection. The next page is your writing and after
              that are the images that matched with your writing.
            </p>
            <p
              className="for-screens support-text mt-8 font-sans text-sm text-stone-600"
              style={{ fontSize: "1rem" }}
            >
              This project supports writing in Chinese, English, French, German, Italian, Japanese,
              Korean, Portuguese, Russian, and Spanish.
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="footer mt-12 border-t border-gray-300 pt-8 md:mt-16 md:pt-12"
        >
          <ul
            aria-label="links"
            className="mb-8 flex flex-wrap gap-4 font-sans text-sm md:gap-6 md:text-base"
          >
            <li>
              <Link
                to="/faq"
                className="font-sans text-stone-700 transition-colors hover:text-stone-900"
              >
                FAQ
              </Link>
            </li>
            <li>
              <a
                tabIndex={1}
                href="mailto:trungyna1708@gmail.com?subject=%5BZenWriting%5D&body=Got%20a%20question%20or%20comment%20about%20ZenWriting%3F%20Don't%20be%20shy%2C%20send%20an%20email!"
                className="font-sans text-stone-700 transition-colors hover:text-stone-900"
              >
                Contact
              </a>
            </li>
            <li>
              <Link
                to="/privacy"
                className="font-sans text-stone-700 transition-colors hover:text-stone-900"
              >
                Privacy
              </Link>
            </li>
          </ul>

          <div
            tabIndex={1}
            aria-label="Author notes"
            className="font-sans text-xs leading-relaxed text-stone-600 md:text-sm"
          >
            <p className="authors mb-2">
              A project by <strong>Zen Writing</strong> • Powered by{" "}
              <a
                tabIndex={1}
                href="https://unsplash.com/?utm_source=zen-writing&utm_medium=referral"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-stone-900"
              >
                Unsplash
              </a>{" "}
              Open Access • Built with React and TanStack Start
            </p>
            <p>© {new Date().getFullYear()}</p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
