import assert from 'node:assert/strict';
// Inert interface model: there is intentionally no provider, network or credential backend.
export class ValidationBoundary {
  #generation=0;#queue=[];#closed=false;#grants=new WeakSet();#forbidden;
  constructor({forbidden=[]}={}){this.#forbidden=Object.freeze([...forbidden]);}
  grant(){if(this.#closed)throw new Error('revoked');const grant=Object.freeze({generation:this.#generation,authority:'read-only-validation'});this.#grants.add(grant);return grant;}
  revoke(){this.#generation++;this.#closed=true;this.#queue=[];}
  effect(){throw new Error('effect-not-authorized');}
  publish(grant,publicOutput){
    if(this.#closed||!this.#grants.has(grant)||grant.generation!==this.#generation||grant.authority!=='read-only-validation')throw new Error('stale-or-foreign-grant');
    const bytes=JSON.stringify(publicOutput);assert.ok(Buffer.byteLength(bytes)<=8*1024*1024,'public queue packet budget');assert.ok(publicOutput&&typeof publicOutput==='object'&&!Array.isArray(publicOutput));
    for(const value of this.#forbidden)assert.ok(!bytes.includes(value),'private value before queue');
    const inspect=value=>{if(value&&typeof value==='object')for(const [key,item]of Object.entries(value)){assert.ok(!['native','nativeDetails','rawError','stack','credentialValue','token','password'].includes(key),'private field before queue');inspect(item);}};inspect(publicOutput);
    const immutable=structuredClone(publicOutput);this.#queue.push(immutable);return structuredClone(immutable);
  }
  drain(){const result=structuredClone(this.#queue);this.#queue=[];return result;}
}
export function modelChecks(){let count=0;const boundary=new ValidationBoundary({forbidden:['SYNTHETIC_PRIVATE_MARKER']}),grant=boundary.grant();
  for(const effect of ['network','provider','process','credential','extension','write','audit-side-effect']){assert.throws(()=>boundary.effect(effect));count++;}
  for(const value of [{native:{code:'x'}},{message:'SYNTHETIC_PRIVATE_MARKER'},{stack:'trace'}]){assert.throws(()=>boundary.publish(grant,value));assert.deepEqual(boundary.drain(),[]);count++;}
  const output={diagnostics:[],executionAuthorized:false};boundary.publish(grant,output);output.diagnostics.push({code:'changed'});assert.deepEqual(boundary.drain(),[{diagnostics:[],executionAuthorized:false}]);count++;
  assert.throws(()=>boundary.publish({...grant},{diagnostics:[]}));count++;boundary.revoke();assert.throws(()=>boundary.publish(grant,{diagnostics:[]}));assert.throws(()=>boundary.grant());count+=2;return count;
}
