import {config} from './config.js';
export const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl) && !!config.publishableKey;
let session = null;
export function setSession(value){ session = value; }
export function currentSession(){ return session; }
export async function request(path,{method='GET',body,headers={}}={}){
  if(!configured) throw new Error('Secure publishing has not been connected yet. Follow the setup guide before signing in.');
  if(session && session.expires_at * 1000 < Date.now()+60000){
    const refreshed=await fetch(config.supabaseUrl+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
    if(!refreshed.ok){session=null;throw new Error('Your session expired. Sign in again; your form has been kept on screen.');}
    session=await refreshed.json();session.expires_at=Date.now()/1000+session.expires_in;
  }
  const h={apikey:config.publishableKey,...headers};
  if(session)h.Authorization='Bearer '+session.access_token;
  if(body && !(body instanceof Blob)){h['Content-Type']='application/json';body=JSON.stringify(body);}
  const response=await fetch(config.supabaseUrl+path,{method,headers:h,body,cache:'no-store'});
  const raw=await response.text(); let result;try{result=raw?JSON.parse(raw):null;}catch{result=null;}
  if(!response.ok)throw new Error(response.status===401||response.status===403?'You do not have permission for this action. Sign in with an approved admin account.':result?.msg||result?.message||'The request failed. Check your connection and try again.');
  return result;
}
export async function signIn(email,password){
  const value=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
  value.expires_at=Date.now()/1000+value.expires_in;setSession(value);
  const allowed=await request('/rest/v1/rpc/is_editor',{method:'POST',body:{}});
  if(!allowed){setSession(null);throw new Error('This account is not on the approved publisher list.');}
  return value;
}
export async function signOut(){try{await request('/auth/v1/logout',{method:'POST'});}finally{setSession(null);}}
export function safeVideo(value){try{const u=new URL(value);if(u.protocol!=='https:')return '';if(['www.youtube.com','youtube.com','youtu.be','vimeo.com','www.vimeo.com'].includes(u.hostname))return u.href;}catch{}return '';}
export async function mediaUrl(path){
  if(!path || !/^[a-f0-9-]+\/[a-f0-9-]+\.(webp|mp4|webm)$/.test(path))return '';
  const data=await request('/storage/v1/object/sign/project-media/'+path,{method:'POST',body:{expiresIn:600}});
  return config.supabaseUrl+'/storage/v1'+data.signedURL;
}
export function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
export async function renderMedia(record,container){
  if(record.media_path){const url=await mediaUrl(record.media_path);if(!url)return;const video=/\.(mp4|webm)$/.test(record.media_path);const el=node(video?'video':'img');el.src=url;if(video){el.controls=true;el.preload='none';el.setAttribute('playsinline','');}else{el.alt=record.alt_text||record.title;el.loading='lazy';el.decoding='async';el.width=1200;el.height=900;}container.append(el);}
  if(safeVideo(record.video_url)){const a=node('a','Open video ↗','video-link');a.href=safeVideo(record.video_url);a.target='_blank';a.rel='noopener noreferrer';container.append(a);}
}
