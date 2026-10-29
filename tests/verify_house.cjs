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
 const house=await page.evaluate(()=>runway.state());
 assert(house.house.enabled,'The new world was not activated');
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
 const near=await page.evaluate(()=>{
  const s=runway.seek(1),r=s.house.rooms.find(room=>room.id===-1);
  if(!r)return null;
  const trigger=s.time-r.progress;
  return runway.seek(trigger-.08);
 });
 assert(near,'First scare could not be reached');
 await page.evaluate(()=>runway.play());
 await page.waitForTimeout(550);
 await page.evaluate(()=>runway.seek(14));
 const count=await page.evaluate(()=>runway.state().house.stingers);
 // Headless browsers without Web Audio may legitimately remain silent.
 const soundAvailable=await page.evaluate(()=>Boolean(window.AudioContext||window.webkitAudioContext));
 if(soundAvailable)assert.equal(count,scares+1,'Live scare did not trigger exactly one sound');
 await page.locator('#house-sound').tap();
 assert.equal(await page.locator('#house-sound').getAttribute('aria-pressed'),'false');
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
