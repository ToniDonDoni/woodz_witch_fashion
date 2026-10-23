// Deterministic, indefinitely indexed three-effect art direction.
// Every appearance has a fixed genome and a finite lifecycle, independent of RAF cadence.
const fxDirector=(()=>{
  'use strict';
  const SLOT_SECONDS=8.4;
  const EFFECTS=['liquid-glass','spectral-smoke','pixel-dissolve'];
  const PALETTES=[
    [[.25,.96,1.00],[.72,.43,1.00],[1.00,.67,.88]],
    [[.35,1.00,.73],[.18,.66,1.00],[.94,.90,.58]],
    [[1.00,.43,.67],[.71,.31,1.00],[1.00,.82,.48]],
    [[.52,.80,1.00],[.98,.53,.79],[.67,1.00,.88]],
    [[1.00,.74,.33],[.98,.35,.57],[.55,.63,1.00]]
  ];
  function hash(seed,idx,salt=0){
    let x=(seed^Math.imul(idx,0x9e3779b9)^Math.imul(salt,0x85ebca6b))|0;
    x=Math.imul(x^(x>>>16),0x7feb352d);
    x=Math.imul(x^(x>>>15),0x846ca68b);
    return (x^(x>>>16))>>>0;
  }
  const random=(seed,idx,salt=0)=>hash(seed,idx,salt)/4294967296;
  function typeForSlot(seed,slot){
    const cycle=Math.floor(slot/3);
    const list=[0,1,2];
    for(let i=2;i>0;i--){
      const j=Math.floor(random(seed,cycle*13+i,100)*(i+1));
      [list[i],list[j]]=[list[j],list[i]];
    }
    return list[slot%3];
  }
  function spec(seed,slot){
    const index=Math.max(0,Math.floor(slot));
    const effect=typeForSlot(seed,index);
    const genome=hash(seed,index,71);
    const r=i=>random(genome,i,121);
    const start=.48+.22*r(2),duration=6.05+.35*r(3);
    const side=r(4)<.5?-1:1;
    return Object.freeze({
      slot:index,id:genome,type:effect,name:EFFECTS[effect],
      start,duration,tail:SLOT_SECONDS-start-duration,
      side,position:.29+.04*r(5),altitude:.46+.12*r(6),
      size:.93+.19*r(7),hue:r(8),phase:r(9)*Math.PI*2,
      detail:.7+.55*r(10),distortion:.7+.65*r(11),
      anatomy:.8+.4*r(12),palette:PALETTES[(index+Math.floor(r(13)*5))%PALETTES.length]
    });
  }
  function at(seed,t){
    const time=Math.max(0,Number.isFinite(t)?t:0),slot=Math.floor(time/SLOT_SECONDS);
    const local=time-slot*SLOT_SECONDS,s=spec(seed,slot);
    const age=local-s.start;
    return {slot,local,age,spec:s,active:age>=0&&age<s.duration};
  }
  return {SLOT_SECONDS,EFFECTS,PALETTES,spec,at};
})();
