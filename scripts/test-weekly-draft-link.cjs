'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const current=require('../open/article-links');
test('Weekly canonical slug opens the existing week route; the old website cannot hand it off',()=>{
 const url='https://coolgirlwears.app/week/2026-10-21-the-weekly-edit';
 const context={module:{exports:{}},URL,URLSearchParams};vm.runInNewContext(execFileSync('git',['show','0471deeff074f1491e66de44e89a65d34bc36cf8:open/article-links.js'],{encoding:'utf8'}),context);
 assert.equal(context.module.exports.articleDestination(url),undefined,'demonstrated old-source negative control');
 assert.equal(current.articleDestination(url),'cgw://week/2026-10-21-the-weekly-edit');
 for(const bad of ['https://evil.example/week/2026-10-21','https://coolgirlwears.app/week/../admin','https://coolgirlwears.app/week/%2fadmin','https://coolgirlwears.app/week/a/b'])assert.equal(current.articleDestination(bad),undefined);
});
