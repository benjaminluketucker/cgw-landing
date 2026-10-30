'use strict';
// Source governance runs in Git-connected builds only, never in visitor or API requests.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const json=v=>JSON.stringify(v,null,2)+'\n',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function closure(root){const names=['accept-source.cjs','renderer.cjs','build.cjs','remote-build.cjs','seed.json','live-source.json'];function walk(dir,prefix){for(const name of fs.readdirSync(dir).sort()){const file=path.join(dir,name),s=fs.lstatSync(file);if(s.isDirectory())walk(file,prefix+name+'/');else if(s.isFile())names.push(prefix+name);else throw Error('Unsupported adoption source.');}}walk(path.join(root,'template'),'template/');return names.sort();}
function transitionHash(root,m){return sha(Buffer.concat([Buffer.from(json({...m,newTemplateHash:'0'.repeat(64),transitionHash:'0'.repeat(64)})),...closure(root).flatMap(n=>[Buffer.from(n+'\0'),fs.readFileSync(path.join(root,n)),Buffer.from('\0')])]));}
function assertTransition(root,m,anchor){
 const deadline=Date.now()+10000;let gitCwd=root;
 function gitBytes(...args){const left=deadline-Date.now();if(left<=0)throw Error('Adoption Git check timed out.');return execFileSync('git',['--no-replace-objects',...args],{cwd:gitCwd,timeout:Math.min(2000,left),maxBuffer:2*1024*1024,stdio:['ignore','pipe','pipe']});}
 const git=(...args)=>gitBytes(...args).toString('utf8').trim();
 const fail=()=>{throw Error('The adoption Git transition needs a fresh bound coordinator decision and matching parent source.');};
 const repo=git('rev-parse','--show-toplevel'),prefix=path.relative(repo,root).split(path.sep).join('/'),file=prefix+'/adopted-template.json';gitCwd=repo;
 if(!/^[a-f0-9]{40}$/.test(anchor||''))throw Error('A verified live adoption anchor is required.');
 // Replacement refs/grafts would make object contents or ancestry candidate-controlled.
 if(git('for-each-ref','--format=%(refname)','refs/replace')||process.env.GIT_GRAFT_FILE||fs.existsSync(path.resolve(repo,git('rev-parse','--git-path','info/grafts'))))fail();
 try{git('cat-file','-e',anchor+'^{commit}');git('merge-base','--is-ancestor',anchor,'HEAD');}catch{fail();}
 if(git('rev-parse','--is-shallow-repository')!=='false'||git('status','--porcelain','--untracked-files=all','--',prefix))fail();
 const history=git('log','--full-history','--topo-order','--format=%H','--max-count=65','HEAD','--',file).split('\n').filter(Boolean);
 if(!history.length||history.length>64)fail();
 const anchored=git('log','--full-history','--topo-order','--format=%H','--max-count=65',anchor,'--',file).split('\n').filter(Boolean);
 // Empty history is allowed only at the independently read live genesis commit.
 if(anchored.length>64||JSON.stringify(history.slice(history.length-anchored.length))!==JSON.stringify(anchored))fail();
 const decision=reference=>{try{const u=new URL(reference),fragment=decodeURIComponent(u.hash.slice(1)).normalize('NFC').toLowerCase().replace(/^comment-/, '');if(!fragment)fail();return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(fragment)?fragment:u.hostname.toLowerCase()+'/'+u.pathname.split('-').pop().toLowerCase()+'#'+fragment;}catch{fail();}};
 const seen=new Set();
 // Old records are immutable commit/blob bytes, read with replacement objects disabled.
 // Compare the whole retained history and every appended decision, not only HEAD's go.
 for(const commit of [...anchored,...history.slice(0,history.length-anchored.length).reverse()]){
  const raw=gitBytes('show',commit+':'+file),record=JSON.parse(raw.toString('utf8'));
  if(!raw.equals(Buffer.from(json(record))))fail();
  const id=decision(record.goReference);if(!anchored.includes(commit)&&seen.has(id))fail();seen.add(id);
 }
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
 return {commit:head,parent,anchor,adoptions:history.length,transitionHash:m.transitionHash};
}
async function assertSource(root,m,{env=process.env,fetcher=fetch,dashboard=false}={}){
 // Each repository descends from its OWN production deployment, never the other line.
 const origin=new URL(dashboard?'https://dashboard.coolgirlwears.app':'https://coolgirlwears.app');
 const project=dashboard?'prj_xjWCifpi74RzjSQUm1xJaYRBms3s':'prj_yoIR8n7hVye6u96Im2gsfKTPMDcd';
 const token=env.CGW_WEBSITE_VERCEL_TOKEN,team=env.CGW_WEBSITE_VERCEL_TEAM_ID;
 const fail=()=>{throw Error('The live adoption anchor could not be verified.');};
 if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password||!/^prj_[A-Za-z0-9]+$/.test(project||'')||!team||!token)fail();
 const signal=AbortSignal.timeout(20000);
 async function api(route){const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await fetcher(u,{method:'GET',headers:{authorization:'Bearer '+token},redirect:'error',cache:'no-store',signal});if(r.status!==200)fail();return r.json();}
 try{
  // Landing selectors may repeat the reviewed binding, never choose another live anchor.
  // Dashboard uses its own fixed binding; its Website env describes the landing it publishes.
  if(!dashboard){
   const selectors=map=>{if(map===undefined)return;if(!map||typeof map!=='object'||Array.isArray(map))fail();
    if(Object.hasOwn(map,'CGW_WEBSITE_PUBLIC_ORIGIN')&&![origin.origin,origin.href].includes(map.CGW_WEBSITE_PUBLIC_ORIGIN))fail();
    if(Object.hasOwn(map,'CGW_WEBSITE_VERCEL_PROJECT_ID')&&map.CGW_WEBSITE_VERCEL_PROJECT_ID!==project)fail();
   };
   selectors(env);
   const repo=execFileSync('git',['--no-replace-objects','rev-parse','--show-toplevel'],{cwd:root,encoding:'utf8',timeout:2000,stdio:['ignore','pipe','pipe']}).trim();
   for(let dir=path.resolve(root);;dir=path.dirname(dir)){
    const config=path.join(dir,'vercel.json');if(fs.existsSync(config)){const value=JSON.parse(fs.readFileSync(config,'utf8'));selectors(value.env);selectors(value.build?.env);}
    if(dir===repo)break;if(path.dirname(dir)===dir)fail();
   }
  }
  const route='/v4/aliases/'+encodeURIComponent(origin.hostname),before=await api(route),id=before.deploymentId||before.deployment?.id;
  if(before.projectId!==project||!/^dpl_[A-Za-z0-9]+$/.test(id||''))fail();
  const deployed=await api('/v13/deployments/'+id),anchor=deployed.meta?.githubCommitSha;
  if(deployed.projectId!==project||deployed.readyState!=='READY'||!/^[a-f0-9]{40}$/.test(anchor||''))fail();
  const result=assertTransition(root,m,anchor),after=await api(route);
  if(after.projectId!==project||(after.deploymentId||after.deployment?.id)!==id)fail();
  return {...result,deploymentId:id};
 }catch{fail();}
}
if(require.main===module)assertSource(__dirname,require('./renderer.cjs').assertAdopted(),{dashboard:path.basename(path.dirname(__dirname))==='editorial-dashboard'}).then(result=>console.log(JSON.stringify({event:'website_source_accepted',...result}))).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={assertTransition,transitionHash,assertSource};
