'use strict';
// Source governance runs in Git-connected builds only, never in visitor or API requests.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const json=v=>JSON.stringify(v,null,2)+'\n',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function closure(root){const names=['accept-source.cjs','renderer.cjs','build.cjs','remote-build.cjs','seed.json','live-source.json'];function walk(dir,prefix){for(const name of fs.readdirSync(dir).sort()){const file=path.join(dir,name),s=fs.lstatSync(file);if(s.isDirectory())walk(file,prefix+name+'/');else if(s.isFile())names.push(prefix+name);else throw Error('Unsupported adoption source.');}}walk(path.join(root,'template'),'template/');return names.sort();}
function transitionHash(root,m){return sha(Buffer.concat([Buffer.from(json({...m,newTemplateHash:'0'.repeat(64),transitionHash:'0'.repeat(64)})),...closure(root).flatMap(n=>[Buffer.from(n+'\0'),fs.readFileSync(path.join(root,n)),Buffer.from('\0')])]));}
function assertTransition(root,m){
 const deadline=Date.now()+10000;let gitCwd=root;
 function gitBytes(...args){const left=deadline-Date.now();if(left<=0)throw Error('Adoption Git check timed out.');return execFileSync('git',args,{cwd:gitCwd,timeout:Math.min(2000,left),maxBuffer:2*1024*1024,stdio:['ignore','pipe','pipe']});}
 const git=(...args)=>gitBytes(...args).toString('utf8').trim();
 const fail=()=>{throw Error('The adoption Git transition needs a fresh bound coordinator decision and matching parent source.');};
 const repo=git('rev-parse','--show-toplevel'),prefix=path.relative(repo,root).split(path.sep).join('/'),file=prefix+'/adopted-template.json';gitCwd=repo;
 if(git('rev-parse','--is-shallow-repository')!=='false'||git('status','--porcelain','--untracked-files=all','--',prefix))fail();
 const history=git('log','--full-history','--topo-order','--format=%H','--max-count=65','HEAD','--',file).split('\n').filter(Boolean);
 if(!history.length||history.length>64)fail();
 const head=history[0],parent=git('rev-parse',head+'^');
 // Later unrelated commits cannot slip source past the last adoption commit.
 if(git('diff','--name-only',head,'HEAD','--',prefix))fail();
 const bytes=gitBytes('show',head+':'+file);
 if(!bytes.equals(fs.readFileSync(path.join(root,'adopted-template.json'))))fail();
 let prior,priorBytes;try{priorBytes=gitBytes('show',parent+':'+file);prior=JSON.parse(priorBytes.toString('utf8'));}catch{fail();}
 if(!priorBytes.equals(Buffer.from(json(prior))))fail();
 if(m.parentAdoptionHash!==sha(priorBytes)||m.transitionHash!==transitionHash(root,m))fail();
 // A source repair retains the parent's exact not-yet-replaced live binding.
 // Actual forward/rollback inventory transitions take the parent's NEW hashes.
 if(m.transitionKind==='source-repair'){
  if(m.newOracleHash!==prior.newOracleHash||m.previousOracleHash!==prior.previousOracleHash||m.previousTemplateHash!==prior.previousTemplateHash||m.previousSourceCommit!==(prior.previousSourceCommit||prior.previousOracle.sourceCommit))fail();
 }else if(m.transitionKind==='adoption'){
  if(m.previousOracleHash!==prior.newOracleHash||m.previousTemplateHash!==prior.newTemplateHash)fail();
 }else fail();
 const changed=git('diff','--name-only',parent,head,'--',prefix).split('\n');
 if(history[1]&&git('diff','--name-only',history[1],parent,'--',prefix))fail();
 if(!changed.includes(file)||!changed.some(n=>n!==file&&(/\/template\//.test(n)||/\/(accept-source|renderer|build|remote-build)\.cjs$/.test(n)||/\/(seed|live-source)\.json$/.test(n))))fail();
 // The finite history must reach its real root; a truncated or oversized record refuses.
 for(const commit of history.slice(1)){
  const oldBytes=gitBytes('show',commit+':'+file),old=JSON.parse(oldBytes.toString('utf8'));if(!oldBytes.equals(Buffer.from(json(old))))fail();if(old.goReference===m.goReference||old.goReference?.split('#').pop().replace(/^comment-/,'')===m.goReference.split('#').pop().replace(/^comment-/,''))fail();
 }
 return {commit:head,parent,adoptions:history.length,transitionHash:m.transitionHash};
}
if(require.main===module){const result=assertTransition(__dirname,require('./renderer.cjs').assertAdopted());console.log(JSON.stringify({event:'website_source_accepted',...result}));}
module.exports={assertTransition,transitionHash};
