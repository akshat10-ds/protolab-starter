from pathlib import Path
import tarfile, json, hashlib, subprocess, datetime
starter=Path('/Users/akshat.mishra/Documents/Work/protolab-starter')
out=starter/'patches/2026-10-20-foundation-repair'
out.mkdir(parents=True,exist_ok=True)
git='/Users/akshat.mishra/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git'
roots={'ink':Path('/private/tmp/protolab-foundation-repair/ink'),'ai':Path('/private/tmp/protolab-foundation-repair/ai')}
include={'ink':['protolab-source','src','scripts','tests','app','data','package.json','package-lock.json','tsconfig.json','vitest.config.ts','next.config.ts','next-env.d.ts','.gitignore','public/fonts','public/docusign-logo.svg','README.md','CLAUDE.md'], 'ai':['system/ai-system']}
allman={ 'scope':'Complete private source candidates, preserving seeded starter capabilities. Extract into a separate checkout for review; not a published release.', 'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(), 'candidates':{} }
for name,root in roots.items():
    files=[]
    for item in include[name]:
        p=root/item
        if p.is_file():files.append(p)
        elif p.exists():files.extend(p.rglob('*'))
    files=sorted(p for p in files if p.is_file() and not p.is_symlink() and not any(x in p.relative_to(root).parts for x in ['node_modules','.next','dist','.git','__pycache__']))
    paths={str(p.relative_to(root)):{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in files}
    archive=out/(name+'-source-candidate.tar.gz')
    with tarfile.open(archive,'w:gz') as tf:
        for p in files:tf.add(p,arcname=str(p.relative_to(root)),recursive=False)
    allman['candidates'][name]={'root':str(root),'baseCommit':subprocess.check_output([git,'-C',str(root),'rev-parse','HEAD'],text=True).strip(),'archive':archive.name,'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'files':paths,'fileCount':len(paths),'trackedDeletions':subprocess.check_output([git,'-C',str(root),'diff','--name-only','--diff-filter=D'],text=True).splitlines()}
    with tarfile.open(archive,'r:gz') as tf:
        for entry in tf.getmembers():
            actual=hashlib.sha256(tf.extractfile(entry).read()).hexdigest()
            assert actual==paths[entry.name]['sha256'],entry.name
# Preserve the exact prepared used-set artifact as well as the full source.
used=Path('/private/tmp/protolab-foundation-repair/ai-used-set-final')
used_manifest=Path(str(used)+'.manifest.json')
used_data=json.loads(used_manifest.read_text())
used_archive=out/'ai-used-set-candidate.tar.gz'
with tarfile.open(used_archive,'w:gz') as tf:
    for item in used_data['files']:
        file=used/item['path']
        assert hashlib.sha256(file.read_bytes()).hexdigest()==item['outputSha256'],str(file)
        tf.add(file,arcname=item['path'],recursive=False)
allman['aiUsedSet']={'archive':used_archive.name,'archiveSha256':hashlib.sha256(used_archive.read_bytes()).hexdigest(),'fileCount':used_data['fileCount'],'seedFileCount':used_data['seedFileCount'],'provenanceManifest':'ai-used-set-manifest.json'}
(out/'ai-used-set-manifest.json').write_bytes(used_manifest.read_bytes())
import shutil
zip_source=roots['ink']/'public/downloads/ink-starter-kit.zip'
shutil.copy2(zip_source,out/'ink-starter-kit.zip')
version=json.loads((roots['ink']/'template/ink-starter/version.json').read_text())
allman['generatedTemplate']={'archive':'ink-starter-kit.zip','archiveSha256':hashlib.sha256((out/'ink-starter-kit.zip').read_bytes()).hexdigest(),'version':version}
(out/'source-manifest.json').write_text(json.dumps(allman,indent=2)+'\n')
print(json.dumps({name:{'files':a['fileCount'],'sha256':a['archiveSha256']} for name,a in allman['candidates'].items()},indent=2))
