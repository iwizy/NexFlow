import {spawn,spawnSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
// Trusted watchdog. Native Windows jobs impose their separate kernel memory cap.
export async function supervise(command,args,{cwd,env,timeout=30000,memoryBytes=1024*1024*1024,input}={}){
  const start=performance.now(),child=spawn(command,args,{cwd,env,stdio:['pipe','pipe','pipe'],detached:process.platform!=='win32'});let stdout='',stderr='',timedOut=false,memoryExceeded=false,outputExceeded=false,observedRssBytes=0,error=null;
  const kill=()=>{try{if(process.platform!=='win32')process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{}};
  const append=(kind,chunk)=>{if(kind==='stdout')stdout+=chunk;else stderr+=chunk;if(Buffer.byteLength(stdout)+Buffer.byteLength(stderr)>8*1024*1024){outputExceeded=true;kill();}};
  child.stdout.on('data',chunk=>append('stdout',chunk));child.stderr.on('data',chunk=>append('stderr',chunk));child.on('error',e=>{error=e.code;});
  if(input!==undefined)child.stdin.end(input);else child.stdin.end();
  const timer=setTimeout(()=>{timedOut=true;kill();},timeout);
  const poll=setInterval(()=>{if(!child.pid||process.platform==='win32')return;const p=spawnSync('/bin/ps',['-o','rss=','-p',String(child.pid)],{encoding:'utf8',timeout:1000});const rss=Number(p.stdout?.trim())*1024;if(Number.isFinite(rss)){observedRssBytes=Math.max(observedRssBytes,rss);if(rss>memoryBytes){memoryExceeded=true;kill();}}},50);
  const result=await new Promise(resolve=>child.once('close',(exitCode,signal)=>resolve({exitCode:exitCode??-1,signal})));clearTimeout(timer);clearInterval(poll);
  return {...result,error,stdout,stderr,timedOut,memoryExceeded,outputExceeded,observedRssBytes,elapsedMs:performance.now()-start,accounting:'external 50ms RSS watchdog; sampled observation, not an OS peak-memory benchmark'};
}
