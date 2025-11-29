import React, { useRef, useEffect } from 'react';
import { AudioVisualizerProps } from '../types';

export const Visualizer: React.FC<AudioVisualizerProps> = ({ analyser, isActive, color = '#3b82f6' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyser || !isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // Fade effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.5;

        // Dynamic color based on height/intensity
        ctx.fillStyle = color;
        
        // Draw centered bars
        const y = (canvas.height - barHeight) / 2;
        ctx.fillRect(x, y, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      // Clear canvas on stop
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [analyser, isActive, color]);

  // Fallback animation when waiting for audio or just active
  useEffect(() => {
    if (!isActive || analyser) return;
     const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    let t = 0;
    let animationId: number;
    
    const breathe = () => {
        t += 0.05;
        const scale = 1 + Math.sin(t) * 0.1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 40 * scale, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 30 * scale, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.fill();

        animationId = requestAnimationFrame(breathe);
    };
    breathe();

    return () => cancelAnimationFrame(animationId);

  }, [isActive, analyser, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={150} 
      className="w-full h-full object-contain"
    />
  );
};
