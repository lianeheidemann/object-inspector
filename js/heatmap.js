export const stops = [[0,0.09,0.23,0.9],[.2,0,.74,.98],[.4,.28,.87,.63],[.6,.91,.88,.24],[.8,1,.61,.14],[1,.81,.13,.17]];
// Escalas de severidade: paradas [posição, r, g, b] e o nome da cor do limite.
export const palettes = {
  padrao: { stops, high: 'Vermelho' },
  viridis: { stops: [[0,.267,.005,.329],[.2,.255,.267,.529],[.4,.165,.471,.557],[.6,.133,.659,.518],[.8,.478,.82,.318],[1,.992,.906,.145]], high: 'Amarelo' },
};
export const gradientCss = s => `linear-gradient(90deg,${s.map(([t,r,g,b]) => `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)}) ${t*100}%`).join(',')})`;
export function colorFor(value, tolerance, difference = false, stops = palettes.padrao.stops) {
  if (!Number.isFinite(value)) return [.38,.42,.47];
  if (difference) { const t = Math.min(1, Math.abs(value) / tolerance); return value < 0 ? [1-t*.9,1-t*.55,1] : [1,1-t*.85,1-t*.85]; }
  const s = Math.min(1, Math.abs(value) / tolerance);
  const i = Math.min(4, Math.floor(s*5)), a=stops[i], b=stops[i+1], t=(s-a[0])/(b[0]-a[0]);
  return a.slice(1).map((v,j)=>v+(b[j+1]-v)*t);
}
export function demoValue(p, frame=0) {
  const bumps = [[.38,.55,.35,.22,1.15],[-.45,.2,-.1,.32,.65],[.1,-.35,.4,.2,.85]];
  return .04 + bumps.reduce((sum,[x,y,z,r,h],i)=>sum+h*(1+frame*.07)*Math.exp(-((p.x-x-frame*.015)**2+(p.y-y)**2+(p.z-z)**2)/(2*r*r)),0);
}
