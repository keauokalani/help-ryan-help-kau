import {config} from './config.js';
import {configured,request,node,renderMedia} from './api.js';
const byId=id=>document.getElementById(id);
const recoveryParams=new URLSearchParams(location.hash.slice(1));
const recoveryToken=recoveryParams.get('access_token');
if(recoveryParams.get('type')==='recovery'&&recoveryToken){
  const panel=byId('password-recovery');panel.hidden=false;
  const form=byId('password-recovery-form'),status=byId('password-recovery-status');
  form.onsubmit=async e=>{e.preventDefault();const password=byId('recovery-password').value;if(password!==byId('recovery-confirm').value){status.textContent='The passwords do not match.';return;}const button=form.querySelector('button');button.disabled=true;status.textContent='Saving…';try{const response=await fetch(config.supabaseUrl+'/auth/v1/user',{method:'PUT',headers:{apikey:config.publishableKey,Authorization:'Bearer '+recoveryToken,'Content-Type':'application/json'},body:JSON.stringify({password})});if(!response.ok)throw new Error('This reset link is expired. Request a new one.');history.replaceState({},'',location.pathname+location.search);form.reset();status.textContent='Password updated. You can now use the Admin Login page.';}catch(err){status.textContent=err.message;}finally{button.disabled=false;}};
}
if(config.reviewMode)byId('share').hidden=true;
const date=value=>new Intl.DateTimeFormat('en-US',{dateStyle:'long',timeZone:'Pacific/Honolulu'}).format(new Date(value+'T12:00:00-10:00'));
byId('share').onclick=async()=>{const message=byId('share-status');if(config.reviewMode){message.textContent='Sharing is not available yet.';return;}try{if(navigator.share)await navigator.share({title:'Help Ryan Help Kaʻū',url:config.siteUrl});else{await navigator.clipboard.writeText(config.siteUrl);message.textContent='Website link copied.';}}catch(e){if(e.name!=='AbortError')message.textContent='Copy this website address to share: '+config.siteUrl;}};
async function addPost(record,target){
  const article=node('article',undefined,'post media');article.id='post-'+record.id;
  const meta=node('p',[record.work_date?date(record.work_date):'',record.location].filter(Boolean).join(' · '),'meta');article.append(meta,node('h3',record.title),node('p',record.body));
  try{await renderMedia(record,article);}catch{article.append(node('p','Media is temporarily unavailable.','caption'));}
  if(record.caption)article.append(node('p',record.caption,'caption'));
  if(record.transcript){const d=node('details');d.append(node('summary','Video transcript'),node('p',record.transcript));article.append(d);}
  const link=node('a','Link to this update','caption');link.href='./blog.html?post='+record.id;article.append(link);target.append(article);
}
async function load(){
  if(!configured)return;
  try{
    const records=await request('/rest/v1/entries?select=*&published=eq.true&order=created_at.desc');
    for(const kind of ['hero','story','work','about','interview','funding']){
      const r=records.find(x=>x.kind===kind);if(!r)continue;
      if(byId(kind+'-title')&&r.title)byId(kind+'-title').textContent=r.title;
      if(byId(kind+'-body')){byId(kind+'-body').textContent=r.body;byId(kind+'-body').classList.add('pre-line');}
      if(['welcome','interview'].includes(kind)&&(r.media_path||r.video_url)){const box=byId(kind+'-media');const media=node('div',undefined,'media');await renderMedia(r,media);if(media.childElementCount){box.replaceWith(media);media.id=kind+'-media';if(kind==='welcome'){document.querySelector('.film-caption').lastElementChild.textContent='Welcome film';if(r.transcript){const d=node('details');d.append(node('summary','Welcome film transcript'),node('p',r.transcript,'pre-line'));media.append(d);}}}}
      if(kind==='interview'&&r.transcript)byId('transcript').textContent=r.transcript;
    }
    const testimonials=records.filter(r=>r.kind==='welcome'&&/\.(mp4|webm)$/.test(r.media_path||''));
    if(testimonials.length){const list=byId('testimonials-list');list.replaceChildren();for(const r of testimonials){const card=node('article',undefined,'post media');card.append(node('h3',r.title),node('p',r.body));try{await renderMedia(r,card);}catch{card.append(node('p','Video is temporarily unavailable.','caption'));}if(r.transcript){const d=node('details');d.append(node('summary','Read the testimonial'),node('p',r.transcript,'pre-line'));card.append(d);}list.append(card);}}
    const posts=records.filter(r=>['update','gallery'].includes(r.kind));
    if(posts.length){byId('updates').replaceChildren();for(const r of posts.slice(0,3))await addPost(r,byId('updates'));}
    const gallery=posts.filter(r=>r.media_path||r.video_url).slice(0,3);
    if(gallery.length){byId('gallery').replaceChildren();for(const r of gallery){const card=node('article',undefined,'media');await renderMedia(r,card);card.append(node('h3',r.title),node('p',r.caption||r.location||'','caption'));const a=node('a','Read the update');a.href='#post-'+r.id;card.append(a);byId('gallery').append(card);}}
    const qr=records.find(r=>r.kind==='qr'&&r.media_path);if(qr){byId('qr-media').replaceChildren();await renderMedia(qr,byId('qr-media'));}
    const finances=records.filter(r=>r.kind==='finance');if(finances.length){byId('financials').replaceChildren();for(const r of finances){const row=node('div',undefined,'money-row');row.append(node('span',r.title),node('strong',r.amount===null?'Not yet reported':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(r.amount)),node('p',r.period,'caption'),node('p',r.body,'caption'));byId('financials').append(row);}}
    if(location.hash.startsWith('#post-'))byId(location.hash.slice(1))?.scrollIntoView();
  }catch{byId('updates').prepend(node('p','Live updates are temporarily unavailable. Please check back shortly.','status'));}
}
load();
