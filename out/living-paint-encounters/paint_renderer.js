// Single-pass WebGL2 living pigment. No creature sprites, network, or raster textures.
// The fragment shader shades only a bounded rectangle around the sole active organism.
const livingPaint = (() => {
  'use strict';
  const VERTEX = `#version 300 es
  precision highp float;
  void main() {
    vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0,
                  gl_VertexID == 2 ? 3.0 : -1.0);
    gl_Position = vec4(p, 0.0, 1.0);
  }`;
  const FRAGMENT = `#version 300 es
  precision highp float;
  out vec4 fragColor;
  uniform vec2 uCenter;
  uniform float uScale;
  uniform vec4 uBody;   // topology, width, height, asymmetry
  uniform vec4 uAppend; // structural module, count, length, fin angle
  uniform vec4 uMarks;  // eyes, petals, twirl, texture
  uniform vec4 uMotion; // behavior, phase, localTime, envelope
  uniform vec4 uAux;    // skin frequency, glow, genome seed, 12 Hz boil phase
  uniform vec3 uColor0;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  const float PI = 3.141592653589793;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float noise(vec2 x) {
    vec2 i = floor(x), f = fract(x);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash12(i),hash12(i+vec2(1.,0.)),u.x),
               mix(hash12(i+vec2(0.,1.)),hash12(i+vec2(1.,1.)),u.x),u.y);
  }
  float fbm(vec2 x) {
    float value=0., gain=.5;
    mat2 warp=mat2(1.6,1.2,-1.2,1.6);
    for(int i=0;i<4;i++) {
      value += gain*noise(x);
      x=warp*x+vec2(1.7,2.3);
      gain*=.5;
    }
    return value;
  }
  float ellipse(vec2 p,vec2 r) {
    float k0=length(p/r), k1=max(.0001,length(p/(r*r)));
    return k0*(k0-1.)/k1;
  }
  float segment(vec2 p,vec2 a,vec2 b) {
    vec2 q=p-a, v=b-a;
    float h=clamp(dot(q,v)/max(dot(v,v),.00001),0.,1.);
    return length(q-v*h);
  }
  mat2 rotate(float a) {
    float c=cos(a),s=sin(a);
    return mat2(c,s,-s,c);
  }
  float bodyDistance(vec2 p) {
    float w=uBody.y, h=uBody.z;
    float mode=uBody.x;
    float time=uMotion.z, phase=uMotion.y;
    float expressivePulse=(uMotion.x>.5&&uMotion.x<1.5)?.14*sin(time*3.8+phase):0.;
    float pulse=1.0+.038*sin(time*2.15+phase)+expressivePulse;
    vec2 q=p/vec2(w,h*pulse);
    if(mode<.5) {
      // A jelly-like domed creature with an open, rippling underside.
      float d=ellipse(q-vec2(0.,.045),vec2(.44,.30));
      return max(d,-(q.y+.087));
    }
    if(mode<1.5) {
      // A pulsing orb, not an icon with a static circle.
      float r=length(q), a=atan(q.y,q.x);
      return r-(.365+.020*sin(a*uMarks.y+time*.8));
    }
    if(mode<2.5) {
      // One continuous torso-neck-muzzle silhouette for mammalian variants.
      float torso=ellipse(q+vec2(.13,.10),vec2(.43,.22));
      float neck=ellipse(q-vec2(.26,.075),vec2(.22,.19));
      float muzzle=ellipse(q-vec2(.40,.035),vec2(.17,.095));
      return min(torso,min(neck,muzzle));
    }
    if(mode<3.5) {
      // Growing petal-shaped perimeter.
      float a=atan(q.y,q.x), r=length(q);
      return r-(.34+.08*cos(a*uMarks.y+phase)*(.87+.13*sin(time*1.6)));
    }
    if(mode<4.5) {
      // Tapered vertical spindle.
      vec2 r=q-vec2(0.,.02);
      r.x*=1.0+.36*r.y;
      return ellipse(r,vec2(.30,.49));
    }
    // Wide mask with a narrowing chin.
    vec2 r=q;
    r.x*=1.0+.40*max(0.,-r.y-.05);
    return ellipse(r,vec2(.40,.36));
  }
  float appendageDistance(vec2 p, float t) {
    int module=int(uAppend.x+.5);
    int count=int(uAppend.y+.5);
    float L=uAppend.z, bend=uAppend.w, seed=uAux.z;
    float closest=10.0;
    if(module==1) {
      // Two curved wings with separate upper and lower lobes.
      for(int wing=0;wing<2;wing++) {
        float side=wing==0?-1.:1.;
        float flap=.14*sin(t*4.2+uMotion.y+float(wing)*.2);
        vec2 q=rotate(side*(-.25-flap))*(p-vec2(side*.56,.11));
        closest=min(closest,ellipse(q,vec2(.45*L,.18+.06*bend)));
        vec2 r=rotate(side*(.34+flap))*(p-vec2(side*.38,-.09));
        closest=min(closest,ellipse(r,vec2(.27*L,.12)));
      }
      return closest;
    }
    if(module==3) {
      // Radiating fins/petals of variable count.
      for(int i=0;i<8;i++) {
        if(i>=count)break;
        float a=float(i)/float(count)*2.0*PI+uMotion.y;
        a+=.08*sin(t*1.7+float(i)*1.3);
        vec2 q=rotate(-a)*p-vec2(.47*L,0.);
        closest=min(closest,ellipse(q,vec2(.32*L,.085+.055*bend)));
      }
      return closest;
    }
    for(int i=0;i<8;i++) {
      if(i>=count)break;
      float fi=float(i), n=max(1.,float(count-1));
      float pair=fi/n*2.-1.;
      float speed=1.2+.22*fi;
      vec2 prev=vec2(0.);
      float chainLength=L*(.64+.36*hash12(vec2(fi,seed*90.)));
      for(int j=0;j<10;j++) {
        float v=float(j)/9.;
        vec2 cur=vec2(0.);
        if(module==0) {
          cur=vec2(pair*.32+v*v*.12*sin(t*speed+fi*1.3+v*5.),
                   -.09-chainLength*v);
        } else if(module==2) {
          float rootX=pair*.31-.07;
          if(v<.51) {
            cur=vec2(rootX+pair*.05*(v/.51),-.07-.30*(v/.51));
          } else {
            float k=(v-.51)/.49;
            cur=vec2(rootX+pair*.05+pair*(.09+.06*sin(t*2.5+fi))*k,
                     -.37-chainLength*.37*k);
          }
        } else if(module==4) {
          cur=vec2(pair*.22+pair*(.13+.18*bend)*v+
                   .055*v*sin(t+fi*1.7+v*4.),
                   .15+chainLength*v*.86);
        } else {
          cur=vec2(pair*.25+chainLength*v*pair*.55+
                   .17*v*sin(v*8.+t*1.65+fi*2.),
                   -.10-chainLength*v*.65+
                   .09*v*sin(v*6.2-t+fi*1.4));
        }
        if(j>0)closest=min(closest,segment(p,prev,cur));
        prev=cur;
      }
    }
    return closest;
  }
  float eyePattern(vec2 p) {
    int eyes=int(uMarks.x+.5);
    if(eyes==0)return 0.;
    float result=0.;
    float blink=abs(sin(uMotion.z*.65+uMotion.y*1.3));
    float eyeH=mix(.010,.029,smoothstep(.13,.35,blink));
    for(int i=0;i<3;i++){
      if(i>=eyes)break;
      float x=(float(i)-(float(eyes)-1.)*.5)*.19;
      float mammal=(uBody.x>1.5 && uBody.x<2.5)?1.:0.;
      vec2 q=p-vec2(x+.18*mammal,mix(.075,.15,mammal));
      float d=ellipse(q,vec2(.027,eyeH));
      result=max(result,exp(-abs(d)*95.));
    }
    return result;
  }
  void main() {
    vec2 p=(gl_FragCoord.xy-uCenter)/uScale;
    float t=uMotion.z;
    p.x+=.012*sin(t*1.8+p.y*4.1+uMotion.y);
    p.y+=.011*cos(t*1.3+uMotion.y);
    // Hand-drawn irregularity updates at 12 Hz; movement is smooth.
    float boil=hash12(vec2(floor(uAux.w),uAux.z*137.))-0.5;
    vec2 q=p+vec2(boil*.007,boil*.004);
    float contourFlow=(noise(q*vec2(13.,17.)+vec2(t*.31,-t*.19))-.5)*.016;
    float core=bodyDistance(q)+contourFlow;
    float limbs=appendageDistance(q,t)+contourFlow*.18;
    float body=1.0-smoothstep(-.020,.018,core);
    float membrane=1.0-smoothstep(-.018,.025,limbs);
    float coreRim=exp(-abs(core)*36.0);
    float appendRim=exp(-abs(limbs)*43.0);
    float softGlow=exp(-abs(core)*9.0)*.30 + exp(-abs(limbs)*8.0)*.23;
    float coverage=max(body,membrane);
    float alpha=clamp(coverage*.87+coreRim*.34+appendRim*.50+softGlow*.45,0.,.99);
    alpha*=uMotion.w;
    if(alpha<.002)discard;
    // Dynamic domain-warped fBm pigment: color streams inside stable anatomy.
    vec2 moving=p*uAux.x*3.4;
    vec2 flow=vec2(fbm(moving+vec2(0.,t*.19)),
                   fbm(moving+vec2(19.4,-t*.14)));
    vec2 warped=moving+flow*.88;
    float n=fbm(warped*1.8+vec2(t*.13,-t*.19));
    float m=fbm(warped*3.7+vec2(-t*.25,t*.08));
    float pigment=clamp(n*.52+m*.48,0.,1.);
    vec3 paint=mix(uColor0,uColor1,smoothstep(.20,.71,pigment));
    paint=mix(paint,uColor2,smoothstep(.48,.91,pigment+m*.17)*.65);
    float filaments=pow(max(0.,sin((p.y+flow.x*.33)*34.*uMarks.w+
                  (p.x-flow.y*.27)*22.-t*2.3)),19.);
    float electricA=pow(max(0.,sin(warped.x*23.+warped.y*9.-t*1.5)),22.);
    float electricB=pow(max(0.,cos(warped.y*27.-warped.x*13.+t*1.9)),23.);
    float tinyVeins=pow(max(0.,sin(atan(p.y,p.x)*uMarks.y+
                                   length(p)*31.-t*.7+flow.y*4.)),19.);
    float inner=(filaments*.72+tinyVeins*.32)*body;
    vec3 glowColor=mix(uColor0,uColor2,.55+.4*sin(t*.45+uMotion.y));
    vec3 result=paint*(.70+.85*n)*(body*.95+membrane*.62);
    result+=glowColor*(coreRim*1.0+appendRim*.98)*uAux.y;
    result+=mix(uColor1,uColor2,.52)*(softGlow*.92)*uAux.y;
    // Three independent pigment filaments swirl across the interior.
    result+=body*(uColor0*electricA+uColor1*electricB+uColor2*filaments)*1.28;
    result+=vec3(1.,.91,1.)*inner*.35;
    float eyes=eyePattern(p)*body;
    result+=mix(uColor2,vec3(1.),.55)*eyes*.9;
    result=1.0-exp(-result*1.45);
    fragColor=vec4(result*alpha,alpha);
  }`;

  function compile(gl, kind, source) {
    const shader=gl.createShader(kind);
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
      const error=gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw Error('Living paint shader compile error: '+error);
    }
    return shader;
  }
  const smooth = v => {
    const x=Math.max(0,Math.min(1,v));
    return x*x*(3-2*x);
  };

  function create(glCanvas,fallbackCanvas){
    let gl=null,program=null,uniforms={},failed=false,reason='';
    const fallbackCtx=fallbackCanvas.getContext('2d');
    const names=['uCenter','uScale','uBody','uAppend','uMarks','uMotion',
                 'uAux','uColor0','uColor1','uColor2'];
    function enableFallback(error){
      failed=true;reason=String(error||'WebGL2 unavailable');
      glCanvas.style.display='none';fallbackCanvas.style.display='block';
    }
    try {
      gl=glCanvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,
               antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
      if(!gl)throw Error('WebGL2 not supported');
      const vs=compile(gl,gl.VERTEX_SHADER,VERTEX);
      const fs=compile(gl,gl.FRAGMENT_SHADER,FRAGMENT);
      program=gl.createProgram();
      gl.attachShader(program,vs);gl.attachShader(program,fs);
      gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))
        throw Error('Living paint link error: '+gl.getProgramInfoLog(program));
      uniforms=Object.fromEntries(names.map(name=>[name,gl.getUniformLocation(program,name)]));
      gl.useProgram(program);gl.clearColor(0,0,0,0);
      gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
    }catch(error){enableFallback(error);}
    glCanvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();enableFallback('WebGL2 context lost');
    });

    let width=0,height=0,dpr=1;
    function resize(w,h,pixelRatio){
      width=w;height=h;dpr=Math.min(pixelRatio||1,1.35);
      const ww=Math.max(1,Math.floor(w*dpr)),hh=Math.max(1,Math.floor(h*dpr));
      for(const canvas of [glCanvas,fallbackCanvas]){
        if(canvas.width!==ww||canvas.height!==hh){canvas.width=ww;canvas.height=hh;}
      }
      if(!failed)gl.viewport(0,0,ww,hh);
      fallbackCtx.setTransform(dpr,0,0,dpr,0,0);
    }
    function layout(spec,elapsed){
      const left=spec.side<0;
      const startX=(left?-.25:1.25)*width;
      const restX=width*(left?spec.distance:1-spec.distance);
      const entrance=smooth(elapsed/.85);
      const departure=smooth((elapsed-spec.duration+1.03)/1.03);
      const exitX=(left?-.25:1.25)*width;
      let x=(startX*(1-entrance)+restX*entrance)*(1-departure)+exitX*departure;
      let y=height*spec.altitude+
            Math.sin(elapsed*1.25+spec.genes.animationPhase)*6;
      let scale=Math.min(width*.285,height*.175,158)*spec.size;
      // Distinct gestures use a common skeletal grammar and remain one event.
      const phrase=smooth((elapsed-.8)/1.3)*smooth((spec.duration-elapsed-.95)/1.1);
      switch(spec.behavior){
        case 0: // hover
          y+=Math.sin(elapsed*2.3+spec.genes.animationPhase)*9;
          break;
        case 1: // rhythmic breathing
          scale*=1+.085*Math.sin(elapsed*3.6+spec.genes.animationPhase);
          break;
        case 2: // look toward the walker
          x+=spec.side*14*phrase;
          break;
        case 3: // unfurl from a smaller form
          scale*=.76+.29*smooth(elapsed/2.2);
          break;
        case 4: // retreat from the model
          x-=spec.side*20*phrase;
          break;
        case 5: // imitate the cadence of her steps
          y+=Math.sin(elapsed*Math.PI*2*24/33)*11*phrase;
          break;
      }
      return {x,y,scale};
    }
    function fallbackDraw(state,time){
      const ctx=fallbackCtx;
      ctx.clearRect(0,0,width,height);
      if(!state.active)return;
      const s=state.spec,elapsed=state.elapsed;
      const env=smooth(elapsed/.7)*smooth((s.duration-elapsed)/.85);
      const v=layout(s,elapsed),g=s.genes;
      ctx.save();ctx.globalAlpha=env;ctx.translate(v.x,v.y);
      ctx.scale(v.scale,v.scale);ctx.lineCap='round';
      const color=s.palette[0].map(x=>Math.round(x*255));
      ctx.shadowColor='rgb('+color.join(',')+')';ctx.shadowBlur=14;
      ctx.fillStyle='rgba('+color.join(',')+',0.2)';
      ctx.strokeStyle='rgb('+color.join(',')+')';ctx.lineWidth=.025;
      ctx.beginPath();ctx.ellipse(0,0,.38*g.bodyWidth,.29*g.bodyHeight,0,0,Math.PI*2);
      ctx.fill();ctx.stroke();
      for(let i=0;i<g.count;i++){
        const x=(i/Math.max(1,g.count-1)-.5)*.54;
        ctx.beginPath();ctx.moveTo(x,-.14);
        ctx.bezierCurveTo(x+.08,-.40,x+Math.sin(time+i)*.15,-.8*g.appendLength,
                          x+Math.sin(time+i)*.23,-g.appendLength);ctx.stroke();
      }
      ctx.restore();
    }
    function render(state,time){
      if(failed){fallbackDraw(state,time);return;}
      gl.clear(gl.COLOR_BUFFER_BIT);
      if(!state.active)return;
      const s=state.spec,g=s.genes,v=layout(s,state.elapsed),life=state.elapsed;
      const alpha=smooth(life/.7)*smooth((s.duration-life)/.85);
      const px=v.x*dpr,py=(height-v.y)*dpr,scale=v.scale*dpr;
      const marginX=2.55*scale,marginY=2.65*scale;
      const x0=Math.max(0,Math.floor(px-marginX));
      const y0=Math.max(0,Math.floor(py-marginY));
      const x1=Math.min(glCanvas.width,Math.ceil(px+marginX));
      const y1=Math.min(glCanvas.height,Math.ceil(py+marginY));
      if(x1<=x0||y1<=y0)return;
      gl.enable(gl.SCISSOR_TEST);gl.scissor(x0,y0,x1-x0,y1-y0);
      gl.useProgram(program);
      gl.uniform2f(uniforms.uCenter,px,py);
      gl.uniform1f(uniforms.uScale,scale);
      gl.uniform4f(uniforms.uBody,g.topology,g.bodyWidth,g.bodyHeight,g.asymmetry);
      gl.uniform4f(uniforms.uAppend,g.appendage,g.count,g.appendLength,g.finAngle);
      gl.uniform4f(uniforms.uMarks,g.eyeMode,g.petalCount,g.twirl,g.textureDensity);
      gl.uniform4f(uniforms.uMotion,s.behavior,g.animationPhase,life,alpha);
      gl.uniform4f(uniforms.uAux,g.skinFrequency,g.glowStrength,
                   (s.genomeSeed%104729)/104729,Math.floor(time*12));
      gl.uniform3fv(uniforms.uColor0,s.palette[0]);
      gl.uniform3fv(uniforms.uColor1,s.palette[1]);
      gl.uniform3fv(uniforms.uColor2,s.palette[2]);
      gl.drawArrays(gl.TRIANGLES,0,3);
      gl.disable(gl.SCISSOR_TEST);
    }
    return {resize,render,get backend(){return failed?'canvas2d':'webgl2';},
            get fallbackReason(){return reason;}};
  }
  return {create};
})();
