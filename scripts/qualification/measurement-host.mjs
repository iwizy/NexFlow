import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,cpSync,realpathSync,existsSync,readdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';
import {randomUUID} from 'node:crypto';
import {sha,checked,cleanEnvironment,run} from './common.mjs';
async function workerSession(config,script){
  const file=path.join(config.scope,'build-config-'+randomUUID()+'.json');writeFileSync(file,JSON.stringify(config));
  const child=spawn('pwsh',['-NoProfile','-NonInteractive','-File',script,file],{stdio:['pipe','pipe','pipe'],windowsHide:true});let errors='';child.stderr.on('data',c=>errors+=c);const pending=[];let readyYes,readyNo;const ready=new Promise((yes,no)=>{readyYes=yes;readyNo=no;});
  readline.createInterface({input:child.stdout,crlfDelay:Infinity}).on('line',line=>{try{const value=JSON.parse(line);if(value.ready){assert.equal(value.unicodeProbe,'юникод');readyYes();return;}const p=pending.shift();if(p){if(value.launcherError)p.no(new Error(value.launcherError));else if(value.argumentsSha256!==p.hash)p.no(new Error('Measurement Unicode request mismatch'));else p.yes(value);}}catch(e){readyNo(e);for(const p of pending.splice(0))p.no(e);}});
  child.on('exit',code=>{const e=new Error('Build sandbox exited '+code+': '+errors.slice(-3000));readyNo(e);for(const p of pending.splice(0))p.no(e);});await ready;
  return {run(command,args,{cwd,env,timeout=600000,restrictChildren=false}={}){const result=new Promise((yes,no)=>pending.push({yes,no,hash:sha([command,...args].join('\0'))}));child.stdin.write(JSON.stringify({command,args,cwd,env,timeout,restrictChildren,output:path.join(config.scope,'stdio-'+randomUUID())})+'\n');return result;},async close(){if(child.exitCode===null){child.stdin.end('{"close":true}\n');await new Promise(resolve=>child.once('exit',resolve));}assert.equal(child.exitCode,0,errors.slice(-2000));}};
}
export const buildSession=config=>workerSession(config,'scripts/qualification/windows-build-session.ps1');
export const validationSession=config=>workerSession(config,'scripts/qualification/windows-session.ps1');
export function buildEnvironment(scope){const temp=path.join(scope,'build-temp');mkdirSync(temp,{recursive:true});return {...cleanEnvironment(scope),HOME:temp,TMPDIR:temp,TEMP:temp,TMP:temp,PYTHONDONTWRITEBYTECODE:'1'};}
