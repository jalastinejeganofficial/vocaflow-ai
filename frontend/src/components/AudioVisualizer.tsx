import React, { useEffect, useRef } from 'react';
import { globalAudioEngine } from '../audio/AudioEngine';

interface Props {
  height?: number;
  barColor?: string;
}

export const AudioVisualizer: React.FC<Props> = ({ height = 80, barColor = '#00e599' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);
      const data = globalAudioEngine.getVisualizerData();
      
      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      const barCount = 48;
      const barWidth = (width / barCount) - 3;
      
      for (let i = 0; i < barCount; i++) {
        const val = data[i] || 0;
        const percent = val / 255;
        const barHeight = Math.max(4, percent * (h - 10));

        // Create gradient
        const gradient = ctx.createLinearGradient(0, h - barHeight, 0, h);
        gradient.addColorStop(0, '#00e599');
        gradient.addColorStop(0.6, '#8b5cf6');
        gradient.addColorStop(1, '#3b82f6');

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 229, 153, 0.4)';
        
        const x = i * (barWidth + 3);
        const y = h - barHeight;
        
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div style={{ width: '100%', height, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

