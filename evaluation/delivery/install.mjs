// Trusted evaluation installer. Manifests never select executable commands.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,lstatSync,mkdirSync,renameSync,existsSync,cpSync,rmSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function inventory(root,prefix='') {
  return readdirSync(path.join(root,prefix),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en')).flatMap(e=>{
    const name=prefix?prefix+'/'+e.name:e.name,at=path.join(root,name),s=lstatSync(at);
    assert.ok(!s.isSymbolicLink()&&(s.isFile()||s.isDirectory()),'Links/devices are not installable payload');
    return s.isDirectory()?inventory(root,name):[{path:name,bytes:s.size,sha256:hash(readFileSync(at))}];
  });
}
export function verifyPayload(root,expected) {
  assert.ok(Array.isArray(expected)&&expected.length>0);
  for(const row of expected)assert.ok(typeof row.path==='string'&&!row.path.includes('\\')&&!path.posix.isAbsolute(row.path)&&row.path.split('/').every(p=>p&&p!=='.'&&p!=='..'));
  assert.deepEqual(inventory(root),expected,'Exact payload inventory mismatch');
}
export function installVerified({source,store,version,manifest}) {
  assert.match(version,/^[a-z0-9][a-z0-9.-]{0,180}$/u);
  assert.ok(path.isAbsolute(store)&&path.isAbsolute(source)&&path.resolve(source)!==path.resolve(store));
  verifyPayload(source,manifest);mkdirSync(store,{recursive:true});
  const destination=path.join(store,version);assert.ok(!existsSync(destination),'Immutable installed version already exists');
  const stage=path.join(store,'staging-'+randomUUID());
  try{cpSync(source,stage,{recursive:true,dereference:false});verifyPayload(stage,manifest);renameSync(stage,destination);}
  finally{if(existsSync(stage))rmSync(stage,{recursive:true});}
  return destination;
}
export function activateVerified({store,version,manifest}) {
  assert.match(version,/^[a-z0-9][a-z0-9.-]{0,180}$/u);verifyPayload(path.join(store,version),manifest);
  const pending=path.join(store,'active-'+randomUUID()+'.json'),active=path.join(store,'active.json');
  writeFileSync(pending,JSON.stringify({version,manifestSha256:hash(JSON.stringify(manifest))})+'\n',{flag:'wx'});
  // Same-volume rename publishes only a fully verified version; never in-place overwrite.
  renameSync(pending,active);return path.join(store,version);
}
export function activeVersion(store) {const value=JSON.parse(readFileSync(path.join(store,'active.json')));assert.match(value.version,/^[a-z0-9][a-z0-9.-]{0,180}$/u);return value;}
