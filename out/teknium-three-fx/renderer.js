// Three GLSL/Canvas studies: liquid glass, spectral smoke, pixel dissolve.
// All effects are bounded to their specimen and keyed solely by simulation time.
const threeFxRenderer=(()=>{
'use strict';
const VERTEX=`#version 300 es
precision highp float;
void main(){
 vec2 v=vec2(gl_VertexID==1?3.:-1.,gl_VertexID==2?3.:-1.);
 gl_Position=vec4(v,0.,1.);
}`;
const FRAGMENT=`#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uCenter;
uniform float uScale;
uniform vec4 uInfo; // kind, local age, envelope, facing direction
uniform vec4 uGenes; // phase, detail, distortion, seed
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
const float PI=3.141592653589793;
float hash21(vec2 p){
 p=fract(p*vec2(123.34,456.21));
 p+=dot(p,p+45.32);
 return fract(p.x*p.y);
}
float noise(vec2 x){
 vec2 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),
            mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.,1.)),f.x),f.y);
}
float fbm(vec2 p){
 float f=0.,w=.53;
 for(int i=0;i<4;i++){
  f+=w*noise(p);
  p=mat2(1.61,1.23,-1.23,1.61)*p+vec2(2.6,1.7);
  w*=.52;
 }
 return f;
}
float ell(vec2 p,vec2 r){
 float k0=length(p/r),k1=length(p/(r*r));
 return k0*(k0-1.)/max(.0001,k1);
}
float seg(vec2 p,vec2 a,vec2 b){
 vec2 v=b-a,q=p-a;
 return length(q-v*clamp(dot(q,v)/max(.00001,dot(v,v)),0.,1.));
}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float cross2(vec2 a,vec2 b){return a.x*b.y-a.y*b.x;}
float tri(vec2 p,vec2 a,vec2 b,vec2 c){
 float d=min(seg(p,a,b),min(seg(p,b,c),seg(p,c,a)));
 float x=cross2(b-a,p-a),y=cross2(c-b,p-b),z=cross2(a-c,p-c);
 bool inside=(x>=0.&&y>=0.&&z>=0.)||(x<=0.&&y<=0.&&z<=0.);
 return inside?-d:d;
}
vec3 tones(vec2 p,float t){
 vec2 a=vec2(fbm(p*2.1+vec2(t*.16,-t*.08)),
             fbm(p*2.1+vec2(14.7,-t*.17)));
 float n=fbm(p*4.0+(a-.5)*2.1+vec2(-t*.13,t*.22));
 float flow=sin((p.x+a.y*.24)*23.+(p.y-a.x*.16)*15.-t*2.1);
 float stripes=smoothstep(.84,.99,flow);
 vec3 c=mix(uA,uB,smoothstep(.22,.69,n));
 return mix(c,uC,stripes*.8+smoothstep(.58,.86,n)*.28);
}
float liquidShell(vec2 p){
 vec2 q=vec2(abs(p.x),p.y);
 float up=ell(rot(-.31)*(q-vec2(.47,.18)),vec2(.45,.31));
 float low=ell(rot(.22)*(q-vec2(.39,-.17)),vec2(.35,.25));
 float bell=ell(p-vec2(0.,-.045),vec2(.16,.48));
 return min(bell,min(up,low));
}
float tendrils(vec2 p,float t){
 float d=10.;
 for(int i=0;i<7;i++){
  float n=float(i),r=n/6.,x=(r-.5)*.42;
  vec2 previous=vec2(x,-.20);
  for(int j=1;j<=8;j++){
   float h=float(j)/8.;
   vec2 q=vec2(x+.13*h*h*sin(t*1.4+n*.8+h*6.),
     -.20-h*(.85+.22*sin(n*5.1)));
   d=min(d,seg(p,previous,q));
   previous=q;
  }
 }
 return d;
}
float stagShell(vec2 p){
 float flank=ell(p-vec2(-.16,-.17),vec2(.46,.31));
 float neck=ell(rot(-.34)*(p-vec2(.22,.04)),vec2(.23,.32));
 float head=ell(p-vec2(.43,.27),vec2(.24,.18));
 float nose=ell(p-vec2(.66,.18),vec2(.19,.095));
 float ears=tri(p,vec2(.26,.37),vec2(.31,.64),vec2(.45,.41));
 float legs=10.;
 for(int i=0;i<4;i++){
  float x=-.45+float(i)*.20;
  float stagger=float(i%2)*.04;
  legs=min(legs,seg(p,vec2(x,-.37),vec2(x+.045,-.77-stagger))-.036);
  legs=min(legs,seg(p,vec2(x+.045,-.77-stagger),vec2(x+.14,-.79-stagger))-.023);
 }
 float tail=tri(p,vec2(-.55,-.13),vec2(-.84,-.02),vec2(-.65,-.33));
 return min(min(min(flank,neck),min(head,nose)),min(min(ears,legs),tail));
}
float antlers(vec2 p){
 float d=10.;
 for(int i=0;i<2;i++){
  float side=float(i);
  vec2 a=vec2(.33+side*.19,.42);
  vec2 b=vec2(.25+side*.29,.76);
  vec2 c=vec2(.10+side*.52,1.02);
  d=min(d,seg(p,a,b));
  d=min(d,seg(p,b,c));
  d=min(d,seg(p,b,vec2(b.x+.24,b.y+.19)));
  d=min(d,seg(p,vec2(b.x+.02,b.y+.07),
                    vec2(b.x-.17,b.y+.24)));
  d=min(d,seg(p,c,vec2(c.x+.09,c.y+.16)));
 }
 return d;
}
float ravenShell(vec2 p){
 float body=ell(rot(-.2)*(p-vec2(-.03,-.15)),vec2(.29,.43));
 float chest=ell(p-vec2(.14,.09),vec2(.26,.27));
 float head=ell(p-vec2(.20,.33),vec2(.19,.20));
 float beak=tri(p,vec2(.32,.38),vec2(.73,.25),vec2(.34,.24));
 float topWing=ell(rot(.38)*(p-vec2(-.37,.09)),vec2(.47,.16));
 float downWing=ell(rot(-.50)*(p-vec2(-.43,-.15)),vec2(.36,.13));
 float tail=tri(p,vec2(-.13,-.40),vec2(-.50,-.87),vec2(.03,-.59));
 float feathers=10.;
 for(int i=0;i<4;i++){
  float h=float(i);
  feathers=min(feathers,seg(p,vec2(-.34-h*.1,.18-h*.08),
                       vec2(-.81+h*.04,.38-h*.17))-.045);
 }
 return min(min(body,min(chest,head)),min(min(beak,topWing),min(downWing,min(tail,feathers))));
}
void main(){
 float kind=uInfo.x,t=uInfo.y,visibility=uInfo.z;
 float facing=uInfo.w;
 vec2 p=(gl_FragCoord.xy-uCenter)/uScale;
 p.x*=facing;
 p.y-=.02*sin(t*.9+uGenes.x);
 float seed=uGenes.w,textureScale=uGenes.y,warp=uGenes.z;
 vec3 c=vec3(0.);
 float alpha=0.;
 if(kind<.5){
  // Liquid glass: thin refractive membrane, interference stripes and caustics.
  float wobble=(noise(p*7.+vec2(t*.23,-t*.13))- .5)*.027*warp;
  vec2 q=p+vec2(wobble,-wobble*.45);
  float d=liquidShell(q),strand=tendrils(q,t);
  float inside=1.-smoothstep(-.012,.034,d);
  float rim=exp(-abs(d)*25.);
  float line=exp(-strand*51.);
  vec2 flow=vec2(fbm(p*2.+vec2(0.,t*.2)),
                 fbm(p*2.+vec2(11.1,-t*.2)));
  float interference=pow(max(0.,sin((p.x+flow.y*.21)*34.
         +(p.y-flow.x*.27)*25.-t*2.7)),18.);
  float caustic=pow(max(0.,sin(p.x*47.+p.y*31.
                         +flow.x*17.-t*1.4)),22.);
  c=tones(p*textureScale,t)*(.45+.33*fbm(p*4.+flow));
  c+=uA*(rim*.84+line*.77);
  c+=uB*(rim*.46+interference*.76*inside);
  c+=uC*(caustic*1.05*inside+line*.23);
  alpha=inside*(.25+.23*interference)+rim*.60+line*.69;
  alpha+=exp(-abs(d)*6.)*.055;
 }else if(kind<1.5){
  // Volumetric spectral smoke outlines a readable antlered animal.
  vec2 scroll=p*vec2(2.3,2.8);
  vec2 curl=vec2(fbm(scroll+vec2(t*.24,-t*.14)),
                 fbm(scroll+vec2(19.,-t*.23)));
  vec2 q=p+(curl-.5)*(.095*warp);
  float shell=stagShell(q),horn=antlers(q);
  float noiseA=fbm(p*4.2+curl*.9+vec2(-t*.3,t*.21));
  float noiseB=fbm(p*7.5+vec2(t*.16,-t*.36));
  float stream=smoothstep(.33,.76,noiseA*.7+noiseB*.4);
  float broad=1.-smoothstep(-.25,.44,shell);
  float cloud=broad*(.14+stream*.59);
  float rim=exp(-abs(shell)*22.);
  float ant=exp(-horn*30.);
  float line=pow(max(0.,sin(p.y*37.+curl.x*16.-t*2.4)),19.);
  c=mix(uA,uB,noiseA)*(.32+.96*stream);
  c+=uC*(rim*.90+ant*1.27+line*cloud*.60);
  c+=uB*(exp(-abs(shell)*7.)*.15+ant*.19);
  alpha=cloud+rim*.58+ant*.93;
  // Smoke wisps escape the body rather than filling the entire stage.
  float tendril=exp(-max(shell,0.)*7.)*stream*.14;
  alpha+=tendril;
 }else{
  // Pixel dissolve: quantized mask, asynchronous block appearance and chromatic ghosts.
  float pix=.028+uGenes.y*.004;
  vec2 cell=floor(p/pix),q=(cell+.5)*pix;
  float shell=ravenShell(q);
  float r=hash21(cell+seed*121.37);
  float entrance=smoothstep(-.1,1.7,t);
  float exit=smoothstep(4.85,6.35,t);
  float stable=smoothstep(.94,.14,r);
  float buildup=smoothstep(.0,.7,entrance+.4-r);
  float departure=1.-smoothstep(.1,.9,exit+r*.7);
  float show=stable*buildup*departure;
  float body=1.-smoothstep(-.02,.07,shell);
  float edges=exp(-abs(shell)*20.);
  float grid=step(.13,fract(p.x/pix))*step(.13,fract(p.y/pix));
  float glitch=hash21(cell+vec2(floor(t*10.),seed*7.));
  vec3 base=mix(uA,uB,smoothstep(.25,.8,glitch));
  c=base*(.55+glitch*.42)+uC*(edges*.65+glitch*.25);
  alpha=body*show*grid*.94+edges*show*.40;
  // A bounded cloud of scattered pixels peels off the silhouette.
  vec2 shifted=q-vec2((glitch-.5)*(.25+.22*exit), 
                         (r-.5)*(.13+.25*exit));
  float debris=(1.-smoothstep(-.02,.08,ravenShell(shifted)))
     *(1.-body)*step(.85,r)*grid;
  c+=uC*debris*1.2;
  alpha+=debris*.44;
 }
 alpha=clamp(alpha*visibility,0.,1.);
 if(alpha<.004)discard;
 c=1.-exp(-max(c,0.)*1.15);
 fragColor=vec4(c*alpha,alpha);
}
`;
function smooth(x){
 x=Math.max(0,Math.min(1,x));
 return x*x*(3-2*x);
}
function compile(gl,kind,source){
 const s=gl.createShader(kind);
 gl.shaderSource(s,source);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
  const err=gl.getShaderInfoLog(s);gl.deleteShader(s);
  throw new Error(err);
 }
 return s;
}
function create(canvas,fallbackCanvas){
 let gl=null,program=null,uniform={},error='',mode='webgl2',width=1,height=1,dpr=1;
 const names=['uCenter','uScale','uInfo','uGenes','uA','uB','uC'];
 const ctx=fallbackCanvas.getContext('2d');
 function fallback(reason){
  error=String(reason);mode='canvas2d';
  canvas.style.display='none';fallbackCanvas.style.display='block';
 }
 try{
  gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,
    antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
  if(!gl)throw Error('WebGL2 unavailable');
  let vs=compile(gl,gl.VERTEX_SHADER,VERTEX);
  let fs=compile(gl,gl.FRAGMENT_SHADER,FRAGMENT);
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);
  gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  uniform=Object.fromEntries(names.map(x=>[x,gl.getUniformLocation(program,x)]));
  gl.useProgram(program);
  gl.clearColor(0,0,0,0);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);
 }catch(e){fallback(e);}
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('WebGL context lost');});
 function resize(w,h,d){
  width=w;height=h;dpr=Math.min(d||1,1.4);
  for(const c of [canvas,fallbackCanvas]){
   const cw=Math.max(1,Math.round(w*dpr)),ch=Math.max(1,Math.round(h*dpr));
   if(c.width!==cw||c.height!==ch){c.width=cw;c.height=ch;}
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(mode==='webgl2')gl.viewport(0,0,canvas.width,canvas.height);
 }
 function placement(s,age){
  const left=s.side<0;
  const targetX=width*(left?s.position:1-s.position);
  const enter=smooth(age/.82),leave=smooth((age-s.duration+1.08)/.9);
  const fromX=width*(left?-.33:1.33);
  let x=fromX*(1-enter)+targetX*enter;
  x=x*(1-leave)+fromX*leave;
  let y=height*s.altitude+Math.sin(age*.85+s.phase)*height*.01;
  const scale=Math.min(width*.305,height*.24,200)*s.size;
  return {x,y,scale};
 }
 function silhouette(ctx,s,t,v){
  const scale=v.scale;ctx.save();ctx.translate(v.x,v.y);ctx.scale(scale,scale);
  ctx.scale(s.side<0?1:-1,1);
  const pal=s.palette.map(v=>'rgb('+v.map(c=>Math.round(c*255)).join(',')+')');
  const mix=ctx.createLinearGradient(-1,-1,1,1);
  pal.forEach((c,i)=>mix.addColorStop(i/2,c));
  ctx.shadowColor=pal[0];ctx.shadowBlur=18;
  ctx.strokeStyle=mix;ctx.fillStyle='rgba(115,80,165,.20)';
  ctx.lineWidth=.018;
  const oval=(x,y,rx,ry,a=0)=>{
   ctx.beginPath();ctx.ellipse(x,-y,rx,ry,-a,0,Math.PI*2);ctx.fill();ctx.stroke();
  };
  if(s.type===0){
   oval(0,0,.16,.48);
   for(let side of [-1,1]){
    oval(side*.47,.18,.45,.31,side*.3);
    oval(side*.39,-.17,.35,.25,-side*.2);
   }
   for(let i=0;i<7;i++){
    const x=(i/6-.5)*.42;ctx.beginPath();ctx.moveTo(x,.2);
    ctx.bezierCurveTo(x+.08,.5,x+Math.sin(t+i)*.16,.9,x+Math.sin(t+i)*.22,1.24);
    ctx.stroke();
   }
  }else if(s.type===1){
   oval(-.16,-.17,.46,.31);oval(.22,.04,.23,.32,-.35);
   oval(.43,.27,.24,.18);oval(.66,.18,.19,.095);
   for(let x of [-.40,-.21,0,.17]){
    ctx.beginPath();ctx.moveTo(x,.37);ctx.lineTo(x+.06,.79);ctx.stroke();
   }
   for(let i=0;i<2;i++){
    const x=.34+i*.20;ctx.beginPath();ctx.moveTo(x,-.4);
    ctx.lineTo(x-.1,-.79);ctx.lineTo(x-.24,-1.05);
    ctx.moveTo(x-.1,-.79);ctx.lineTo(x+.18,-.93);ctx.stroke();
   }
  }else{
   oval(0,-.15,.29,.43,-.2);oval(.19,.32,.19,.2);
   oval(-.35,.10,.46,.17,.38);
   ctx.beginPath();ctx.moveTo(.31,-.38);ctx.lineTo(.71,-.25);
   ctx.lineTo(.33,-.23);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.moveTo(-.08,.38);ctx.lineTo(-.4,.86);
   ctx.lineTo(.02,.59);ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.restore();
 }
 function draw(state,time){
  if(mode==='canvas2d'){
   ctx.clearRect(0,0,width,height);
   if(!state.active)return;
   const s=state.spec,v=placement(s,state.age);
   ctx.save();ctx.globalAlpha=smooth(state.age/.5)*smooth((s.duration-state.age)/.8);
   silhouette(ctx,s,time,v);ctx.restore();return;
  }
  gl.disable(gl.SCISSOR_TEST);gl.clear(gl.COLOR_BUFFER_BIT);
  if(!state.active)return;
  const s=state.spec,age=state.age,v=placement(s,age);
  const env=smooth(age/.6)*smooth((s.duration-age)/.72);
  const sc=v.scale*dpr,cx=v.x*dpr,cy=(height-v.y)*dpr;
  const marginX=2.2*sc,marginY=2.0*sc;
  const x0=Math.max(0,Math.floor(cx-marginX)),y0=Math.max(0,Math.floor(cy-marginY));
  const x1=Math.min(canvas.width,Math.ceil(cx+marginX));
  const y1=Math.min(canvas.height,Math.ceil(cy+marginY));
  if(x1<=x0||y1<=y0)return;
  gl.enable(gl.SCISSOR_TEST);gl.scissor(x0,y0,x1-x0,y1-y0);
  gl.useProgram(program);
  gl.uniform2f(uniform.uCenter,cx,cy);gl.uniform1f(uniform.uScale,sc);
  gl.uniform4f(uniform.uInfo,s.type,age,env,s.side<0?1:-1);
  gl.uniform4f(uniform.uGenes,s.phase,s.detail,s.distortion,(s.id%65521)/65521);
  gl.uniform3fv(uniform.uA,s.palette[0]);
  gl.uniform3fv(uniform.uB,s.palette[1]);
  gl.uniform3fv(uniform.uC,s.palette[2]);
  gl.drawArrays(gl.TRIANGLES,0,3);
  gl.disable(gl.SCISSOR_TEST);
 }
 return {draw,resize,placement,get backend(){return mode;},
         get fallbackReason(){return error;}};
}
return {create};
})();
