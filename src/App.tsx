import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Palmtree, Cloud, Mountain } from 'lucide-react';

interface Obstacle {
  id: number;
  x: number;
}

interface Cloud {
  id: number;
  x: number;
  y: number;
}

function App() {
  const [isJumping, setIsJumping] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [dinoY, setDinoY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [gameSpeed, setGameSpeed] = useState(5);
  const animationFrame = useRef<number>();
  const lastUpdate = useRef<number>(0);

  const jump = useCallback(() => {
    if (!isJumping && !gameOver) {
      setIsJumping(true);
      let jumpHeight = 0;
      let jumpVelocity = 15;
      const gravity = 0.8;

      const jumpAnimation = () => {
        jumpHeight += jumpVelocity;
        jumpVelocity -= gravity;
        setDinoY(jumpHeight);

        if (jumpHeight > 0) {
          requestAnimationFrame(jumpAnimation);
        } else {
          setDinoY(0);
          setIsJumping(false);
        }
      };

      requestAnimationFrame(jumpAnimation);
    }
  }, [isJumping, gameOver]);

  const resetGame = () => {
    setGameOver(false);
    setScore(0);
    setObstacles([]);
    setClouds([]);
    setGameSpeed(5);
    setDinoY(0);
    lastUpdate.current = 0;
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (gameOver) {
          resetGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump, gameOver]);

  useEffect(() => {
    if (gameOver) {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      return;
    }

    const gameLoop = (timestamp: number) => {
      if (!lastUpdate.current) lastUpdate.current = timestamp;
      const deltaTime = timestamp - lastUpdate.current;

      if (deltaTime >= 16) { // Cap at ~60fps
        setScore(prev => prev + 1);
        
        if (score > 0 && score % 500 === 0) {
          setGameSpeed(prev => Math.min(prev + 1, 12));
        }

        // Update obstacles
        setObstacles(prevObstacles => {
          const updatedObstacles = prevObstacles
            .map(obstacle => ({
              ...obstacle,
              x: obstacle.x - gameSpeed * (deltaTime / 16)
            }))
            .filter(obstacle => obstacle.x > -50);

          if (prevObstacles.length === 0 || 
              prevObstacles[prevObstacles.length - 1].x < 600) {
            return [...updatedObstacles, {
              id: Date.now(),
              x: 800 + Math.random() * 200
            }];
          }

          return updatedObstacles;
        });

        // Update clouds
        setClouds(prevClouds => {
          const updatedClouds = prevClouds
            .map(cloud => ({
              ...cloud,
              x: cloud.x - (gameSpeed * 0.3) * (deltaTime / 16)
            }))
            .filter(cloud => cloud.x > -100);

          if (prevClouds.length === 0 || 
              prevClouds[prevClouds.length - 1].x < 700) {
            return [...updatedClouds, {
              id: Date.now(),
              x: 800 + Math.random() * 200,
              y: 50 + Math.random() * 150
            }];
          }

          return updatedClouds;
        });

        // Collision detection
        obstacles.forEach(obstacle => {
          const dinoHitbox = {
            x: 100,
            y: 300 - dinoY,
            width: 40,
            height: 40
          };

          const obstacleHitbox = {
            x: obstacle.x,
            y: 300,
            width: 20,
            height: 40
          };

          if (
            dinoHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
            dinoHitbox.x + dinoHitbox.width > obstacleHitbox.x &&
            dinoHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
            dinoHitbox.y + dinoHitbox.height > obstacleHitbox.y
          ) {
            setGameOver(true);
            return;
          }
        });

        lastUpdate.current = timestamp;
      }

      animationFrame.current = requestAnimationFrame(gameLoop);
    };

    animationFrame.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [gameOver, obstacles, score, gameSpeed, dinoY]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 flex flex-col items-center justify-center p-4"
      onClick={() => gameOver ? resetGame() : jump()}
    >
      <div className="relative w-[800px] h-[400px] bg-gradient-to-b from-white to-gray-100 rounded-lg shadow-2xl overflow-hidden border border-gray-200">
        {/* Background Mountains */}
        <div className="absolute bottom-0 w-full">
          <Mountain className="absolute bottom-0 left-1/4 w-40 h-32 text-gray-300 opacity-50" />
          <Mountain className="absolute bottom-0 left-2/3 w-48 h-40 text-gray-300 opacity-50" />
        </div>

        {/* Clouds */}
        {clouds.map(cloud => (
          <div
            key={cloud.id}
            className="absolute"
            style={{ 
              left: `${cloud.x}px`,
              top: `${cloud.y}px`,
              transform: 'scale(1.5)',
              transition: 'transform 0.2s ease-out'
            }}
          >
            <Cloud className="text-white/80" />
          </div>
        ))}

        {/* Score */}
        <div className="absolute top-4 right-4 text-2xl font-mono bg-white/50 px-4 py-2 rounded-full">
          {score.toString().padStart(5, '0')}
        </div>

        {/* Game Over Message */}
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center text-white">
              <h2 className="text-6xl font-bold mb-4">Game Over</h2>
              <p className="text-2xl">Final Score: {score}</p>
              <p className="text-xl mt-4">Press Space or Click to restart</p>
            </div>
          </div>
        )}

        {/* Ground */}
        <div className="absolute bottom-0 w-full">
          <div className="h-[2px] bg-gray-400" />
          <div className="h-20 bg-gradient-to-b from-orange-100 to-orange-200" />
        </div>

        {/* Dino */}
        <div
          className="absolute left-[100px] will-change-transform"
          style={{
            bottom: `${dinoY}px`,
            transform: `translateY(-40px) ${isJumping ? 'rotate(-10deg)' : ''}`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="w-10 h-10 text-gray-800 transform scale-150">
            🦖
          </div>
        </div>

        {/* Obstacles */}
        {obstacles.map(obstacle => (
          <div
            key={obstacle.id}
            className="absolute bottom-10 will-change-transform"
            style={{ 
              left: `${obstacle.x}px`,
              transform: 'scale(1.2)'
            }}
          >
            <Palmtree className="w-5 h-10 text-green-800" />
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center text-white bg-black/20 px-6 py-3 rounded-full backdrop-blur-sm">
        <p className="text-lg">Press Space or Click to jump</p>
        <p className="text-sm mt-1">Avoid the obstacles and survive as long as you can!</p>
      </div>
    </div>
  );
}

export default App;