// Forest-only hip-hop. START GROOVE opts in; the runway PAUSE/PLAY owns playback.
const forestGroove=(()=>{
  const button=document.querySelector('#forest-groove-start');
  const volume=document.querySelector('#forest-groove-volume');
  const tempo=document.querySelector('#forest-tempo');
  const tempoOutput=document.querySelector('#forest-tempo-readout');
  const storageKey='woodz-forest-groove-volume';
  let context=null,master=null,synth=null,timer=null,tempoTimer=null;
  let nextBar=0,nextTime=0,armed=false,playing=false,pending=false,walking=true,generation=0;
  let level=.62,paceFactor=1,baseBpm=GROOVE_BPM,bpm=GROOVE_BPM;
  const sources=new Map();

  try{
    const saved=localStorage.getItem(storageKey);
    const value=Number(saved);
    if(saved!==null&&Number.isFinite(value))level=Math.min(1,Math.max(0,value));
  }catch{}
  volume.value=String(Math.round(level*100));

  function updateControls(){
    button.textContent=armed?(playing?'GROOVE ON':'GROOVE READY'):'START GROOVE';
    button.disabled=armed||pending;
    button.setAttribute('aria-pressed',String(armed));
    button.setAttribute('aria-label',armed?'Groove enabled; use main play or pause':'Start forest groove');
  }

  function schedule(){
    if(!playing||hungry.active||!context||context.state!=='running')return;
    if(nextTime<context.currentTime)nextTime=context.currentTime+.05;
    while(nextTime<context.currentTime+5){
      const bar=nextBar++,{left,right}=synth.renderBar(bar);
      const buffer=context.createBuffer(2,left.length,GROOVE_SAMPLE_RATE);
      buffer.copyToChannel(left,0);buffer.copyToChannel(right,1);
      const source=context.createBufferSource();
      source.buffer=buffer;source.connect(master);
      sources.set(source,{bar,start:nextTime});
      source.onended=()=>{
        sources.delete(source);
        source.disconnect();
        source.buffer=null;
      };
      source.start(nextTime);
      nextTime+=synth.barSeconds;
    }
  }

  function clearSources(at){
    const now=context.currentTime;
    for(const source of sources.keys()){
      try{source.stop(at);}catch{}
      if(at<=now){
        source.onended=null;
        source.disconnect();
        source.buffer=null;
      }else{
        source.onended=()=>{source.disconnect();source.buffer=null;};
      }
    }
    sources.clear();
  }

  function pause(){
    ++generation;
    playing=false;
    clearInterval(timer);timer=null;
    clearTimeout(tempoTimer);tempoTimer=null;
    if(context){
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(0,context.currentTime);
      clearSources(context.currentTime);
      context.suspend().catch(()=>{});
    }
    updateControls();
  }

  function stop(){
    armed=false;
    pause();
  }

  async function resume(){
    if(!armed||!walking||hungry.active||playing||pending)return;
    const token=++generation;
    pending=true;updateControls();
    try{
      if(!context){
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)throw Error('Web Audio is not supported');
        context=new Audio({latencyHint:'playback'});
        master=context.createGain();master.gain.value=0;
        const low=context.createBiquadFilter();
        low.type='lowpass';low.frequency.value=6900;low.Q.value=.45;
        const high=context.createBiquadFilter();
        high.type='highpass';high.frequency.value=28;
        const compressor=context.createDynamicsCompressor();
        compressor.threshold.value=-13;compressor.knee.value=14;
        compressor.ratio.value=3;compressor.attack.value=.008;
        compressor.release.value=.16;
        master.connect(high).connect(low).connect(compressor).connect(context.destination);
        const seed=new Uint32Array(1);
        crypto.getRandomValues(seed);
        synth=new ForestGrooveSynth(seed[0],bpm);
      }
      await context.resume();
      if(token!==generation||!armed||!walking||hungry.active||context.state!=='running'){
        if(context.state==='running')context.suspend().catch(()=>{});
        return;
      }
      synth.setBpm(bpm);
      playing=true;
      nextTime=context.currentTime+.07;
      schedule();
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(level*.95,context.currentTime,.09);
      timer=setInterval(schedule,200);
    }catch(error){
      console.error('Forest groove could not start:',error);
      button.title='Unable to play music. Tap to retry.';
      stop();
    }finally{
      pending=false;
      updateControls();
    }
  }

  function reschedule(){
    tempoTimer=null;
    if(!playing||!context||context.state!=='running')return;
    const now=context.currentTime,cutAt=now+.05;
    const firstUnheard=[...sources.values()].find(item=>item.start>=cutAt);
    if(firstUnheard)nextBar=firstUnheard.bar;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0,now,.012);
    clearSources(cutAt);
    nextTime=cutAt+.03;
    schedule();
    master.gain.setTargetAtTime(level*.95,nextTime-.03,.06);
  }

  function setTempoDisplay(){
    const next=Math.min(MAX_BPM,Math.max(MIN_BPM,Math.round(baseBpm*paceFactor)));
    if(bpm!==next){
      bpm=next;
      if(synth)synth.setBpm(bpm);
      clearTimeout(tempoTimer);
      if(playing)tempoTimer=setTimeout(reschedule,90);
    }
    tempo.value=String(bpm);
    tempoOutput.textContent=`${bpm} BPM`;
  }

  function setPace(value){
    paceFactor=Number(value);
    setTempoDisplay();
  }

  function setWalking(value){
    walking=!!value;
    if(!walking)pause();
    else resume();
  }

  button.addEventListener('click',()=>{
    if(armed||pending||hungry.active)return;
    armed=true;
    updateControls();
    resume();
  });
  volume.addEventListener('input',()=>{
    level=Math.max(0,Math.min(1,Number(volume.value)/100));
    if(master&&playing)master.gain.setTargetAtTime(level*.95,context.currentTime,.025);
    try{localStorage.setItem(storageKey,String(level));}catch{}
  });
  tempo.addEventListener('input',()=>{
    // The selected tempo calibrates the current pace; later PACE changes scale it.
    baseBpm=Number(tempo.value)/paceFactor;
    setTempoDisplay();
  });
  document.addEventListener('visibilitychange',()=>{
    if(playing&&!document.hidden)schedule();
  });
  setTempoDisplay();
  updateControls();
  return {
    stop,pause,resume,setWalking,setPace,
    status:()=>({playing,armed,bpm,pace:paceFactor,volume:level,scheduled:sources.size})
  };
})();
