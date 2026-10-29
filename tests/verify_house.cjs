const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'dist','verification');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,offline:true,hasTouch:true,isMobile:true});
 const page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto('file://'+path.join(ROOT,'dist','index.html'));
 await page.waitForFunction(()=>window.runway?.ready);
 assert.equal((await page.evaluate(()=>runway.state())).house,undefined,'Forest must remain the default');
 const entering=page.locator('#house-mode');
 assert.equal(await entering.textContent(),'ENTER HOUSE');
 await entering.tap();
 assert.equal(await entering.getAttribute('aria-pressed'),'true');
 assert(await page.locator('#house-sound').isVisible(),'Sound control is missing');
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:430,height:932},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  await page.waitForFunction(({width,height})=>runway.state().viewport.w===width&&runway.state().viewport.h===height,viewport);
  const geometry=await page.evaluate(()=>{
   const rect=id=>{const r=document.querySelector(id).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height};};
   return {house:rect('#house-mode'),sound:rect('#house-sound'),walker:runway.state().figure,
    effectsHidden:getComputedStyle(document.querySelector('.effects')).display==='none'};
  });
  for(const key of ['house','sound']){
   const r=geometry[key];
   assert(r.height>=44,'Touch target too short: '+key+' at '+viewport.width+'x'+viewport.height);
   assert(r.left>=0&&r.right<=viewport.width,'Touch target outside viewport: '+key);
  }
  assert(geometry.effectsHidden,'Forest checkboxes should be hidden in house mode on phone');
  if(viewport.width<=700&&viewport.height>650){
   assert(geometry.house.bottom<geometry.walker.y,'House control overlaps walker head');
   assert(geometry.sound.bottom<geometry.walker.y,'Sound control overlaps walker head');
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>runway.state().viewport.w===390&&runway.state().viewport.h===844);
 const house=await page.evaluate(()=>runway.state());
 assert(house.house.enabled,'The new world was not activated');
 assert.deepEqual([...house.house.audioProfiles].sort(),['foyer','wardrobe','dining','mirror','nursery','inkwall','stomach'].sort(),'Missing room-specific audio profiles');
 const audioSource=fs.readFileSync(path.join(ROOT,'src','haunted_house.js'),'utf8');
 for(const feature of ['createDynamicsCompressor','createWaveShaper','createBiquadFilter','createDelay','hungryNoise','hungryTone','hungryStopSounds']){
  assert(audioSource.includes(feature),'Cinematic audio synthesizer missing '+feature);
 }
 assert(audioSource.includes("['warning',-1.84]"),'No timed anticipation before the reveal');
 // Test real alpha pixels and state isolation of the selected spectral renderer.
 const spiritSource=audioSource.slice(audioSource.indexOf('function hungrySpirit('),audioSource.indexOf('function hungryHand('));
 const spirit=await page.evaluate(source=>{
  const surface=document.createElement('canvas');surface.width=480;surface.height=650;
  const c=surface.getContext('2d'),render=new Function(source+';return hungrySpirit;')();
  c.translate(2,3);c.globalAlpha=1;c.strokeStyle='#123456';
  const before={transform:[...['a','b','c','d','e','f'].map(k=>c.getTransform()[k])],alpha:c.globalAlpha,stroke:c.strokeStyle};
  const sample=t=>{c.clearRect(-2,-3,480,650);render(240,315,150,t,11,c);return c.getImageData(0,0,480,650).data};
  const a=sample(3),b=sample(5),again=sample(3);
  let maxAlpha=0,visible=0,moving=0,stable=true,blue=0;
  for(let i=0;i<a.length;i++){
   if(a[i]!==again[i])stable=false;
   if(a[i]!==b[i])moving++;
   if(i%4===3){maxAlpha=Math.max(maxAlpha,a[i]);if(a[i]>5){visible++;if(a[i-1]>a[i-3])blue++;}}
  }
  const after={transform:[...['a','b','c','d','e','f'].map(k=>c.getTransform()[k])],alpha:c.globalAlpha,stroke:c.strokeStyle};
  return {maxAlpha,visible,moving,stable,blue,statePreserved:JSON.stringify(before)===JSON.stringify(after)};
 },spiritSource);
 assert(spirit.visible>10000,'Undertow has no readable spectral body');
 assert(spirit.maxAlpha<250,'Undertow became opaque');
 assert(spirit.blue>spirit.visible*.9,'Undertow lost its blue palette');
 assert(spirit.moving>1000&&spirit.stable,'Undertow motion is missing or nondeterministic');
 assert(spirit.statePreserved,'Ghost drawing leaked canvas state into the house');
 // The selected hand keeps five articulated digits and respects its host context.
 const handSource=fs.readFileSync(path.join(ROOT,'src','ink_thief_hand.js'),'utf8');
 const hand=await page.evaluate(source=>{
  const renderer=new Function(source+';return inkThiefHand;')();
  const surface=document.createElement('canvas');surface.width=480;surface.height=320;
  const c=surface.getContext('2d');
  c.translate(1,2);c.globalAlpha=.7;c.strokeStyle='#123456';
  const state=()=>JSON.stringify({matrix:['a','b','c','d','e','f'].map(k=>c.getTransform()[k]),alpha:c.globalAlpha,stroke:c.strokeStyle,filter:c.filter,composite:c.globalCompositeOperation});
  const before=state();
  const sample=(t,alpha=1)=>{c.clearRect(-1,-2,480,320);renderer.draw(c,410,220,2,alpha,t,7);return c.getImageData(0,0,480,320).data};
  const a=sample(2.6),b=sample(4.2),again=sample(2.6),transparent=sample(2.6,0);
  let visible=0,moving=0,stable=true,empty=true;
  for(let i=0;i<a.length;i++){
   if(a[i]!==again[i])stable=false;
   if(a[i]!==b[i])moving++;
   if(i%4===3&&a[i]>10)visible++;
   if(transparent[i]!==0)empty=false;
  }
  const poses=[0,2.6,4.2,30,130].map(t=>renderer.pose(t));
  const digits=poses.every(f=>f.length===5&&f.every(d=>d.points.length===4));
  const finite=poses.every(f=>f.every(d=>d.mesh.samples.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.r>0)));
  const thumbOpposed=poses.every(f=>f[4].points.at(-1).y>f[4].points[0].y);
  return {visible,moving,stable,empty,digits,finite,thumbOpposed,statePreserved:before===state()};
 },handSource);
 assert(hand.visible>3000,'Ink Thief has no readable hand silhouette');
 assert(hand.moving>1000&&hand.stable,'Hand motion is missing or nondeterministic');
 assert(hand.digits&&hand.finite&&hand.thumbOpposed,'Hand lost its five-digit anatomy');
 assert(hand.empty&&hand.statePreserved,'Hand ignored alpha or leaked Canvas state');
 // The selected marionette has attached strings, finite joints and a one-shot pose.
 const dollSource=fs.readFileSync(path.join(ROOT,'src','little_usher_doll.js'),'utf8');
 const doll=await page.evaluate(source=>{
  const renderer=new Function(source+';return littleUsherDoll;')();
  const surface=document.createElement('canvas');surface.width=480;surface.height=650;
  const c=surface.getContext('2d');c.translate(2,3);c.globalAlpha=.75;c.strokeStyle='#123456';
  const state=()=>JSON.stringify({matrix:['a','b','c','d','e','f'].map(k=>c.getTransform()[k]),alpha:c.globalAlpha,stroke:c.strokeStyle,filter:c.filter,composite:c.globalCompositeOperation});
  const before=state();
  const sample=(age,size=1)=>{c.clearRect(-2,-3,480,650);renderer.draw(c,240,540,size,age);return c.getImageData(0,0,480,650).data};
  const a=sample(.4),b=sample(1.8),again=sample(.4),settled=sample(6),later=sample(9),empty=sample(1,0);
  let visible=0,moving=0,stable=true,recovery=true,blank=true;
  for(let i=0;i<a.length;i++){
   if(a[i]!==again[i])stable=false;if(a[i]!==b[i])moving++;
   if(settled[i]!==later[i])recovery=false;if(empty[i]!==0)blank=false;
   if(i%4===3&&a[i]>10)visible++;
  }
  const poses=[0,1,3,5,8].map(t=>renderer.pose(t));
  const strings=poses.every(p=>p.strings.length===5&&p.strings.every(s=>s.every(pt=>pt.length===2&&pt.every(Number.isFinite))));
  const joints=poses.every(p=>['shoulders','elbows','hands'].every(k=>p[k].length===2&&p[k].every(pt=>pt.every(Number.isFinite))));
  const attached=poses.every(p=>p.strings[0][1].every((v,i)=>v===p.hands[0][i])&&p.strings[1][1].every((v,i)=>v===p.hands[1][i]));
  return {visible,moving,stable,recovery,blank,strings,joints,attached,statePreserved:state()===before};
 },dollSource);
 assert(doll.visible>10000,'Little Usher is not visibly drawn');
 assert(doll.moving>1000&&doll.stable&&doll.recovery,'Doll motion is missing, nondeterministic or repeats in recovery');
 assert(doll.strings&&doll.joints&&doll.attached,'Marionette strings or joints are detached or invalid');
 assert(doll.blank&&doll.statePreserved,'Doll ignored zero size or leaked Canvas state');



 assert.equal(house.figure.x>=0&&house.figure.x+house.figure.width<=390,true,'Walker cropped on phone');
 const seen=new Set(),snapshots=[];
 for(let t=0;t<=130;t+=2.5){
  const s=await page.evaluate(tt=>runway.seek(tt),t);
  assert(s.house.enabled,'The house reset while seeking');
  assert(s.house.rooms.length<=8,'Unbounded room geometry');
  s.house.rooms.forEach(r=>seen.add(r.kind));
  snapshots.push({t,rooms:s.house.rooms.map(r=>({id:r.id,x:r.x,kind:r.kind,phase:r.phase}))});
 }
 for(const kind of ['foyer','wardrobe','dining','mirror','nursery','inkwall','stomach'])assert(seen.has(kind),'Missing '+kind);
 // Moving right must never change an object's identity or type.
 const a=await page.evaluate(()=>runway.seek(19.5)),b=await page.evaluate(()=>runway.seek(20));
 const before=a.house.rooms.find(r=>b.house.rooms.some(n=>n.id===r.id));
 const after=b.house.rooms.find(r=>r.id===before.id);
 assert.equal(before.kind,after.kind);
 assert(after.x>before.x,'The haunted rooms did not scroll left to right');
 // Rendering must depend on time and seed, not on previous seeks.
 await page.evaluate(()=>runway.seek(33.25));
 const one=await page.locator('canvas').evaluate(c=>c.toDataURL());
 await page.evaluate(()=>runway.seek(90));
 await page.evaluate(()=>runway.seek(33.25));
 const two=await page.locator('canvas').evaluate(c=>c.toDataURL());
 assert.equal(one,two,'A house frame changed when revisited');
 assert.equal(await page.locator('#house-sound').getAttribute('aria-pressed'),'true');
 const scares=await page.evaluate(()=>runway.state().house.stingers);
 for(const t of [11,44,95])await page.evaluate(x=>runway.seek(x),t);
 assert.equal(await page.evaluate(()=>runway.state().house.stingers),scares,'Seeking fired scare audio');
 // Crossing a trigger during live playback produces one and only one sting.
 const firstTrigger=await page.evaluate(()=>{
  const s=runway.seek(1),r=s.house.rooms.find(room=>room.id===-1);
  return r?s.time-r.progress:null;
 });
 assert(firstTrigger!==null,'First scare could not be reached');
 const warningBefore=await page.evaluate(()=>runway.state().house.warnings);
 await page.evaluate(t=>runway.seek(t),firstTrigger-1.92);
 await page.evaluate(()=>runway.play());
 await page.waitForTimeout(320);
 await page.evaluate(t=>runway.seek(t),firstTrigger-.08);
 const warningAfter=await page.evaluate(()=>runway.state().house.warnings);
 if(await page.evaluate(()=>runway.state().house.sound))assert.equal(warningAfter,warningBefore+1,'Warning cue did not trigger once');
 assert.equal(await page.evaluate(()=>runway.state().house.liveVoices),0,'Pausing did not stop the active warning');
 const near=await page.evaluate(t=>runway.seek(t),firstTrigger-.08);
 assert(near,'First scare could not be reached');
 await page.evaluate(()=>runway.play());
 await page.waitForTimeout(550);
 await page.evaluate(()=>runway.seek(14));
 const count=await page.evaluate(()=>runway.state().house.stingers);
 // Headless browsers without Web Audio may legitimately remain silent.
 const soundAvailable=await page.evaluate(()=>Boolean(window.AudioContext||window.webkitAudioContext));
 if(soundAvailable){
  assert.equal(count,scares+1,'Live scare did not trigger exactly one sound');
  const firstProfile=await page.evaluate(()=>runway.state().house.lastSound);
  assert.equal(firstProfile.kind,'wardrobe','The wrong room sound played');
  assert.equal(firstProfile.stage,'impact','Warning sound replaced the impact');
  const secondTrigger=await page.evaluate(()=>{
   const s=runway.seek(1),r=s.house.rooms.find(room=>room.id===-2);
   return r?s.time-r.progress:null;
  });
  // The second room might not be visible at t=1; compute it via the room repeat interval.
  const next=secondTrigger===null?firstTrigger+620*Math.min(844/900,1.2)/(49*Math.min(844/900,1.2)):secondTrigger;
  await page.evaluate(t=>runway.seek(t),next-.08);
  await page.evaluate(()=>runway.play());
  await page.waitForTimeout(450);
  const second=await page.evaluate(()=>runway.state().house);
  assert.equal(second.lastSound.kind,'dining','Room-specific scare did not change sound');
  assert.equal(second.lastSound.stage,'impact');
  assert.equal(second.stingers,count+1,'Second room impact was not exactly once');
  await page.evaluate(t=>runway.seek(t),next+.6);
  assert.equal(await page.evaluate(()=>runway.state().house.liveVoices),0,'Pause did not stop sounding oscillators');
 }
 await page.locator('#house-sound').tap();
 assert.equal(await page.locator('#house-sound').getAttribute('aria-pressed'),'false');
 assert.equal(await page.evaluate(()=>runway.state().house.liveVoices),0,'Muting left active sources');
 const mutedCount=await page.evaluate(()=>runway.state().house.stingers);
 await page.evaluate(t=>runway.seek(t),firstTrigger+620/49*2-.07);
 await page.evaluate(()=>runway.play());
 await page.waitForTimeout(320);
 assert.equal(await page.evaluate(()=>runway.state().house.stingers),mutedCount,'Muted audio still fired');
 await page.evaluate(()=>runway.seek(24));
 await page.locator('#scene').screenshot({path:path.join(OUT,'hungry-house-phone.png')});
 await page.setViewportSize({width:1440,height:900});
 await page.evaluate(()=>runway.seek(78));
 await page.locator('#scene').screenshot({path:path.join(OUT,'hungry-house-stomach-desktop.png')});
 await entering.click();
 const back=await page.evaluate(()=>runway.state());
 assert.equal(back.house,undefined,'Leaving the house did not restore the forest');
 assert(back.forest.length>0,'Forest objects disappeared');
 assert.deepEqual(errors,[]);
 assert.deepEqual(requests,[]);
 fs.writeFileSync(path.join(OUT,'haunted-house.json'),JSON.stringify({rooms:[...seen],samples:snapshots.length,stingers:count,soundAvailable,spirit,hand,doll,errors,requests},null,2)+'\n');
 console.log('Hungry House verification passed');
 await browser.close();
})().catch(err=>{console.error(err);process.exit(1);});
