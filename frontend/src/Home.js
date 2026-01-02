import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleStartWriting = () => {
    navigate("/write");
  };

  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-4xl px-4 py-12 mx-auto md:px-6 lg:px-8 md:py-16 lg:py-20">
        {/* Signum Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          tabIndex={1}
          title="Writing with Open Access"
          className="flex items-center gap-3 mb-8 text-left rounded signum-button md:mb-12 focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-2 focus:ring-offset-ivory"
          onClick={handleStartWriting}
        >
          <img
            src="/assets/zen_logo.png"
            alt="Zen Writing Logo"
            className="object-contain w-6 h-6 md:h-7 md:w-7"
          />
          <span
            className="text-sm text-black transition-colors font-modern"
            style={{ fontSize: "1rem", textTransform: "uppercase" }}
          >
            Write with Open Access
          </span>
        </motion.button>

        {/* Main Content */}
        <div className="mb-12 content md:mb-16">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            tabIndex={1}
            className="mb-8 text-4xl leading-tight title md:mb-12 font-modern md:text-5xl lg:text-6xl text-charcoal"
            style={{
              fontSize: "4.5rem",
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
            <button
              tabIndex={1}
              id="start-cta"
              onClick={handleStartWriting}
              className="px-8 py-4 mb-6 text-lg transition-all duration-200 rounded-sm action-start action-button bg-charcoal text-ivory font-modern md:text-xl hover:bg-charcoal/90 active:bg-charcoal/80 focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-2 focus:ring-offset-ivory"
              style={{
                textTransform: "uppercase",
                fontSize: "1rem",
                borderRadius: "2rem",
              }}
            >
              Start Writing
            </button>

            <p className="for-screens" style={{ marginLeft: "0.5rem" }}>
              <a
                tabIndex={1}
                href="https://www.youtube.com/watch?v=lkbrWTHyr3I"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm transition-colors text-charcoal/70 hover:text-red-600 md:text-base group font-modern"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 100 100"
                  className="w-4 h-4 fill-current md:w-5 md:h-5"
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
            className="space-y-4 leading-relaxed description md:space-y-6 text-charcoal/80 font-modern"
          >
            <p
              className="text-base md:text-lg font-modern"
              style={{ fontSize: "1.2rem", color: "#999999" }}
            >
              Unsplash provides millions of high-quality, open-access images
              from photographers around the world. Using today's technology, we
              can bring these images to you in surprising ways.
            </p>
            <p
              className="text-base for-screens md:text-lg font-modern"
              style={{ fontSize: "1.2rem", color: "#999999" }}
            >
              After you write something, the application responds with images
              from Unsplash that reflect your thoughts.
            </p>
            <p
              className="text-base for-screens md:text-lg font-modern"
              style={{ fontSize: "1.2rem" }}
            >
              <label
                htmlFor="start-cta"
                className="cta cursor-pointer transition-colors text-[#999999] hover:text-black font-modern"
                style={{ fontSize: "1.2rem" }}
              >
                Sound good? Then let's go.
              </label>
            </p>
            <p
              className="text-base for-pdfs md:text-lg font-modern"
              style={{ fontSize: "1.2rem", color: "#999999" }}
            >
              This document is a keepsake for exploring your writing in a novel
              way, with the support of Unsplash's Open Access collection. The
              next page is your writing and after that are the images that
              matched with your writing.
            </p>
            <p
              className="mt-8 text-sm for-screens support-text text-charcoal/60 font-modern"
              style={{ fontSize: "1rem" }}
            >
              This project supports writing in Chinese, English, French, German,
              Italian, Japanese, Korean, Portuguese, Russian, and Spanish.
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="pt-8 mt-12 border-t border-gray-300 footer md:pt-12 md:mt-16"
        >
          <ul
            aria-label="links"
            className="flex flex-wrap gap-4 mb-8 text-sm md:gap-6 md:text-base font-modern"
          >
            <li>
              <a
                tabIndex={1}
                href="/faq"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors text-charcoal/70 hover:text-charcoal font-modern"
              >
                FAQ
              </a>
            </li>
            <li>
              <a
                tabIndex={1}
                href="mailto:inquiries@aurascribe.com?subject=%5BAuraScribe%5D&body=Got%20a%20question%20or%20comment%20about%20AuraScribe%3F%20Don't%20be%20shy%2C%20send%20an%20email!"
                className="transition-colors text-charcoal/70 hover:text-charcoal font-modern"
              >
                Contact
              </a>
            </li>
            <li>
              <a
                tabIndex={1}
                href="/privacy"
                target="_blank"
                className="transition-colors text-charcoal/70 hover:text-charcoal font-modern"
              >
                Privacy
              </a>
            </li>
          </ul>

          <div
            tabIndex={1}
            aria-label="Author notes"
            className="text-xs leading-relaxed md:text-sm text-charcoal/60 font-modern"
          >
            <p className="mb-2 authors">
              A project by <strong>Zen Writing</strong> • Powered by{" "}
              <a
                tabIndex={1}
                href="https://unsplash.com/?utm_source=zen-writing&utm_medium=referral"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-charcoal"
              >
                Unsplash
              </a>{" "}
              Open Access • Built with React and Express
            </p>
            <p>© {new Date().getFullYear()}</p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default Home;
