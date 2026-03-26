/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GRID_WIDTH = 18;
const GRID_HEIGHT = 10;
const INITIAL_SNAKE = [
  { x: 2, y: 1 },
  { x: 1, y: 1 },
];
const INITIAL_DIRECTION = 'RIGHT';
const GAME_SPEED = 200;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function App() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 4, y: 3 });
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1,
        y: Math.floor(Math.random() * (GRID_HEIGHT - 2)) + 1,
      };
      const isColliding = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isColliding) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setIsGameOver(false);
    setIsPaused(true);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (directionRef.current) {
        case 'UP':
          newHead.y -= 1;
          break;
        case 'DOWN':
          newHead.y += 1;
          break;
        case 'LEFT':
          newHead.x -= 1;
          break;
        case 'RIGHT':
          newHead.x += 1;
          break;
      }

      // Wall collision
      if (
        newHead.x <= 0 ||
        newHead.x >= GRID_WIDTH - 1 ||
        newHead.y <= 0 ||
        newHead.y >= GRID_HEIGHT - 1
      ) {
        setIsGameOver(true);
        return prevSnake;
      }

      // Self collision
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 1);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, isGameOver, isPaused, generateFood]);

  const handleDirectionChange = useCallback((newDir: Direction) => {
    if (isGameOver) return;
    if (isPaused) setIsPaused(false);

    switch (newDir) {
      case 'UP':
        if (directionRef.current !== 'DOWN') setDirection('UP');
        break;
      case 'DOWN':
        if (directionRef.current !== 'UP') setDirection('DOWN');
        break;
      case 'LEFT':
        if (directionRef.current !== 'RIGHT') setDirection('LEFT');
        break;
      case 'RIGHT':
        if (directionRef.current !== 'LEFT') setDirection('RIGHT');
        break;
    }
  }, [isGameOver, isPaused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          handleDirectionChange('UP');
          break;
        case 'ArrowDown':
          handleDirectionChange('DOWN');
          break;
        case 'ArrowLeft':
          handleDirectionChange('LEFT');
          break;
        case 'ArrowRight':
          handleDirectionChange('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDirectionChange]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartRef.current.x;
    const dy = touchEndY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        if (dx > 0) handleDirectionChange('RIGHT');
        else handleDirectionChange('LEFT');
      }
    } else {
      if (Math.abs(dy) > 30) {
        if (dy > 0) handleDirectionChange('DOWN');
        else handleDirectionChange('UP');
      }
    }
    touchStartRef.current = null;
  };

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  const renderCell = (x: number, y: number) => {
    const isWall = x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1;
    const isSnakeHead = snake[0].x === x && snake[0].y === y;
    const isSnakeBody = snake.slice(1).some((segment) => segment.x === x && segment.y === y);
    const isFood = food.x === x && food.y === y;

    let cellClass = "w-full h-full border-[0.5px] border-black/5 ";
    if (isWall) cellClass += "bg-zinc-800";
    else if (isSnakeHead) cellClass += "bg-emerald-500 rounded-sm z-10 scale-110 shadow-lg";
    else if (isSnakeBody) cellClass += "bg-emerald-400/80 rounded-sm";
    else if (isFood) cellClass += "bg-rose-500 rounded-full scale-75 animate-pulse";
    else cellClass += "bg-zinc-100";

    return (
      <div 
        key={`${x}-${y}`} 
        className={cellClass}
        style={{ aspectRatio: '1/1' }}
      />
    );
  };

  return (
    <div 
      className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans text-zinc-900 overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Score Counter */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-widest font-semibold mb-1">
          <Trophy size={14} />
          Score
        </div>
        <motion.div 
          key={score}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-black tabular-nums"
        >
          {score}
        </motion.div>
      </div>

      {/* Game Board Container */}
      <div className="relative group">
        <div 
          className="grid gap-0 bg-zinc-200 p-1 rounded-xl shadow-2xl border-4 border-zinc-300"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
            width: 'min(90vw, 600px)',
          }}
        >
          {Array.from({ length: GRID_HEIGHT }).map((_, y) =>
            Array.from({ length: GRID_WIDTH }).map((_, x) => renderCell(x, y))
          )}
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-lg z-20"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-center"
              >
                <h2 className="text-2xl font-bold text-zinc-900">Game Over</h2>
                <p className="text-zinc-500">You hit a wall or yourself!</p>
                <button 
                  onClick={resetGame}
                  className="mt-2 flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-full font-bold hover:bg-zinc-800 transition-colors active:scale-95"
                >
                  <RotateCcw size={18} />
                  Try Again
                </button>
              </motion.div>
            </motion.div>
          )}

          {isPaused && !isGameOver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 rounded-lg z-10 pointer-events-none"
            >
              <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-sm font-bold text-zinc-600 animate-bounce text-center">
                Swipe or press any arrow key to start
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Help (Mobile/Desktop) */}
      <div className="mt-8 md:mt-12 flex flex-col items-center gap-6">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <ControlButton icon={<ArrowUp size={24} />} active={direction === 'UP'} onClick={() => handleDirectionChange('UP')} />
          <div />
          <ControlButton icon={<ArrowLeft size={24} />} active={direction === 'LEFT'} onClick={() => handleDirectionChange('LEFT')} />
          <ControlButton icon={<ArrowDown size={24} />} active={direction === 'DOWN'} onClick={() => handleDirectionChange('DOWN')} />
          <ControlButton icon={<ArrowRight size={24} />} active={direction === 'RIGHT'} onClick={() => handleDirectionChange('RIGHT')} />
        </div>
        <p className="text-zinc-400 text-xs uppercase tracking-widest font-medium text-center">
          Swipe, tap, or use arrow keys
        </p>
      </div>
    </div>
  );
}

function ControlButton({ icon, active, onClick }: { icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-14 h-14 md:w-12 md:h-12 flex items-center justify-center rounded-xl transition-all active:scale-95
        ${active ? 'bg-emerald-500 text-white shadow-lg scale-110' : 'bg-white text-zinc-400 shadow-sm hover:bg-zinc-50'}
      `}
    >
      {icon}
    </button>
  );
}

