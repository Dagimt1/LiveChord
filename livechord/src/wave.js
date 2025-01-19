// wave.js

export function render(w, h, ctx, power, t) {
    const n = 40;
    const step = w / n;
    // If power is huge, clamp
    const max = power > 1000 ? 1 : power / 1000;
  
    // Force wave to be white-ish
    const colors = [
      "rgba(255, 255, 255, 0.5)",   // 50% white
      "rgba(255, 255, 255, 0.25)"  // 25% white
    ];
  
    ctx.clearRect(0, 0, w, h);
  
    for (let i = 0; i < colors.length; i++) {
      ctx.beginPath();
      ctx.fillStyle = colors[i];
      ctx.moveTo(0, h);
      const omega = 3e-3 * (i === 0 ? +1 : -1);
      for (let x = 1; x < n; x++) {
        const s = Math.sin(0.02 * x * step - omega * t);
        const e = Math.sin(Math.PI * x / n);
        ctx.lineTo(x * step, h - max * h * s * s * e);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }
  }
  