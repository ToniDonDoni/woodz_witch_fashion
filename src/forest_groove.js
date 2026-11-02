// Forest-only procedural hip-hop. No sound starts before a user gesture.
const forestGroove=(()=>{
  const button=document.querySelector('#forest-groove-start');
  const volume=document.querySelector('#forest-groove-volume');
  const storageKey='woodz-forest-groove-volume';
  let context=null,master=null,synth=null,timer=null;
  let nextBar=0,nextTime=0,playing=false,pending=false,generation=0;
  let level=.62;
  const sources=new Set();

  try{
    const saved=localStorage.getItem(storageKey);
    const value=Number(saved);
    if(saved!==null&&Number.isFinite(value))level=Math.min(1,Math.max(0,value));
  }catch{}
  volume.value=String(Math.round(level*100));

  function updateControls(){
    button.textContent=playing?'PAUSE GROOVE':'START GROOVE';
    button.setAttribute('aria-pressed',String(playing));
    button.setAttribute('aria-label',playing?'Pause forest groove':'Start forest groove');
  }

  function schedule(){
    if(!playing||hungry.active||!context||context.state!=='running')return;
    if(nextTime<context.currentTime)nextTime=context.currentTime+.05;
    while(nextTime<context.currentTime+5){
      const {left,right}=synth.renderBar(nextBar++);
      const buffer=context.createBuffer(2,left.length,GROOVE_SAMPLE_RATE);
      buffer.copyToChannel(left,0);buffer.copyToChannel(right,1);
      const source=context.createBufferSource();
      source.buffer=buffer;source.connect(master);sources.add(source);
      source.onended=()=>{
        sources.delete(source);
        source.disconnect();
        source.buffer=null;
      };
      source.start(nextTime);
      nextTime+=synth.barSeconds;
    }
  }

  function stop(){
    ++generation;
    playing=false;
    clearInterval(timer);timer=null;
    if(context){
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(0,context.currentTime);
      for(const source of sources){
        try{source.stop();}catch{}
        source.disconnect();
        source.buffer=null;
      }
      sources.clear();
      context.suspend().catch(()=>{});
    }
    updateControls();
  }

  async function toggle(){
    if(pending||hungry.active)return;
    if(playing){stop();return;}
    const token=++generation;
    pending=true;button.disabled=true;
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
        synth=new ForestGrooveSynth(seed[0],GROOVE_BPM);
      }
      await context.resume();
      if(token!==generation||hungry.active||context.state!=='running'){
        if(context.state==='running')context.suspend().catch(()=>{});
        return;
      }
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
      pending=false;button.disabled=false;
      updateControls();
    }
  }

  button.addEventListener('click',toggle);
  volume.addEventListener('input',()=>{
    level=Math.max(0,Math.min(1,Number(volume.value)/100));
    if(master&&playing){
      master.gain.setTargetAtTime(level*.95,context.currentTime,.025);
    }
    try{localStorage.setItem(storageKey,String(level));}catch{}
  });
  document.addEventListener('visibilitychange',()=>{
    if(playing&&!document.hidden)schedule();
  });
  updateControls();
  return {
    stop,
    status:()=>({playing,bpm:GROOVE_BPM,volume:level,scheduled:sources.size})
  };
})();
