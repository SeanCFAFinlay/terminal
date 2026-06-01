(function(){
  // ── Supabase config ──────────────────────────────────────────────
  // Credentials loaded from supabase-config.js (gitignored).
  // Copy supabase-config.example.js to supabase-config.js and set your values.
  var SUPABASE_URL = window.TERMINAL_SUPABASE_URL || 'YOUR_SUPABASE_URL';
  var SUPABASE_ANON_KEY = window.TERMINAL_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
  var supabase = null;
  if (typeof window.supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  document.getElementById('yr').textContent=new Date().getFullYear();

  var pr=document.getElementById('progress');
  var progTicking=false;
  function prog(){var h=document.documentElement;var sc=h.scrollTop||document.body.scrollTop;var mx=h.scrollHeight-h.clientHeight;pr.style.width=(mx>0?(sc/mx*100):0)+'%';progTicking=false;}
  window.addEventListener('scroll',function(){if(!progTicking){requestAnimationFrame(prog);progTicking=true;}},{passive:true});prog();

  var mb=document.getElementById('menuBtn'),mm=document.getElementById('mobileMenu');
  mb.addEventListener('click',function(){
    var isOpen=mm.classList.toggle('open');
    mm.setAttribute('aria-hidden',!isOpen);
  });
  mm.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){
    mm.classList.remove('open');
    mm.setAttribute('aria-hidden','true');
  });});

  document.querySelectorAll('.qa-i button').forEach(function(b){
    b.setAttribute('aria-expanded','false');
    b.addEventListener('click',function(){
      var qa=b.parentElement,ans=qa.querySelector('.ans'),open=qa.classList.contains('open');
      document.querySelectorAll('.qa-i').forEach(function(o){
        o.classList.remove('open');
        o.querySelector('.ans').style.maxHeight=null;
        o.querySelector('button').setAttribute('aria-expanded','false');
      });
      if(!open){qa.classList.add('open');ans.style.maxHeight=ans.scrollHeight+'px';b.setAttribute('aria-expanded','true');}
    });
  });

  var jb=document.getElementById('joinBtn'),em=document.getElementById('email'),cf=document.getElementById('confirm');
  var fe=document.getElementById('formError');
  var submitting=false;

  jb.addEventListener('click',function(){
    if(submitting) return;
    var v=(em.value||'').trim();

    // Reset states
    cf.style.display='none';
    fe.style.display='none';
    fe.textContent='';
    em.style.borderColor='';

    // Validate email format
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){
      em.focus();
      em.style.borderColor='var(--gold)';
      fe.textContent='Please enter a valid email address.';
      fe.style.display='block';
      return;
    }

    // If Supabase isn't configured, fall back to client-side confirmation
    if(!supabase){
      cf.style.display='block';
      em.value='';
      em.placeholder='Subscribed';
      return;
    }

    // Submit to Supabase
    submitting=true;
    jb.style.opacity='0.6';
    jb.style.pointerEvents='none';

    supabase.from('subscribers').insert({email:v}).then(function(res){
      if(res.error){
        // Unique constraint violation = duplicate email
        if(res.error.code==='23505'){
          fe.textContent="You're already on the list.";
          fe.style.display='block';
        } else {
          fe.textContent='Something went wrong. Please try again.';
          fe.style.display='block';
        }
      } else {
        cf.style.display='block';
        em.value='';
        em.placeholder='Subscribed';
      }

      // 5-second cooldown to prevent spam
      setTimeout(function(){
        submitting=false;
        jb.style.opacity='';
        jb.style.pointerEvents='';
      },5000);
    });
  });

  // ── Reactor particle canvas ─────────────────────────────────────
  var canvas=document.getElementById('reactorCanvas');
  if(canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var ctx=canvas.getContext('2d');
    var particles=[];
    var MAX_PARTICLES=30;
    var animId=null;

    function resizeCanvas(){
      var rect=canvas.parentElement.getBoundingClientRect();
      canvas.width=rect.width;
      canvas.height=rect.height;
    }
    resizeCanvas();
    window.addEventListener('resize',resizeCanvas);

    function createParticle(){
      var cx=canvas.width/2, cy=canvas.height/2;
      var angle=Math.random()*Math.PI*2;
      var radius=60+Math.random()*140;
      return {
        x:cx+Math.cos(angle)*radius,
        y:cy+Math.sin(angle)*radius,
        vx:(Math.random()-0.5)*0.3,
        vy:(Math.random()-0.5)*0.3,
        life:0,
        maxLife:120+Math.random()*180,
        size:1+Math.random()*2,
        alpha:0
      };
    }

    for(var p=0;p<MAX_PARTICLES;p++) particles.push(createParticle());

    function drawParticles(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(var i=0;i<particles.length;i++){
        var pt=particles[i];
        pt.x+=pt.vx;
        pt.y+=pt.vy;
        pt.life++;
        var progress=pt.life/pt.maxLife;
        pt.alpha=progress<0.3?progress/0.3:progress>0.7?(1-progress)/0.3:1;
        pt.alpha*=0.8;
        if(pt.life>=pt.maxLife) particles[i]=createParticle();
        ctx.beginPath();
        ctx.arc(pt.x,pt.y,pt.size,0,Math.PI*2);
        ctx.fillStyle='rgba(91,221,142,'+pt.alpha+')';
        ctx.fill();
      }
      animId=requestAnimationFrame(drawParticles);
    }

    // Lazy-init: only run when hero is visible
    var heroEl=document.querySelector('.hero');
    var particleObs=new IntersectionObserver(function(entries){
      if(entries[0].isIntersecting){
        if(!animId) drawParticles();
      } else {
        if(animId){cancelAnimationFrame(animId);animId=null;}
      }
    },{threshold:0.05});
    if(heroEl) particleObs.observe(heroEl);
  }

  // ── Staggered reveals ───────────────────────────────────────────
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){var el=e.target;setTimeout(function(){el.classList.add('in');},(el.dataset.d||0)*1);io.unobserve(el);}});
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el,i){
    var parent=el.parentElement;
    var siblings=parent?parent.querySelectorAll(':scope > .reveal'):[];
    var idx=Array.prototype.indexOf.call(siblings,el);
    el.dataset.d=(idx>=0?idx:i%4)*80;
    io.observe(el);
  });

  // Reactor is stationary — no parallax, stays fixed behind hero

  // ── Enhanced chart with bezier curves, gradient, and tooltip ──
  var data=[10000,10080,10210,10150,10320,10410,10290,10380,10560,10720,10650,10810,10930,10870,11040,11180,11260,11190,11350,11480];
  var W=600,H=210,pl=44,prr=14,pt=16,pb=26,n=data.length;
  var mn=Math.min.apply(null,data),mx=Math.max.apply(null,data),rng=mx-mn||1;
  var iw=W-pl-prr,ih=H-pt-pb;
  function X(i){return pl+i*iw/(n-1);}
  function Y(v){return pt+(1-(v-mn)/rng)*ih;}

  // Catmull-Rom to cubic bezier
  function catmullRomToBezier(pts){
    var d='M'+pts[0].x.toFixed(1)+' '+pts[0].y.toFixed(1);
    for(var i=0;i<pts.length-1;i++){
      var p0=pts[Math.max(i-1,0)];
      var p1=pts[i];
      var p2=pts[i+1];
      var p3=pts[Math.min(i+2,pts.length-1)];
      var cp1x=p1.x+(p2.x-p0.x)/6;
      var cp1y=p1.y+(p2.y-p0.y)/6;
      var cp2x=p2.x-(p3.x-p1.x)/6;
      var cp2y=p2.y-(p3.y-p1.y)/6;
      d+=' C'+cp1x.toFixed(1)+','+cp1y.toFixed(1)+' '+cp2x.toFixed(1)+','+cp2y.toFixed(1)+' '+p2.x.toFixed(1)+','+p2.y.toFixed(1);
    }
    return d;
  }

  var pts=[];
  for(var i=0;i<n;i++) pts.push({x:X(i),y:Y(data[i])});
  var curvePath=catmullRomToBezier(pts);
  var areaPath=curvePath+' L'+X(n-1).toFixed(1)+','+(pt+ih).toFixed(1)+' L'+X(0).toFixed(1)+','+(pt+ih).toFixed(1)+' Z';

  var grid='',lab='';
  for(var g=0;g<=3;g++){var gy=(pt+g*ih/3).toFixed(1);var gv=Math.round(mx-g*rng/3);grid+='<line class="grid" x1="'+pl+'" y1="'+gy+'" x2="'+(W-prr)+'" y2="'+gy+'" stroke-width="1"/>';lab+='<text class="axis" x="'+(pl-8)+'" y="'+(parseFloat(gy)+3)+'" text-anchor="end">$'+(gv/1000)+'k</text>';}
  var xl='';[0,9,19].forEach(function(i){xl+='<text class="axis" x="'+X(i).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle">W'+(i+1)+'</text>';});

  // Data point circles for tooltip hover targets
  var dots='';
  for(var i=0;i<n;i++){
    dots+='<circle class="chart-dot" cx="'+X(i).toFixed(1)+'" cy="'+Y(data[i]).toFixed(1)+'" r="8" data-week="'+(i+1)+'" data-value="'+data[i]+'"/>';
  }

  var svg='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Illustrative system record rising over 20 weeks">'+
    '<defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(91,221,142,0.25)"/><stop offset="100%" stop-color="rgba(91,221,142,0)"/></linearGradient></defs>'+
    grid+
    '<path d="'+areaPath+'" fill="url(#chartGrad)" stroke="none"/>'+
    '<path id="ln" d="'+curvePath+'" fill="none" stroke="#5BDD8E" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 5px rgba(91,221,142,.65))"/>'+
    '<circle cx="'+X(n-1).toFixed(1)+'" cy="'+Y(data[n-1]).toFixed(1)+'" r="3.6" fill="#E6FFEF"/>'+
    dots+lab+xl+'</svg>';

  var holder=document.getElementById('chart');holder.innerHTML=svg;

  // Tooltip interaction
  var tooltip=document.getElementById('chartTooltip');
  if(tooltip){
    holder.addEventListener('mouseover',function(e){
      var dot=e.target.closest('.chart-dot');
      if(dot){
        tooltip.textContent='W'+dot.dataset.week+': $'+Number(dot.dataset.value).toLocaleString();
        tooltip.style.display='block';
      }
    });
    holder.addEventListener('mousemove',function(e){
      if(tooltip.style.display==='block'){
        var rect=holder.getBoundingClientRect();
        tooltip.style.left=(e.clientX-rect.left+12)+'px';
        tooltip.style.top=(e.clientY-rect.top-30)+'px';
      }
    });
    holder.addEventListener('mouseout',function(e){
      if(e.target.classList.contains('chart-dot') && (!e.relatedTarget || !e.relatedTarget.classList.contains('chart-dot'))) tooltip.style.display='none';
    });
  }

  // Line draw animation
  var ln=document.getElementById('ln');
  try{var L=ln.getTotalLength();ln.style.strokeDasharray=L;ln.style.strokeDashoffset=L;ln.getBoundingClientRect();
    ln.style.transition='stroke-dashoffset 1.8s ease';requestAnimationFrame(function(){ln.style.strokeDashoffset=0;});}catch(e){}
})();
