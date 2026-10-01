export const stops = [[0,0.09,0.23,0.9],[.2,0,.74,.98],[.4,.28,.87,.63],[.6,.91,.88,.24],[.8,1,.61,.14],[1,.81,.13,.17]];
export function colorFor(value, tolerance, difference = false) {
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
export function validateDataset(data, meshes) {
  if (data.unit !== 'mm' || data.mapping !== 'vertex-index' || !Array.isArray(data.frames) || !data.frames.length) throw new Error('Formato esperado: unit=mm, mapping=vertex-index e frames com pelo menos uma análise.');
  const ids = new Set();
  const check = samples => {
    if (!Array.isArray(samples)) throw new Error('Cada análise precisa de samples.');
    const seen = new Set();
    for (const s of samples) {
      const mesh=meshes[s.mesh], key=`${s.mesh}:${s.vertex}`;
      if (!Number.isInteger(s.mesh)||!mesh||!Number.isInteger(s.vertex)||s.vertex<0||s.vertex>=mesh.geometry.attributes.position.count) throw new Error('Malha ou vértice inexistente.');
      if (!Number.isFinite(s.value) || (s.confidence !== undefined && (!Number.isFinite(s.confidence)||s.confidence<0||s.confidence>1))) throw new Error('Valor ou confiança inválidos.');
      if (seen.has(key)) throw new Error('Medição duplicada.'); seen.add(key);
    }
  };
  for(const f of data.frames){if(typeof f.id!=='string'||ids.has(f.id))throw new Error('Cada análise precisa de id único.');ids.add(f.id);check(f.samples);}
  if(data.reference)check(data.reference.samples);
  return data;
}
