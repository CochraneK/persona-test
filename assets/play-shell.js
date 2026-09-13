(function(){
  'use strict';

  var frame=document.getElementById('app');
  var fallback=document.getElementById('fallback');
  var SHAREABLE_RESULT_TESTS={chair:true,dog:true,cat:true,audio:true,animal:true,food:true,color:true,weather:true,city:true,flower:true};

  function route(){
    var p=new URLSearchParams(location.search);
    return {test:p.get('test')||'chair',result:p.get('result')||'',scene:p.get('scene')||''};
  }

  function writeRoute(id,result,scene){
    var u=new URL(location.href);
    u.searchParams.set('test',id);
    if(result&&SHAREABLE_RESULT_TESTS[id])u.searchParams.set('result',result);else u.searchParams.delete('result');
    if(id==='chair'&&scene)u.searchParams.set('scene',scene);else u.searchParams.delete('scene');
    history.replaceState(null,'',u.pathname+u.search+u.hash);
  }

  function shareUrl(){return location.href;}

  function addStyle(d){
    var s=d.createElement('style');
    s.textContent=[
      '.refbox{display:none!important}',
      '.btn:focus-visible,.opt:focus-visible,.eitem:focus-visible,.sitem:focus-visible,.ctab:focus-visible{outline:3px solid rgba(36,166,158,.35);outline-offset:2px}',
      '.cv:focus-visible .cvseat,.cv:focus-visible .cvback{stroke:#24A69E;stroke-width:3}',
      '.balloon{cursor:pointer;touch-action:manipulation}',
      '.share-note{font-size:12px;color:#738796;margin-top:10px;min-height:18px}',
      '.poster-btn{border-color:#24A69E!important;color:#1c857d!important}',
      '.result[aria-live]{scroll-margin-top:90px}',
      '@media (max-width:640px){.btnrow .btn{min-height:44px}.blrow{width:100%;justify-content:center}.blrow .btn{flex:1;max-width:180px}.stage{padding-bottom:90px!important}}',
      '@media (prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}'
    ].join('\n');
    d.head.appendChild(s);
  }

  function copyText(text){
    if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);
    return new Promise(function(resolve,reject){
      try{
        var ta=document.createElement('textarea');
        ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
        var ok=document.execCommand('copy');ta.remove();ok?resolve():reject(new Error('copy failed'));
      }catch(e){reject(e);}
    });
  }

  function resultData(d){
    var r=d.querySelector('.result');
    if(!r)return null;
    var name=(r.querySelector('.rname')||{}).textContent||'';
    var line=(r.querySelector('.rline')||{}).textContent||'';
    var type=(r.querySelector('.rtype')||{}).textContent||'';
    var tags=[].map.call(r.querySelectorAll('.chip'),function(x){return x.textContent.trim();}).filter(Boolean);
    var blind=(r.querySelector('.blind')||{}).textContent||'';
    var copy=(r.querySelector('.copy')||{}).textContent||'';
    copy=copy.replace(/^可晒文案\s*/,'').trim();
    return {root:r,name:name.trim(),line:line.trim(),type:type.trim(),tags:tags,blind:blind.trim(),copy:copy,image:r.querySelector('.rimg')};
  }

  function resultText(d){
    var x=resultData(d);if(!x)return '';
    var lead=x.copy||('我的人格测试结果：'+x.name);
    var details=[x.name,x.line,x.tags.length?('#'+x.tags.join(' #')):''].filter(Boolean).join('\n');
    return lead+'\n\n'+details+'\n\n你也来测：'+shareUrl();
  }

  function roundedRect(ctx,x,y,w,h,r){
    var rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  }

  function lines(ctx,text,maxWidth,maxLines){
    var chars=Array.from(String(text||''));var out=[],line='';
    for(var i=0;i<chars.length;i++){
      var next=line+chars[i];
      if(ctx.measureText(next).width>maxWidth&&line){out.push(line);line=chars[i];if(out.length===maxLines-1)break;}else line=next;
    }
    if(line&&out.length<maxLines)out.push(line);
    if(i<chars.length&&out.length){var last=out.length-1;while(ctx.measureText(out[last]+'…').width>maxWidth&&out[last])out[last]=out[last].slice(0,-1);out[last]+='…';}
    return out;
  }

  function drawLines(ctx,arr,x,y,lineHeight){arr.forEach(function(t,i){ctx.fillText(t,x,y+i*lineHeight);});return y+arr.length*lineHeight;}

  function drawCover(ctx,img,x,y,w,h){
    if(!img||!img.naturalWidth||!img.naturalHeight)return false;
    var ir=img.naturalWidth/img.naturalHeight,br=w/h,sx=0,sy=0,sw=img.naturalWidth,sh=img.naturalHeight;
    if(ir>br){sw=img.naturalHeight*br;sx=(img.naturalWidth-sw)/2;}else{sh=img.naturalWidth/br;sy=(img.naturalHeight-sh)/2;}
    ctx.save();roundedRect(ctx,x,y,w,h,34);ctx.clip();ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);ctx.restore();return true;
  }

  function makePoster(d){
    return new Promise(function(resolve,reject){
      try{
        var data=resultData(d);if(!data)throw new Error('no result');
        var canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1440;
        var ctx=canvas.getContext('2d');
        ctx.fillStyle='#F7FBFA';ctx.fillRect(0,0,1080,1440);
        ctx.fillStyle='#142A40';ctx.fillRect(0,0,1080,190);
        ctx.fillStyle='#72D5CC';ctx.font='700 30px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('PERSONA TEST',72,78);
        ctx.fillStyle='#FFFFFF';ctx.font='700 48px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('人格投射测验',72,140);
        ctx.fillStyle='#FFFFFF';roundedRect(ctx,54,225,972,1125,42);ctx.fill();

        var y=290;
        if(drawCover(ctx,data.image,72,y,936,390))y+=438;
        ctx.fillStyle='#24A69E';ctx.font='700 24px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';
        drawLines(ctx,lines(ctx,data.type,880,2),82,y,34);y+=68;
        ctx.fillStyle='#142A40';ctx.font='800 64px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';
        y=drawLines(ctx,lines(ctx,data.name,880,2),82,y,78)+22;
        ctx.fillStyle='#738796';ctx.font='500 31px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';
        y=drawLines(ctx,lines(ctx,data.line,880,3),82,y,45)+24;

        var tx=82;ctx.font='700 24px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';
        data.tags.slice(0,4).forEach(function(tag){
          var tw=ctx.measureText(tag).width+44;if(tx+tw>998)return;
          ctx.fillStyle='#EAF7F4';roundedRect(ctx,tx,y-28,tw,48,24);ctx.fill();ctx.fillStyle='#1C857D';ctx.fillText(tag,tx+22,y+5);tx+=tw+14;
        });
        y+=70;
        if(data.copy){ctx.fillStyle='#F3FAF8';roundedRect(ctx,72,y,936,170,28);ctx.fill();ctx.fillStyle='#F29A49';ctx.font='800 20px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('可晒文案',98,y+42);ctx.fillStyle='#263746';ctx.font='600 29px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';drawLines(ctx,lines(ctx,data.copy,830,3),98,y+88,40);y+=198;}

        ctx.strokeStyle='#DCE8E8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(82,1260);ctx.lineTo(998,1260);ctx.stroke();
        ctx.fillStyle='#738796';ctx.font='500 22px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('娱乐向结果 · 不构成心理诊断',82,1308);
        ctx.fillStyle='#142A40';ctx.font='700 22px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('cochranek.github.io/persona-test/',82,1348);
        canvas.toBlob(function(blob){blob?resolve(blob):reject(new Error('poster failed'));},'image/png',0.95);
      }catch(e){reject(e);}
    });
  }

  function savePoster(d,note){
    note.textContent='正在生成结果海报…';
    makePoster(d).then(function(blob){
      var safe=(resultData(d).name||'persona-result').replace(/[\\/:*?"<>|\s]+/g,'-');
      var file=new File([blob],safe+'.png',{type:'image/png'});
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
        return navigator.share({files:[file],title:'Persona Test · '+resultData(d).name,text:'这是我的人格测试结果。'}).then(function(){note.textContent='海报已生成';});
      }
      var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1500);note.textContent='结果海报已保存';
    }).catch(function(){note.textContent='海报生成失败，请稍后重试';});
  }

  function enhanceResult(d){
    var data=resultData(d);if(!data||data.root.dataset.shareReady==='1')return;
    var result=data.root;result.dataset.shareReady='1';result.setAttribute('aria-live','polite');
    var row=result.querySelector('.btnrow');if(!row)return;
    var copy=d.createElement('button');copy.className='btn ghost';copy.type='button';copy.textContent='复制结果';
    var share=d.createElement('button');share.className='btn ghost';share.type='button';share.textContent=navigator.share?'分享结果':'复制分享链接';
    var poster=d.createElement('button');poster.className='btn ghost poster-btn';poster.type='button';poster.textContent='生成结果海报';
    var note=d.createElement('div');note.className='share-note';note.setAttribute('aria-live','polite');
    copy.addEventListener('click',function(){copyText(resultText(d)).then(function(){note.textContent='已复制结果文案';}).catch(function(){note.textContent='复制失败，请长按选择文案';});});
    share.addEventListener('click',function(){
      var text=resultText(d).replace(/\n\n你也来测：.*$/,'');
      if(navigator.share)navigator.share({title:'Persona Test · '+data.name,text:text,url:shareUrl()}).catch(function(){});
      else copyText(shareUrl()).then(function(){note.textContent='已复制结果链接';}).catch(function(){note.textContent='复制失败';});
    });
    poster.addEventListener('click',function(){savePoster(d,note);});
    row.appendChild(copy);row.appendChild(share);row.appendChild(poster);result.appendChild(note);
  }

  function enhanceAccessibility(w,d){
    [].forEach.call(d.querySelectorAll('.eitem img'),function(img){img.loading='lazy';img.decoding='async';});
    [].forEach.call(d.querySelectorAll('.cv'),function(g){
      if(g.dataset.a11y==='1')return;
      g.dataset.a11y='1';g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label','选择椅子 '+(g.dataset.id||''));
      g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();g.click();}});
    });
  }

  function patchMbti(w){
    if(!w.DATA)return;
    var extra=[
      [['临时多出一个空闲下午？','约人出去走走','E'],['自己安静待着更舒服','I']],
      [['碰到陌生任务？','先从已知步骤开始','S'],['先猜整体规律和可能性','N']],
      [['朋友来找你诉苦？','先一起想解决办法','T'],['先确认对方现在的感受','F']],
      [['明天有件重要的事？','提前安排好更安心','J'],['保留弹性到时候再看','P']]
    ];
    ['cat','dog'].forEach(function(id){var x=w.DATA[id];if(!x||!x.qs)return;if(x.qs.length===8)extra.forEach(function(q){x.qs.push(q);});x.note='12 道情境题，每个维度 3 题，凭第一反应选择；这是娱乐化 MBTI 改编，并非正式量表。';});
    w.mQ=function(id){
      var test=w.DATA[id],state=w.ST[id],q=test.qs[state.qi],doc=w.document,prompt=q[0][0],opts=[[q[0][1],q[0][2]],[q[1][0],q[1][1]]],mq=doc.getElementById('mq');
      mq.innerHTML='<div class="prog">第 '+(state.qi+1)+' / '+test.qs.length+' 题</div><div class="qtext">'+w.esc(prompt)+'</div><div class="opts">'+opts.map(function(o,i){return '<button class="opt" data-i="'+i+'">'+w.esc(o[0])+'</button>';}).join('')+'</div>';
      [].forEach.call(mq.querySelectorAll('.opt'),function(b){b.onclick=function(){var o=opts[+b.dataset.i];state.sc[o[1]]++;state.qi++;state.qi<test.qs.length?w.mQ(id):w.mDone(id);};});
    };
  }

  function patchScientificNotes(w){
    if(!w.DATA)return;
    if(w.DATA.balloon)w.DATA.balloon.note='5 个气球的娱乐化风险决策小游戏，灵感来自 BART。每次打气可能加分，也可能爆掉；结果仅供娱乐。';
    if(w.DATA.cyber)w.DATA.cyber.note='一个受 Cyberball 启发的社会反应小游戏：经历被冷落后，看你接下来更倾向怎样分配互动。结果仅供娱乐。';
  }

  function patchBalloon(w,d){
    if(!w.renderBalloon||w.__mobileBalloonPatched)return;w.__mobileBalloonPatched=true;var original=w.renderBalloon;
    w.renderBalloon=function(id){
      original(id);var row=d.querySelector('.blrow');
      if(row&&!d.getElementById('pump')){var pump=d.createElement('button');pump.className='btn';pump.id='pump';pump.type='button';pump.textContent='打气 +2';row.insertBefore(pump,row.firstChild);pump.onclick=function(){w.blPump();};}
      var balloon=d.getElementById('bl');if(balloon){balloon.setAttribute('role','button');balloon.setAttribute('tabindex','0');balloon.setAttribute('aria-label','给气球打气');balloon.onclick=function(){var p=d.getElementById('pump');if(p&&!p.disabled)w.blPump();};balloon.onkeydown=function(e){if((e.key==='Enter'||e.key===' ')&&!e.repeat){e.preventDefault();var p=d.getElementById('pump');if(p&&!p.disabled)w.blPump();}};}
      var hint=d.querySelector('.bl .hint');if(hint)hint.innerHTML='手机点 <b>打气 +2</b> 或直接点气球；桌面也可按 <b>空格键</b>';
    };
    if(w.blLock){var lock=w.blLock;w.blLock=function(v){lock(v);var p=d.getElementById('pump');if(p)p.disabled=v;};}
  }

  function patchChair(w,d){
    if(!w.renderChair||w.__chairHintPatched)return;w.__chairHintPatched=true;var original=w.renderChair;
    w.renderChair=function(id){original(id);var hint=d.querySelector('.stage>.hint');if(hint)hint.textContent='凭第一反应点一把椅子坐下。位置只用于娱乐化投射解读，没有标准答案。';enhanceAccessibility(w,d);};
  }

  function patchResults(w,d){
    if(w.__resultSharePatched)return;w.__resultSharePatched=true;
    if(w.showResult){var sr=w.showResult;w.showResult=function(id,key){sr.apply(w,arguments);if(SHAREABLE_RESULT_TESTS[id])writeRoute(id,key,'');else writeRoute(id,'','');enhanceResult(d);enhanceAccessibility(w,d);};}
    if(w.showChairResult){var sc=w.showChairResult;w.showChairResult=function(id,cid){sc.apply(w,arguments);writeRoute(id,String(cid),w.cvScene||'');enhanceResult(d);enhanceAccessibility(w,d);};}
  }

  function patchNavigation(w,d){
    if(!w.go||w.__navPatched)return;w.__navPatched=true;var original=w.go;
    w.go=function(id){original(id);writeRoute(id,'','');setTimeout(function(){enhanceAccessibility(w,d);},0);};
  }

  function patchHeader(d){
    var kicker=d.querySelector('.hero .kicker');if(kicker)kicker.textContent='PERSONA TEST';
    var h1=d.querySelector('.hero h1');if(h1)h1.textContent='人格投射测验';
    var sub=d.querySelector('.hero .sub');if(sub)sub.textContent='12 个轻量、可玩、可分享的趣味人格小游戏。凭第一反应选择即可，所有结果仅供娱乐与交流。';
  }

  function deriveImage(w,id,key){
    var d=w.DATA[id];if(!d||!d.items)return '';
    var item=d.items.filter(function(x){return String(x[2])===String(key);})[0];
    return item&&d.kind!=='swatch'?'img/'+item[0]+'.jpg':'';
  }

  function restoreResult(w,d,r){
    if(!r.result||!SHAREABLE_RESULT_TESTS[r.test])return false;
    if(r.test==='chair'){
      if(r.scene&&w.DATA.chair.scenes&&w.DATA.chair.scenes[r.scene])w.cvScene=r.scene;
      if(w.DATA.chair.chairs&&w.DATA.chair.chairs[r.result]){w.showChairResult('chair',r.result);return true;}
      return false;
    }
    var test=w.DATA[r.test];if(!test||!test.results||!test.results[r.result])return false;
    w.showResult(r.test,r.result,deriveImage(w,r.test,r.result),'');return true;
  }

  function init(){
    try{
      var w=frame.contentWindow,d=frame.contentDocument;if(!w||!d||!w.DATA||!w.go)throw new Error('engine unavailable');if(w.__personaShellReady)return;w.__personaShellReady=true;
      var requested=route();
      addStyle(d);patchHeader(d);patchMbti(w);patchScientificNotes(w);patchBalloon(w,d);patchChair(w,d);patchResults(w,d);patchNavigation(w,d);
      var id=requested.test;if(!w.DATA[id])id='chair';w.go(id);restoreResult(w,d,{test:id,result:requested.result,scene:requested.scene});enhanceAccessibility(w,d);
    }catch(e){frame.style.display='none';fallback.style.display='block';}
  }

  frame.addEventListener('load',init);
  try{if(frame.contentDocument&&frame.contentDocument.readyState==='complete')setTimeout(init,0);}catch(e){}
})();
