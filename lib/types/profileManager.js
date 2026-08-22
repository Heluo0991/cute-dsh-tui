import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
/** Optional override pointing at the DSH runtime entry: either the kernel's
 *  `bin.js`/`bin.cjs` directly, or the installed `@deepseek-ai/dsh` package
 *  directory. Lets a caller pin a kernel without relying on PATH. */
const DSH_BIN_OVERRIDE = 'CUTE_DSH_TUI_DSH_BIN';
/** Optional override pointing at pnpm's `pnpm.cjs` entry. */
const PNPM_ENTRY_OVERRIDE = 'CUTE_DSH_TUI_PNPM';
const PROFILE_PATCH_TEMPLATE = `# Your patch layer for this dsh profile, applied after every bundle layer:\n# a top-level YAML array of loader patch entries (id-targeted config\n# overrides, disables, and insert lists; \`!!js\` expressions allowed).\n[]\n`;
const PROFILE_PNPM_WORKSPACE = `packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n`;
const DEFAULT_BUNDLES = ['@deepseek-ai/dsh-base'];
const NATIVE_PTY_PACKAGE = 'node-pty';
const NATIVE_PTY_VERSION = '1.1.0';
/** Production dependencies whose prepare scripts are not needed by cdsh.
 * Declaring them keeps pnpm 10 from printing its "Ignored build scripts"
 * warning box on every profile bootstrap. */
const IGNORED_BUILT_DEPENDENCIES = [
    '@alcalzone/ansi-tokenize',
    'code-excerpt',
    'signal-exit',
];
const PNPM_TIMEOUT_MS = 180_000;
const PNPM_OUTPUT_LIMIT = 120_000;
/** Locate an executable on PATH, honoring Windows executable extensions.
 *  Returns the first existing match, or `undefined` when nothing is found. */
function findOnPath(command) {
    const pathValue = process.env.PATH ?? process.env.Path ?? '';
    const extensions = process.platform === 'win32'
        ? (process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(part => part !== '')
        : [];
    for (const directory of pathValue.split(delimiter)) {
        if (directory === '')
            continue;
        for (const extension of ['', ...extensions]) {
            const candidate = join(directory, command + extension);
            if (existsSync(candidate))
                return candidate;
        }
    }
    return undefined;
}
function realpathOrSelf(target) {
    try {
        return realpathSync(target);
    }
    catch {
        return target;
    }
}
function looksLikeJsEntry(target) {
    return /\.[cm]?js$/i.test(target);
}
/** Derive `@deepseek-ai/dsh`'s bin entry from an install anchor directory
 *  (the folder a `require` would resolve modules from). Returns `undefined`
 *  when the kernel is not installed under that anchor. */
function resolveDshFromAnchor(anchorDir) {
    try {
        const anchored = createRequire(join(anchorDir, '__cute-dsh-tui-anchor__.js'));
        const manifestPath = anchored.resolve('@deepseek-ai/dsh/package.json');
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        const binField = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.dsh;
        const entry = join(dirname(manifestPath), binField ?? 'lib/bin.js');
        return existsSync(entry) ? entry : undefined;
    }
    catch {
        return undefined;
    }
}
/** Interpret a `CUTE_DSH_TUI_DSH_BIN` hint: a direct JS entry, a package
 *  directory, or a shim whose sibling holds the kernel package. */
function resolveDshFromHint(hint) {
    const real = realpathOrSelf(hint);
    if (looksLikeJsEntry(real) && existsSync(real))
        return real;
    const fromHint = resolveDshFromAnchor(real) ?? resolveDshFromAnchor(dirname(real));
    if (fromHint !== undefined)
        return fromHint;
    throw new Error(`${DSH_BIN_OVERRIDE} does not point at a usable DSH runtime: ${hint}`);
}
/**
 * Resolve the JavaScript entry of the user's locally-installed DSH kernel.
 * Order: explicit `CUTE_DSH_TUI_DSH_BIN` override, `dsh` on PATH (realpath'd
 * on POSIX, sibling-package resolved from a Windows shim), then a
 * dev-checkout dependency fallback for source runs.
 */
function resolveDshBinJs() {
    const override = process.env[DSH_BIN_OVERRIDE];
    if (override !== undefined && override !== '')
        return resolveDshFromHint(override);
    const onPath = findOnPath('dsh');
    if (onPath !== undefined) {
        const real = realpathOrSelf(onPath);
        // POSIX shims are symlinks straight to lib/bin.js; a Windows .cmd/.ps1
        // wrapper is not JavaScript, so resolve the kernel package beside it.
        if (looksLikeJsEntry(real) && existsSync(real))
            return real;
        const sibling = resolveDshFromAnchor(dirname(onPath));
        if (sibling !== undefined)
            return sibling;
    }
    // Source-checkout fallback: resolve from this package's own dependency tree.
    const local = resolveDshFromAnchor(dirname(fileURLToPath(import.meta.url)));
    if (local !== undefined)
        return local;
    throw new Error('DSH runtime not found. Install the DeepSeek Harness kernel so `dsh` is on '
        + `PATH (npm install -g @deepseek-ai/dsh), or set ${DSH_BIN_OVERRIDE} to its bin.js.`);
}
/** Derive pnpm's `pnpm.cjs` entry from an install anchor directory. */
function resolvePnpmFromAnchor(anchorDir) {
    try {
        const anchored = createRequire(join(anchorDir, '__cute-dsh-tui-anchor__.js'));
        // pnpm exports only its manifest, so `resolve('pnpm')` lands on
        // package.json; the shipped bin sits at bin/pnpm.cjs beside it.
        const entry = join(dirname(anchored.resolve('pnpm')), 'bin', 'pnpm.cjs');
        return existsSync(entry) ? entry : undefined;
    }
    catch {
        return undefined;
    }
}
/** Resolve pnpm's JavaScript entry from the user's environment. */
function resolvePnpmEntry() {
    const override = process.env[PNPM_ENTRY_OVERRIDE];
    if (override !== undefined && override !== '') {
        const real = realpathOrSelf(override);
        if (existsSync(real))
            return real;
        throw new Error(`${PNPM_ENTRY_OVERRIDE} does not point at a pnpm entry: ${override}`);
    }
    const onPath = findOnPath('pnpm');
    if (onPath !== undefined) {
        const real = realpathOrSelf(onPath);
        if (looksLikeJsEntry(real) && existsSync(real))
            return real;
        const sibling = resolvePnpmFromAnchor(dirname(onPath));
        if (sibling !== undefined)
            return sibling;
    }
    const local = resolvePnpmFromAnchor(dirname(fileURLToPath(import.meta.url)));
    if (local !== undefined)
        return local;
    throw new Error(`pnpm not found. Install pnpm so it is on PATH, or set ${PNPM_ENTRY_OVERRIDE} to its pnpm.cjs.`);
}
/** Invoke the user's locally-installed DSH runtime by its JS entry so no
 *  shell shim is needed on any platform. */
export function bundledDshInvocation(args) {
    return {
        command: process.execPath,
        args: [resolveDshBinJs(), ...args],
    };
}
/** Invoke the user's pnpm by its JavaScript entry so Windows never needs
 *  `shell: true`. */
export function bundledPnpmInvocation(args) {
    const reporter = args.some(arg => arg.startsWith('--reporter'))
        ? []
        : ['--reporter=append-only'];
    return {
        command: process.execPath,
        args: [resolvePnpmEntry(), ...reporter, ...args],
    };
}
export function profileDirectory(dshHome, profile) {
    if (profile === '' || /[\\/]/.test(profile) || profile === '.' || profile === '..' || profile === 'node_modules') {
        throw new Error(`invalid DSH profile name: ${JSON.stringify(profile)}`);
    }
    return join(dshHome, 'profiles', profile);
}
function defaultProfileManifest(profileDir) {
    return {
        name: `dsh-profile-${basename(profileDir)}`,
        private: true,
        // Keep this direct: pnpm 10 can decline lifecycle scripts for a
        // transitive native dependency, leaving Linux without pty.node.
        dependencies: { [NATIVE_PTY_PACKAGE]: NATIVE_PTY_VERSION },
        // pnpm 10 reads this build allow-list from the project manifest, not
        // pnpm-workspace.yaml (where newer pnpm versions support allowBuilds).
        pnpm: {
            onlyBuiltDependencies: [NATIVE_PTY_PACKAGE],
            ignoredBuiltDependencies: IGNORED_BUILT_DEPENDENCIES,
        },
        dsh: { profile: { bundles: [...DEFAULT_BUNDLES] } },
    };
}
function isJsonSyntaxError(error) {
    return error instanceof SyntaxError;
}
/**
 * Preserve a manifest that cannot be parsed before `ensureProfile` rebuilds
 * the default scaffold. The backup keeps the user's broken file for manual
 * repair instead of silently discarding it.
 */
function backupCorruptManifest(profileDir) {
    const manifestPath = join(profileDir, 'package.json');
    const backupPath = join(profileDir, `package.json.corrupt-${Date.now()}.bak`);
    copyFileSync(manifestPath, backupPath);
    return backupPath;
}
/** Create exactly the profile scaffold DSH's plugin command would create. */
export function ensureProfile(profileDir) {
    mkdirSync(profileDir, { recursive: true });
    const manifestPath = join(profileDir, 'package.json');
    let manifest;
    if (!existsSync(manifestPath)) {
        manifest = defaultProfileManifest(profileDir);
        writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    }
    else {
        try {
            manifest = readManifest(profileDir);
        }
        catch (error) {
            if (!isJsonSyntaxError(error))
                throw error;
            const backupPath = backupCorruptManifest(profileDir);
            process.stderr.write(`[cute-dsh-tui] profile package.json is invalid and was backed up to:\n  ${backupPath}\n  Rebuilding the default profile scaffold; reinstall any custom profile plugins afterwards.\n`);
            manifest = defaultProfileManifest(profileDir);
            writeManifest(profileDir, manifest);
        }
        let changed = false;
        if (manifest.dependencies?.[NATIVE_PTY_PACKAGE] === undefined) {
            manifest.dependencies = { ...manifest.dependencies, [NATIVE_PTY_PACKAGE]: NATIVE_PTY_VERSION };
            changed = true;
        }
        if (!manifest.pnpm?.onlyBuiltDependencies?.includes(NATIVE_PTY_PACKAGE)) {
            manifest.pnpm = {
                ...manifest.pnpm,
                onlyBuiltDependencies: [...new Set([...(manifest.pnpm?.onlyBuiltDependencies ?? []), NATIVE_PTY_PACKAGE])],
            };
            changed = true;
        }
        const ignored = new Set(manifest.pnpm?.ignoredBuiltDependencies ?? []);
        for (const name of IGNORED_BUILT_DEPENDENCIES) {
            if (!ignored.has(name)) {
                ignored.add(name);
                changed = true;
            }
        }
        if (changed && manifest.pnpm !== undefined) {
            manifest.pnpm = {
                ...manifest.pnpm,
                ignoredBuiltDependencies: [...ignored],
            };
        }
        if (changed)
            writeManifest(profileDir, manifest);
    }
    const patchPath = join(profileDir, 'cordis.patch.yml');
    if (!existsSync(patchPath))
        writeFileSync(patchPath, PROFILE_PATCH_TEMPLATE, 'utf8');
    const workspacePath = join(profileDir, 'pnpm-workspace.yaml');
    if (!existsSync(workspacePath))
        writeFileSync(workspacePath, PROFILE_PNPM_WORKSPACE, 'utf8');
}
/** The profile uses pnpm's hoisted linker, so this covers both a prebuilt
 * platform module and Linux's node-gyp output. */
export function profileHasNativePty(profileDir) {
    const packageDir = join(profileDir, 'node_modules', 'node-pty');
    return [
        join(packageDir, 'build', 'Release', 'pty.node'),
        join(packageDir, 'prebuilds', `${process.platform}-${process.arch}`, 'pty.node'),
    ].some(existsSync);
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
function pnpmChildEnvironment() {
    return {
        ...process.env,
        // Launcher output stays professional: pnpm's audit/fund/update-notifier
        // notices are never actionable during a profile bootstrap.
        npm_config_audit: 'false',
        npm_config_fund: 'false',
        npm_config_update_notifier: 'false',
    };
}
function verbosePnpm() {
    return process.env.CUTE_DSH_TUI_DEBUG === '1' || process.env.CUTE_DSH_TUI_VERBOSE === '1';
}
/**
 * pnpm output policy: quiet on success, full captured output on failure or
 * when `CUTE_DSH_TUI_DEBUG=1` / `CUTE_DSH_TUI_VERBOSE=1`. Warnings such as
 * ignored-build boxes or deprecations are classified noise; errors must
 * never be hidden.
 */
function writePnpmOutput(stdout, stderr, code) {
    if (code === 0 && !verbosePnpm())
        return;
    const tail = (text) => text.length > PNPM_OUTPUT_LIMIT
        ? `…${text.slice(-PNPM_OUTPUT_LIMIT)}`
        : text;
    if (stdout.length > 0)
        process.stdout.write(tail(stdout));
    if (stderr.length > 0)
        process.stderr.write(tail(stderr));
}
/** Run one pnpm profile mutation without invoking a shell on any platform. */
export function runBundledPnpm(profileDir, args) {
    ensureProfile(profileDir);
    const invocation = bundledPnpmInvocation(args);
    const result = spawnSync(invocation.command, invocation.args, {
        cwd: profileDir,
        encoding: 'utf8',
        env: pnpmChildEnvironment(),
        maxBuffer: 16 * 1024 * 1024,
        timeout: PNPM_TIMEOUT_MS,
    });
    if (result.error !== undefined) {
        if (result.error.code === 'ETIMEDOUT') {
            throw new Error(`pnpm timed out after ${PNPM_TIMEOUT_MS / 1000}s; check the registry/proxy and retry`);
        }
        throw result.error;
    }
    const code = result.status ?? 1;
    writePnpmOutput(result.stdout ?? '', result.stderr ?? '', result.status);
    if (result.signal !== null && result.signal !== undefined) {
        process.stderr.write(`cute-dsh-tui: pnpm was stopped by signal ${result.signal}\n`);
        return 124;
    }
    if (code === 0)
        reconcileProfileBundles(profileDir);
    return code;
}
/** Async counterpart used by in-TUI plugin management after unmounting. */
export function runBundledPnpmAsync(profileDir, args) {
    ensureProfile(profileDir);
    const invocation = bundledPnpmInvocation(args);
    return new Promise(resolve => {
        const child = spawn(invocation.command, invocation.args, {
            cwd: profileDir,
            env: pnpmChildEnvironment(),
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');
        }, PNPM_TIMEOUT_MS);
        const collect = (target, chunk) => {
            const buffer = target === 'stdout' ? stdout : stderr;
            const next = buffer + chunk.toString('utf8');
            if (target === 'stdout')
                stdout = next.slice(-PNPM_OUTPUT_LIMIT);
            else
                stderr = next.slice(-PNPM_OUTPUT_LIMIT);
        };
        child.stdout?.on('data', (chunk) => collect('stdout', chunk));
        child.stderr?.on('data', (chunk) => collect('stderr', chunk));
        child.once('error', error => {
            clearTimeout(timer);
            process.stderr.write(`cute-dsh-tui: failed to run pnpm: ${error.message}\n`);
            resolve(127);
        });
        child.once('close', code => {
            clearTimeout(timer);
            const exitCode = timedOut ? 124 : (code ?? 1);
            if (timedOut) {
                stderr += `\ncute-dsh-tui: pnpm timed out after ${PNPM_TIMEOUT_MS / 1000}s\n`;
            }
            if (exitCode === 0) {
                try {
                    reconcileProfileBundles(profileDir);
                }
                catch (error) {
                    process.stderr.write(`cute-dsh-tui: could not reconcile profile bundles: ${error instanceof Error ? error.message : String(error)}\n`);
                    resolve(1);
                    return;
                }
            }
            writePnpmOutput(stdout, stderr, exitCode);
            resolve(exitCode);
        });
    });
}
/** The directory holding the resolved DSH runtime entry, useful for
 *  diagnostics. */
export function bundledRuntimeDirectory() {
    return dirname(resolveDshBinJs());
}
