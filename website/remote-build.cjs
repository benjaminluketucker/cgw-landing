'use strict';
// Build-time transport only. Visitors receive static HTML and local assets.
const {build}=require('./build.cjs');
async function remoteBuild({env=process.env,fetcher=fetch,destination='dist'}={}){
 await require('./accept-source.cjs').assertSource(__dirname,require('./renderer.cjs').assertAdopted(),{env,fetcher});
 const origin=new URL(env.CGW_WEBSITE_BUILD_ORIGIN||'');if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password)throw Error('Use the reviewed Dashboard HTTPS origin.');
 const token=env.CGW_WEBSITE_BUILD_TOKEN;if(!token||token.length<32)throw Error('Website build read access is missing.');
 async function get(url){const response=await fetcher(url,{headers:{authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('The frozen website input is unavailable.');return response;}
 const packet=await (await get(new URL('/api/website-build',origin))).json();
 return build(packet,destination,{sourceCommit:env.VERCEL_GIT_COMMIT_SHA||null,readAsset:async out=>{if(!/^[a-f0-9/-]+\.webp$/.test(out.path))throw Error('Invalid website photo path.');const url=new URL('/api/website-build',origin);url.searchParams.set('job',packet.job.id);url.searchParams.set('asset',out.path);return Buffer.from(await (await get(url)).arrayBuffer());}});
}
if(require.main===module)remoteBuild().then(result=>console.log(JSON.stringify({event:'website_static_build',jobId:result.jobId,templateHash:result.templateHash,artifactHash:result.artifactHash}))).catch(()=>{console.error('Website build failed. No release was prepared.');process.exitCode=1;});
module.exports={remoteBuild};
