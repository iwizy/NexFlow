// Measurement-only driver outside the candidate implementation; no oracle input.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
const [moduleFile,root,packetFile,repetitions]=process.argv.slice(2),passes=Number(repetitions);assert.ok([1,10,100].includes(passes));
const {evaluateLibraryCase,repositorySchemas}=await import(pathToFileURL(moduleFile)),schemas=repositorySchemas(),packet=JSON.parse(readFileSync(packetFile,'utf8')),before=JSON.stringify(packet);
assert.ok(packet.length>0&&packet.length<=4096&&packet.every(x=>!('expected'in x)));
function batch(){const start=performance.now();let checksum=0,count=0,last=[];for(let n=0;n<passes;n++){last=[];for(let i=0;i<packet.length;i++){const r=evaluateLibraryCase(packet[i],root,schemas);checksum+=(i+1)*((r.valid===true?3:r.valid===false?5:7)+r.diagnostics.length*11);count++;last.push(r);}if(performance.now()-start>120000)throw new Error('batch deadline');}return {ms:performance.now()-start,checksum,count,last};}
const warmup=batch(),sample=batch();assert.equal(warmup.checksum,sample.checksum);assert.equal(sample.count,packet.length*passes);assert.equal(JSON.stringify(packet),before);assert.equal(JSON.stringify(warmup.last),JSON.stringify(sample.last));
console.log(JSON.stringify({passes,cases:packet.length,completed:sample.count,warmups:1,warmupMs:warmup.ms,validationMs:sample.ms,checksum:sample.checksum,results:sample.last,clock:'node:perf_hooks performance.now, monotonic external to evaluated API; startup/schema construction excluded',inputUnchanged:true}));
