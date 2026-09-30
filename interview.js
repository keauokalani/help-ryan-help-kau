const play=document.getElementById('play-interview');
play?.addEventListener('click',()=>{
 const frame=document.createElement('iframe');
 frame.src='https://www.youtube-nocookie.com/embed/Ey-PfB745Uk?autoplay=1&playsinline=1';
 frame.title='Ryan Sanborn interview — Help Ryan Help Kaʻū';
 frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
 frame.allowFullscreen=true;
 frame.referrerPolicy='strict-origin-when-cross-origin';
 document.getElementById('interview-media').replaceChildren(frame);
 frame.focus();
});
