import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const PROFILE_PATCH_TEMPLATE = `# Your patch layer for this dsh profile, applied after every bundle layer:\n# a top-level YAML array of loader patch entries (id-targeted config\n# overrides, disables, and insert lists; \`!!js\` expressions allowed).\n[]\n`;
const PROFILE_PNPM_WORKSPACE = `packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n`;
const DEFAULT_BUNDLES = ['@deepseek-ai/dsh-base'];
/** Resolve the packaged DSH executable instead of looking up the user's `dsh`. */
export function bundledDshInvocation(args) {
    return {
        command: process.execPath,
        args: [require.resolve('@deepseek-ai/dsh/lib/bin.js'), ...args],
    };
}
/** Resolve pnpm's JavaScript entry point so Windows never needs `shell: true`. */
export function bundledPnpmInvocation(args) {
    return {
        command: process.execPath,
        // pnpm exports only its package manifest; derive the shipped bin from
        // that public entry instead of reaching through an unexported subpath.
        args: [join(dirname(require.resolve('pnpm')), 'bin', 'pnpm.cjs'), ...args],
    };
}
export function profileDirectory(dshHome, profile) {
    if (profile === '' || /[\\/]/.test(profile) || profile === '.' || profile === '..' || profile === 'node_modules') {
        throw new Error(`invalid DSH profile name: ${JSON.stringify(profile)}`);
    }
    return join(dshHome, 'profiles', profile);
}
/** Create exactly the profile scaffold DSH's plugin command would create. */
export function ensureProfile(profileDir) {
    mkdirSync(profileDir, { recursive: true });
    const manifestPath = join(profileDir, 'package.json');
    if (!existsSync(manifestPath)) {
        const manifest = {
            name: `dsh-profile-${basename(profileDir)}`,
            private: true,
            dependencies: {},
            dsh: { profile: { bundles: [...DEFAULT_BUNDLES] } },
        };
        writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    }
    const patchPath = join(profileDir, 'cordis.patch.yml');
    if (!existsSync(patchPath))
        writeFileSync(patchPath, PROFILE_PATCH_TEMPLATE, 'utf8');
    const workspacePath = join(profileDir, 'pnpm-workspace.yaml');
    if (!existsSync(workspacePath))
        writeFileSync(workspacePath, PROFILE_PNPM_WORKSPACE, 'utf8');
}
function readManifest(profileDir) {
    return JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8'));
}
function writeManifest(profileDir, manifest) {
    writeFileSync(join(profileDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}
function packageExportsPatch(profileDir, name) {
    try {
        const profileRequire = createRequire(join(profileDir, 'package.json'));
        const manifestPath = profileRequire.resolve(`${name}/package.json`);
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        return manifest.dsh?.bundle?.patch !== undefined;
    }
    catch {
        return false;
    }
}
/**
 * Reconcile bundle layers after a pnpm mutation. This mirrors DSH's public
 * `plugin` subcommand while avoiding its Windows shell invocation.
 */
export function reconcileProfileBundles(profileDir) {
    const manifest = readManifest(profileDir);
    const dependencies = Object.keys(manifest.dependencies ?? {});
    const bundles = manifest.dsh?.profile?.bundles ?? [...DEFAULT_BUNDLES];
    const retained = bundles.filter(name => DEFAULT_BUNDLES.includes(name) || (dependencies.includes(name) && packageExportsPatch(profileDir, name)));
    for (const dependency of dependencies) {
        if (packageExportsPatch(profileDir, dependency) && !retained.includes(dependency))
            retained.push(dependency);
    }
    manifest.dsh = { ...manifest.dsh, profile: { ...manifest.dsh?.profile, bundles: retained } };
    writeManifest(profileDir, manifest);
}
/** Run one pnpm profile mutation without invoking a shell on any platform. */
export function runBundledPnpm(profileDir, args) {
    ensureProfile(profileDir);
    const invocation = bundledPnpmInvocation(args);
    const result = spawnSync(invocation.command, invocation.args, { cwd: profileDir, stdio: 'inherit' });
    if (result.error !== undefined)
        throw result.error;
    if (result.status === 0)
        reconcileProfileBundles(profileDir);
    return result.status ?? 1;
}
/** Async counterpart used by in-TUI plugin management after unmounting. */
export function runBundledPnpmAsync(profileDir, args) {
    ensureProfile(profileDir);
    const invocation = bundledPnpmInvocation(args);
    return new Promise(resolve => {
        const child = spawn(invocation.command, invocation.args, { cwd: profileDir, stdio: 'inherit' });
        child.once('error', error => {
            process.stderr.write(`cute-dsh-tui: failed to run bundled pnpm: ${error.message}\n`);
            resolve(127);
        });
        child.once('close', code => {
            if (code === 0) {
                try {
                    reconcileProfileBundles(profileDir);
                }
                catch (error) {
                    process.stderr.write(`cute-dsh-tui: could not reconcile profile bundles: ${error instanceof Error ? error.message : String(error)}\n`);
                    resolve(1);
                    return;
                }
            }
            resolve(code ?? 1);
        });
    });
}
/** The directory holding a resolved package script, useful for diagnostics. */
export function bundledRuntimeDirectory() {
    return dirname(require.resolve('@deepseek-ai/dsh/lib/bin.js'));
}
