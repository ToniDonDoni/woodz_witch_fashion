const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert');
const {execFileSync}=require('child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ROOT=path.resolve(__dirname,'..'),RESULTS=path.join(ROOT,'dist','verification');
const pixels=async p=>p.locator('canvas').evaluate(c=>c.toDataURL());
(async()=>{
 fs.mkdirSync(RESULTS,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,offline:true});
 const page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
 await page.goto('file://'+path.join(ROOT,'dist','index.html'));await page.waitForFunction(()=>runway.ready);
 const head=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
 assert.equal(await page.locator('#build-commit').getAttribute('data-head'),head);
 assert.equal(await page.getByRole('checkbox').count(),6);
 for(const name of ['Fog','Spore trails','Fractal ferns','Living ink','Glass flowers','Big sparks'])assert(await page.getByRole('checkbox',{name,exact:true}).isChecked());
 await page.evaluate(()=>runway.seek(0));
 for(const cb of await page.getByRole('checkbox').all())await cb.uncheck();
 // Immutable accepted main page: proves the port preserves the sky, acts, color
 // grade, foreground, woodland and original walk pixels when new effects are off.
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'woodz-baseline-'));
 const original=execFileSync('git',['show','95ebb572944ad91eccd1c824568296af8e17814a:index.html'],{cwd:ROOT,maxBuffer:8*1024*1024});
 fs.writeFileSync(path.join(tmp,'index.html'),original);
 const baseline=await context.newPage();await baseline.goto('file://'+path.join(tmp,'index.html'));await baseline.waitForFunction(()=>runway.ready);
 for(const t of [0,.5,7.125,20,60,120]){
  await page.evaluate(t=>runway.seek(t),t);await baseline.evaluate(t=>runway.seek(t),t);
  assert.equal(await pixels(page),await pixels(baseline),'Port changed original main canvas at '+t);
  const a=await page.evaluate(()=>runway.state()),b=await baseline.evaluate(()=>runway.state());
  assert.deepEqual(a.events,b.events);assert.deepEqual(a.act,b.act);assert.equal(a.mood,b.mood);
 }
 await baseline.close();fs.rmSync(tmp,{recursive:true});
 for(const name of ['fog','spores','plants','ink','glass','sparks']){
  const checkbox=page.locator(`[data-effect="${name}"]`);let changed=false;
  for(const t of [.5,2,5,10,20,30]){
   await page.evaluate(t=>runway.seek(t),t);const before=await pixels(page);await checkbox.check();
   const after=await pixels(page);await checkbox.uncheck();assert.equal(await pixels(page),before,name+' did not restore paused frame');
   if(after!==before){changed=true;break;}
  }
  assert(changed,name+' never changed actual pixels');
 }
 const fog=page.getByRole('checkbox',{name:'Fog',exact:true});await fog.focus();await page.keyboard.press('Space');assert(await fog.isChecked());await page.keyboard.press('Space');assert(!(await fog.isChecked()));
 for(const cb of await page.getByRole('checkbox').all())await cb.check();
 let spores=0,plants=0,maxPlantCache=0;
 for(let t=0;t<=180;t++){
  const state=await page.evaluate(t=>runway.seek(t),t),fx=state.effects;
  assert.equal(fx.plantCacheSize,fx.plants.length);assert(fx.plants.length<=3);assert(fx.spores.length<=8);
  maxPlantCache=Math.max(maxPlantCache,fx.plantCacheSize);
  if(t<=30){spores+=fx.spores.length;plants+=fx.plants.length;}
 }
 assert(spores>0&&plants>0);
 const extras=await page.evaluate(()=>runway.state().effects);
 assert(extras.ink.length>=4,'No ink currents');
 assert(extras.glass.length>=1,'No glass flowers');
 assert.equal(extras.sparks.count,128,'Big sparks must span two particle fields');
 // Big sparks must cover the screen, not a tiny patch near the walker.
 // Compare actual pixels at a fixed simulation time with the switch off.
 for(const [width,height] of [[430,932],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const cb of await page.getByRole('checkbox').all())await cb.uncheck();
  await page.evaluate(()=>runway.seek(2));
  await page.evaluate(()=>{
   const c=document.querySelector('#scene');
   window.__sparkOff=c.getContext('2d').getImageData(0,0,c.width,c.height).data.slice();
  });
  await page.locator('[data-effect="sparks"]').check();
  const coverage=await page.evaluate(()=>{
   const c=document.querySelector('#scene'),now=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   const prior=window.__sparkOff;let minX=c.width,maxX=-1,minY=c.height,maxY=-1,hits=0;
   for(let y=0;y<c.height;y+=3)for(let x=0;x<c.width;x+=3){
    const p=(y*c.width+x)*4;
    if(Math.abs(now[p]-prior[p])+Math.abs(now[p+1]-prior[p+1])+Math.abs(now[p+2]-prior[p+2])>52){
     minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);hits++;
    }
   }
   delete window.__sparkOff;
   return {width:(maxX-minX)/c.width,height:(maxY-minY)/c.height,hits};
  });
  assert(coverage.hits>200,'Big sparks had too few visible pixels');
  assert(coverage.width>.70,'Big sparks do not span 70% of viewport width: '+JSON.stringify(coverage));
  assert(coverage.height>.48,'Big sparks do not span half of viewport height: '+JSON.stringify(coverage));
  await page.locator('[data-effect="sparks"]').uncheck();
 }
 for(const cb of await page.getByRole('checkbox').all())await cb.check();
 for(const t of [7.125,70.25]){
  await page.evaluate(t=>runway.seek(t),t);const a=await pixels(page);await page.evaluate(()=>runway.seek(0));await page.evaluate(t=>runway.seek(t),t);assert.equal(await pixels(page),a,'Seek history changed effects');
 }
 await page.getByRole('button',{name:'NEW DREAM'}).click();await page.evaluate(()=>runway.seek(10));const warm=await pixels(page);
 await page.locator('[data-effect="plants"]').uncheck();await page.locator('[data-effect="plants"]').check();assert.equal(await pixels(page),warm,'Reseed left stale geometry');
 const viewports=[[430,932,'phone'],[320,568,'small-phone'],[844,390,'landscape'],[1440,900,'desktop'],[2048,1000,'wide-desktop']];
 for(const [width,height,name] of viewports){
  await page.setViewportSize({width,height});await page.evaluate(()=>runway.seek(2));
  const box=await page.evaluate(()=>{const b=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}};return {fx:b('.effects'),controls:b('.controls'),commit:b('#build-commit'),edition:b('.edition'),card:b('#actcard'),labels:[...document.querySelectorAll('.effects label')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right}})}});
  assert(box.fx.y>height*.6);assert(box.fx.bottom<=box.controls.y-5);assert(box.card.bottom<box.fx.y);
  assert(box.labels.every(r=>r.x>=0&&r.right<=width));assert(box.commit.x>=0&&box.commit.right<=width,'HEAD clipped at '+width+'x'+height);assert(box.commit.right<box.edition.x||box.commit.bottom<box.edition.y||box.commit.y>box.edition.bottom,'HEAD overlaps edition at '+width+'x'+height);
  await page.mouse.move(width-1,0);await page.screenshot({path:path.join(RESULTS,'effects-'+name+'.png')});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 const report={head,baselineCommit:'95ebb572944ad91eccd1c824568296af8e17814a',originalMainPixelsPreserved:true,independentPixelChanges:true,keyboard:true,earlySporeSamples:spores,earlyPlantSamples:plants,maxPlantCache,largeSparkCoverage:true,sixIndependentSwitches:true,simulatedSeconds:180,viewports:viewports.map(v=>v[0]+'x'+v[1]),errors,networkRequests:requests,physicalPhoneTested:false};
 fs.writeFileSync(path.join(RESULTS,'effects.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
