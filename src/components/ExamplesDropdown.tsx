import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWriterStore } from "@/store/writerStore";

// 1. Tạo kho chứa các prompt ngẫu nhiên (Đặt ngoài Component để tối ưu bộ nhớ)
const RANDOM_PROMPTS = [
  "Give me a quiet, reflective writing prompt about memory and place.",
  "Describe a place from your childhood using only sounds and smells.",
  "Write about a forgotten object left on a dusty window sill.",
  "A quiet morning in a city that hasn't quite woken up yet.",
  "Describe the feeling of watching heavy rain from inside a warm, dimly lit room.",
  "Write a reflection on the fleeting nature of autumn leaves.",
  "A letter to someone you only met once on a long train journey.",
  "Detail the exact moment the sun dips below the horizon on a cold day.",
  "Describe the texture of silence in an empty museum."
];

export const ExamplesDropdown: React.FC = () => {
  const { showExamples, setShowExamples, setText } = useWriterStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExamples(false);
      }
    };

    if (showExamples) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showExamples, setShowExamples]);

  return (
    <div className="relative flex flex-1 justify-center">
      <div className="examples-dropdown-container relative" ref={dropdownRef}>
        <button
          type="button"
          tabIndex={1}
          onClick={() => setShowExamples((prev) => !prev)}
          className="group inline-flex flex-col items-center gap-0.5 text-[10px] tracking-[0.25em] text-gray-600 uppercase sm:gap-1 sm:text-[11px]"
        >
          <span className="text-[0.7rem] font-semibold sm:text-[0.8rem]">Examples</span>
          <span className="relative h-px w-full overflow-hidden bg-gray-200">
            <span className="absolute inset-0 origin-center scale-x-0 bg-gray-600 transition-transform duration-200 group-hover:scale-x-100" />
          </span>
        </button>

        <AnimatePresence>
          {showExamples && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="custom-scrollbar absolute top-full z-50 mt-2 max-h-[60vh] w-[calc(100vw-2rem)] max-w-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl sm:w-96"
              style={{ left: "-205%" }}
            >
              <div className="space-y-2 p-3 text-xs text-gray-700 sm:space-y-3 sm:p-4 sm:text-sm">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    // 2. Thuật toán bốc ngẫu nhiên 1 câu trong kho RANDOM_PROMPTS
                    const randomIndex = Math.floor(Math.random() * RANDOM_PROMPTS.length);
                    setText(RANDOM_PROMPTS[randomIndex]);
                    setShowExamples(false);
                  }}
                  className="text-sm underline decoration-gray-400 underline-offset-4 transition-colors hover:text-red-600 hover:decoration-gray-700 sm:text-lg"
                  style={{
                    textDecoration: "none",
                    textAlign: "center",
                    display: "block",
                    margin: "0 auto",
                    marginTop: "0.75rem",
                  }}
                >
                  Give me a writing prompt
                </button>
                <p
                  className="pt-2 text-gray-500"
                  style={{
                    textAlign: "center",
                    display: "block",
                    margin: "0 auto",
                    fontSize: "1.2rem",
                    marginTop: "1rem",
                  }}
                >
                  Popular texts you can explore:
                </p>
                <ul
                  className="space-y-2"
                  style={{
                    marginTop: "1rem",
                    listStyleType: "circle",
                    marginLeft: "1rem",
                  }}
                >
                  <li>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => {
                        setText(
                          `Dear One Absent This Long While\nBy Lisa Olstein\n\nIt has been so wet stones glaze in moss;\neverything blooms coldly.\n\nI expect you. I thought one night it was you\nat the base of the drive, you at the foot of the stairs,\n\nyou in a shiver of light, but each time\nleaves in wind revealed themselves,\n\nthe retreating shadow of a fox, daybreak.\nWe expect you, cat and I, bluebirds and I, the stove.\n\nIn May we dreamed of wreaths burning on bonfires\nover which young men and women leapt.\n\nJune efforts quietly.\nI’ve planted vegetables along each garden wall\n\nso even if spring continues to disappoint\nwe can say at least the lettuce loved the rain.\n\nI have new gloves and a new hoe.\nI practice eulogies. He was a hawk\n\nwith white feathered legs. She had the quiet ribs\nof a salamander crossing the old pony post road.\n\nYours is the name the leaves chatter\nat the edge of the unrabbited woods.`
                        );
                        setShowExamples(false);
                      }}
                      className="w-full py-1 text-left transition-colors hover:text-red-600"
                    >
                      <em>Dear One Absent This Long While</em> by Lisa Olstein
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => {
                        setText(
                          `Sticks\nby George Saunders\n\nEvery year Thanksgiving night we flocked out behind Dad as he dragged the Santa suit to the road and draped it over a kind of crucifix he'd built out of metal pole in the yard. Super Bowl week the pole was dressed in a jersey and Rod's helmet and Rod had to clear it with Dad if he wanted to take the helmet off. On the Fourth of July the pole was Uncle Sam, on Veteran’s Day a soldier, on Halloween a ghost. The pole was Dad's only concession to glee. We were allowed a single Crayola from the box at a time. One Christmas Eve he shrieked at Kimmie for wasting an apple slice. He hovered over us as we poured ketchup saying: good enough good enough good enough. Birthday parties consisted of cupcakes, no ice cream. The first time I brought a date over she said: what's with your dad and that pole? and I sat there blinking.\n\nWe left home, married, had children of our own, found the seeds of meanness blooming also within us. Dad began dressing the pole with more complexity and less discernible logic. He draped some kind of fur over it on Groundhog Day and lugged out a floodlight to ensure a shadow. When an earthquake struck Chile he lay the pole on its side and spray painted a rift in the earth. Mom died and he dressed the pole as Death and hung from the crossbar photos of Mom as a baby. We'd stop by and find odd talismans from his youth arranged around the base: army medals, theater tickets, old sweatshirts, tubes of Mom's makeup. One autumn he painted the pole bright yellow. He covered it with cotton swabs that winter for warmth and provided offspring by hammering in six crossed sticks around the yard. He ran lengths of string between the pole and the sticks, and taped to the string letters of apology, admissions of error, pleas for understanding, all written in a frantic hand on index cards. He painted a sign saying LOVE and hung it from the pole and another that said FORGIVE? and then he died in the hall with the radio on and we sold the house to a young couple who yanked out the pole and the sticks and left them by the road on garbage day.`
                        );
                        setShowExamples(false);
                      }}
                      className="w-full py-1 text-left transition-colors hover:text-red-600"
                    >
                      <em>Sticks</em> by George Saunders
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => {
                        setText(
                          `Tomorrow, At Dawn\n\nTomorrow, at dawn, at the hour when the countryside whitens,\nI will set out.  You see, I know that you wait for me.\nI will go by the forest, I will go by the mountain.\nI can no longer remain far from you.\n\nI will walk with my eyes fixed on my thoughts,\nSeeing nothing of outdoors, hearing no noise\nAlone, unknown, my back curved, my hands crossed,\nSorrowed, and the day for me will be as the night.\n\nI will not look at the gold of evening which falls,\nNor the distant sails going down towards Harfleur,\nAnd when I arrive, I will place on your tomb\nA bouquet of green holly and of flowering heather.`
                        );
                        setShowExamples(false);
                      }}
                      className="w-full py-1 text-left transition-colors hover:text-red-600"
                    >
                      <em>Tomorrow at Dawn</em> by Victor Hugo
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => {
                        setText(
                          `The Old Pond\nMatsuo Bashō\n\nOld pond...\na frog jumps in\nwater's sound`
                        );
                        setShowExamples(false);
                      }}
                      className="w-full py-1 text-left transition-colors hover:text-red-600"
                    >
                      <em>The old pond</em> by Matsuo Bashō
                    </button>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};