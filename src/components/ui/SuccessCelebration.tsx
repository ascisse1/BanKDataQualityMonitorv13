import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, PartyPopper, Sparkles } from 'lucide-react';

// Confetti Piece Component
const ConfettiPiece = ({
  color,
  delay,
  x,
  y,
}: {
  color: string;
  delay: number;
  x: number;
  y: number;
}) => (
  <motion.div
    className="absolute w-3 h-3 rounded-sm"
    style={{ backgroundColor: color, left: '50%', top: '50%' }}
    initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
    animate={{
      x: [0, x],
      y: [0, y, y + 100],
      rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
      scale: [1, 1, 0.5],
      opacity: [1, 1, 0],
    }}
    transition={{
      duration: 1.5,
      delay,
      ease: 'easeOut',
    }}
  />
);

// Main Success Celebration Component
interface SuccessCelebrationProps {
  show: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
  variant?: 'minimal' | 'full' | 'confetti';
}

const SuccessCelebration = ({
  show,
  onComplete,
  title = 'Succès !',
  subtitle = 'Opération réalisée avec succès',
  variant = 'full',
}: SuccessCelebrationProps) => {
  const [confettiPieces, setConfettiPieces] = useState<Array<{
    id: number;
    color: string;
    delay: number;
    x: number;
    y: number;
  }>>([]);

  // Generate confetti
  useEffect(() => {
    if (show && (variant === 'full' || variant === 'confetti')) {
      const colors = ['#10b981', '#06c4b0', '#e9b93a', '#0c8ce9', '#f59e0b', '#ef4444'];
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 200 - 100,
      }));
      setConfettiPieces(pieces);
    }
  }, [show, variant]);

  // Auto-complete callback
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (variant === 'confetti') {
    return (
      <AnimatePresence>
        {show && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {confettiPieces.map((piece) => (
                <ConfettiPiece key={piece.id} {...piece} />
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'minimal') {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-success-500 flex items-center justify-center"
                initial={{ boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' }}
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(16, 185, 129, 0.4)',
                    '0 0 0 30px rgba(16, 185, 129, 0)',
                  ],
                }}
                transition={{ duration: 0.8 }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Full variant
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {confettiPieces.map((piece) => (
                <ConfettiPiece key={piece.id} {...piece} />
              ))}
            </div>
          </div>

          {/* Content */}
          <motion.div
            className="relative bg-white dark:bg-surface-900 rounded-3xl p-8 shadow-2xl max-w-sm mx-4 text-center"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {/* Decorative elements */}
            <motion.div
              className="absolute -top-6 left-1/2 -translate-x-1/2"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-gold-500" />
                <PartyPopper className="w-8 h-8 text-primary-500" />
                <Sparkles className="w-6 h-6 text-gold-500" />
              </div>
            </motion.div>

            {/* Success icon with animation */}
            <motion.div
              className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mb-6 shadow-lg shadow-success-500/30"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-2xl font-bold text-slate-900 dark:text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-slate-500 dark:text-slate-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {subtitle}
            </motion.p>

            {/* Progress bar */}
            <motion.div
              className="mt-6 h-1 bg-slate-100 dark:bg-surface-700 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-success-400 to-success-600"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 2, ease: 'linear', delay: 0.5 }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessCelebration;

// Hook to use success celebration
export const useSuccessCelebration = () => {
  const [show, setShow] = useState(false);
  const [config, setConfig] = useState<{
    title?: string;
    subtitle?: string;
    variant?: 'minimal' | 'full' | 'confetti';
  }>({});

  const celebrate = useCallback(
    (options?: {
      title?: string;
      subtitle?: string;
      variant?: 'minimal' | 'full' | 'confetti';
    }) => {
      setConfig(options || {});
      setShow(true);
    },
    []
  );

  const handleComplete = useCallback(() => {
    setShow(false);
  }, []);

  const CelebrationComponent = () => (
    <SuccessCelebration
      show={show}
      onComplete={handleComplete}
      {...config}
    />
  );

  return { celebrate, CelebrationComponent };
};
