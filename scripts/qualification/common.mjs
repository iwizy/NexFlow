import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,cpSync,existsSync,readdirSync,lstatSync,realpathSync,rmSync} from 'node:fs';
import {spawnSync,spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import readline from 'node:readline';
export const candidates=['typescript','python','rust','go'];
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export const fileSha=file=>sha(readFileSync(file));
export const json=file=>JSON.parse(readFileSync(file,'utf8'));
export function run(command,args=[],options={}){const p=spawnSync(command,args,{encoding:'utf8',shell:false,timeout:600000,maxBuffer:32*1024*1024,...options});return {exitCode:p.status??-1,signal:p.signal??null,error:p.error?.code??null,stdout:p.stdout??'',stderr:p.stderr??''};}
export function checked(command,args=[],options={}){const r=run(command,args,options);assert.equal(r.exitCode,0,r.stderr.slice(-2500));return r.stdout.trim();}
export const git=(...args)=>checked('git',args);
export function sourceBinding(files){const revision=git('rev-parse','HEAD'),sources=files.map(file=>({path:file,sha256:fileSha(file)}));for(const row of sources)assert.equal(row.sha256,sha(spawnSync('git',['show',revision+':'+row.path],{maxBuffer:16*1024*1024}).stdout),'Commit producer before capturing observations');return {revision,sources};}
export function redact(value,roots=[]){if(typeof value==='string'){for(const root of [...roots].filter(Boolean).sort((a,b)=>b.length-a.length))for(const variant of[root,root.replaceAll('\\','/')])value=value.split(variant).join('<evaluation-path>');return value.replace(/(?:[A-Z]:[\\/]|\/(?:Users|private|home|opt|var|tmp)\/)[^\s"'<>]*/giu,'<private-path>');}if(Array.isArray(value))return value.map(v=>redact(v,roots));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,redact(v,roots)]));return value;}
export function writeRecord(file,record,roots=[]){mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,JSON.stringify(redact(record,roots),null,2)+'\n');}
export function extract(archive,destination){mkdirSync(destination,{recursive:true});const tar=process.platform==='win32'?path.join(process.env.SystemRoot,'System32/tar.exe'):'tar';const names=checked(tar,['-tf',archive]).split(/\r?\n/u).filter(Boolean);for(const member of names)assert.ok(!path.posix.isAbsolute(member)&&!member.replaceAll('\\','/').split('/').includes('..'));checked(tar,['-xzf',archive,'-C',destination]);}
export function capsuleCommand(id,prefix,tools){const at=path.join(prefix,'evaluation/prototypes',id);if(id==='typescript')return [tools.node,path.join(at,'dist/cli.js')];if(id==='python'){if(process.platform==='win32'){assert.ok(tools.pythonBase&&tools.pythonSite&&tools.pythonBootstrap);return [tools.pythonBase,'-I','-X','utf8','-B',tools.pythonBootstrap,tools.pythonSite,path.join(at,'cli.py')];}return [tools.python,'-I','-X','utf8','-B',path.join(at,'cli.py')];}return[path.join(at,'bin/nexflow-'+id+'-evaluation'+(process.platform==='win32'?'.exe':''))];}
export function cleanEnvironment(scope){return {PATH:process.platform==='win32'?path.join(process.env.SystemRoot,'System32'):'/usr/bin:/bin',LANG:'C.UTF-8',LC_ALL:'C.UTF-8',HOME:path.join(scope,'unavailable-home'),TMPDIR:path.join(scope,'unavailable-temp'),PYTHONUTF8:'1',PYTHONDONTWRITEBYTECODE:'1',...(process.platform==='win32'?{SystemRoot:process.env.SystemRoot,WINDIR:process.env.WINDIR,SystemDrive:process.env.SystemDrive,LOCALAPPDATA:process.env.LOCALAPPDATA,TEMP:path.join(scope,'unavailable-temp'),TMP:path.join(scope,'unavailable-temp')}:{})};}
export async function windowsSession({scope,readable}){
  const configuration=path.join(scope,'container-'+randomUUID()+'.json');writeFileSync(configuration,JSON.stringify({scope,readable}));
  const proc=spawn('pwsh',['-NoProfile','-NonInteractive','-File','scripts/qualification/windows-session.ps1',configuration],{stdio:['pipe','pipe','pipe'],windowsHide:true});
  const waiting=[];let errors='';proc.stderr.on('data',chunk=>{errors+=chunk;});
  const lines=readline.createInterface({input:proc.stdout});let readyResolve,readyReject;
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  lines.on('line',line=>{try{const value=JSON.parse(line);if(value.ready){assert.equal(value.unicodeProbe,'юникод','Windows UTF-8 output protocol');readyResolve(value);}else{const pending=waiting.shift();if(pending){if(value.launcherError)pending.reject(new Error(value.launcherError));else if(value.argumentsSha256!==pending.argumentsSha256)pending.reject(new Error('Windows Unicode command protocol mismatch'));else pending.resolve(value);}}}catch{const error=new Error('Invalid launcher protocol: '+line);readyReject(error);for(const pending of waiting.splice(0))pending.reject(error);}});
  proc.on('exit',code=>{const err=new Error('Windows launcher exited '+code+': '+errors.slice(-2500));readyReject(err);for(const pending of waiting.splice(0))pending.reject(err);});
  await Promise.race([ready,new Promise((_,reject)=>{const t=setTimeout(()=>reject(new Error('Windows launcher initialization timeout: '+errors.slice(-2500))),60000);t.unref();})]);
  return {async run(command,args,options={}){const result=new Promise((resolve,reject)=>waiting.push({resolve,reject,argumentsSha256:sha([command,...args].join('\0'))}));proc.stdin.write(JSON.stringify({command,args,cwd:options.cwd??scope,env:options.env??cleanEnvironment(scope),output:path.join(scope,'stdio-'+randomUUID()),timeout:options.timeout??30000,restrictChildren:options.restrictChildren??false})+'\n');return result;},async close(){if(proc.exitCode===null){proc.stdin.end('{"close":true}\n');await new Promise(resolve=>proc.once('exit',resolve));}assert.equal(proc.exitCode,0,'Windows sandbox cleanup failed: '+errors.slice(-1500));}};
}
