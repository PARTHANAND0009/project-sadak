import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingAnimationProps {
  onComplete: () => void;
}

export default function OnboardingAnimation({ onComplete }: OnboardingAnimationProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sequence = async () => {
      // Step 0: First sentence (staggered reveal takes ~2.5s)
      await new Promise(r => setTimeout(r, 4500)); 
      setStep(1); // Fade out first sentence
      await new Promise(r => setTimeout(r, 800)); 
      
      setStep(2); // "Most go unreported."
      await new Promise(r => setTimeout(r, 1800)); 
      
      setStep(3); // "Most go unfixed."
      await new Promise(r => setTimeout(r, 1800));
      
      setStep(4); // "Not anymore."
      await new Promise(r => setTimeout(r, 3000));
      
      setStep(5); // Fade out everything
      await new Promise(r => setTimeout(r, 800));
      
      onComplete();
    };
    
    sequence();
  }, [onComplete]);

  const sentence = "Every year, 20,000+ people lose their lives due to potholes globally.";
  const words = sentence.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
    hidden: {
      opacity: 0,
      y: 10,
      filter: "blur(4px)",
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center p-8">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            exit={{ opacity: 0, filter: "blur(10px)", transition: { duration: 0.8 } }}
            className="max-w-4xl text-center"
          >
            <motion.h2
              variants={container}
              initial="hidden"
              animate="visible"
              className="text-3xl md:text-5xl lg:text-6xl font-medium text-gray-900 leading-tight tracking-tight flex flex-wrap justify-center gap-x-3 gap-y-2"
            >
              {words.map((word, index) => (
                <motion.span 
                  variants={child} 
                  key={index} 
                  className={word.includes("20,000+") ? "font-bold text-red-600" : ""}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h2>
          </motion.div>
        )}
        
        {step >= 2 && step < 5 && (
          <motion.div
            key="step2"
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="max-w-3xl text-center flex flex-col gap-6"
          >
            <motion.h2 
              initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 1.2 }}
              className="text-3xl md:text-5xl font-medium text-gray-500"
            >
              Most go unreported.
            </motion.h2>
            
            {step >= 3 && (
              <motion.h2 
                initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 1.2 }}
                className="text-3xl md:text-5xl font-medium text-gray-500"
              >
                Most go unfixed.
              </motion.h2>
            )}
            
            {step >= 4 && (
              <motion.h2 
                initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                className="text-4xl md:text-6xl font-bold text-gray-900 mt-8"
              >
                Not anymore.
              </motion.h2>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
