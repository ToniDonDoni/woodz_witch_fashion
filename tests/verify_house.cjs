const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'dist','verification');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 // A committed offline snapshot must identify the real source revision.
 const original=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const copy=fs.readFileSync(path.join(ROOT,'site','index.html'),'utf8');
 assert.equal(original,copy,'The two committed standalone snapshots differ');
 const stamp=original.match(/<a id="build-commit" data-head="([0-9a-f]{40})" data-commit-kind="source"/);
 assert(stamp,'Snapshot has no source commit SHA (the HEAD placeholder is forbidden)');
 const sourceSha=stamp[1];
 assert(original.includes('href="https://github.com/ToniDonDoni/woodz_witch_fashion/commit/'+sourceSha+'"'),'Snapshot SHA is not a working GitHub commit link');
 assert(original.includes('SOURCE '+sourceSha.slice(0,12)),'Snapshot lacks a readable source SHA');
 const {execFileSync}=require('child_process');
 const sourceExists=execFileSync('git',['cat-file','-t',sourceSha],{cwd:ROOT,encoding:'utf8'}).trim();
 assert.equal(sourceExists,'commit','Snapshot source hash is not a Git commit');
 const unchanged=execFileSync('git',['diff','--name-only',sourceSha,'HEAD','--','src','assets/walk','scripts/build_forest_page.py'],{cwd:ROOT,encoding:'utf8'}).trim();
 assert.equal(unchanged,'','Committed standalone page no longer matches its labeled source commit');
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
 fs.writeFileSync(path.join(OUT,'haunted-house.json'),JSON.stringify({rooms:[...seen],samples:snapshots.length,stingers:count,soundAvailable,errors,requests},null,2)+'\n');
 console.log('Hungry House verification passed');
 await browser.close();
})().catch(err=>{console.error(err);process.exit(1);});
