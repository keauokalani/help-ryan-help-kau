export async function compress(file){if(file.size>40*1024*1024)throw new Error('Choose a photo under 40 MB.');const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>60000000){bitmap.close();throw new Error('This image is too large. Export a smaller JPEG first.');}const ratio=Math.min(1,1920/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82));if(!blob||blob.type!=='image/webp')throw new Error('This browser cannot prepare WebP photos. Try an updated browser.');if(blob.size>3*1024*1024)throw new Error('This photo is still too large. Choose a smaller image.');return blob;}

export function validateVideo(duration,size){
 if(size>25*1024*1024)throw new Error('Choose a video under 25 MB.');
 if(!Number.isFinite(duration)||duration<=0)throw new Error('The video length could not be read. Export it as MP4 and try again.');
 if(duration>60)throw new Error('This video is longer than 1 minute. Trim it to 60 seconds or less.');
}
export async function checkVideo(file){
 if(file.size>25*1024*1024)throw new Error('Choose a video under 25 MB.');
 const duration=await new Promise((resolve,reject)=>{const video=document.createElement('video'),url=URL.createObjectURL(file);let timer;const cleanup=()=>{clearTimeout(timer);video.onloadedmetadata=null;video.onerror=null;video.removeAttribute('src');video.load();URL.revokeObjectURL(url);};timer=setTimeout(()=>{cleanup();reject(new Error('Could not read this video. Try exporting it as MP4.'));},15000);video.preload='metadata';video.onloadedmetadata=()=>{const duration=video.duration;cleanup();resolve(duration);};video.onerror=()=>{cleanup();reject(new Error('This video format could not be read. Try MP4.'));};video.src=url;});validateVideo(duration,file.size);
}
