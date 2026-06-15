import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Mock go-git-it so tests are deterministic and offline. The mock reproduces
// go-git-it's contract: it writes content as `<outputDir>/<basename(target)>`.
vi.mock('go-git-it', () => ({ default: vi.fn() }));

import goGitIt from 'go-git-it';
import { fetchToOutput } from './src/index';

const mockedGoGitIt = vi.mocked(goGitIt);

/**
 * Configure the go-git-it mock to materialize a file or folder, named after the
 * basename of the URL target, inside the directory it is handed , exactly what
 * the real implementation does.
 */
function stubDownload(kind: 'file' | 'folder', files: Record<string, string>) {
  mockedGoGitIt.mockImplementation(async (url: string, outputDir?: string) => {
    // Never fall back to the real process.cwd(): tests always supply a dir.
    const dir = outputDir ?? workspace;
    const base = path.basename(new URL(url).pathname);
    if (kind === 'file') {
      fs.writeFileSync(path.join(dir, base), Object.values(files)[0] ?? '');
    } else {
      const folder = path.join(dir, base);
      fs.mkdirSync(folder, { recursive: true });
      for (const [name, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(folder, name), content);
      }
    }
  });
}

let workspace: string;

beforeEach(() => {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-spec-'));
  mockedGoGitIt.mockReset();
});

afterEach(() => {
  fs.rmSync(workspace, { recursive: true, force: true });
});

describe('fetchToOutput', () => {
  it('places a folder at the exact output path with no extra nesting', async () => {
    stubDownload('folder', { 'a.ts': 'A', 'b.ts': 'B' });

    const resolved = await fetchToOutput(
      {
        url: 'https://github.com/o/r/tree/main/src/utils',
        output: 'templates/utils',
      },
      workspace,
    );

    expect(resolved).toBe(path.join(workspace, 'templates/utils'));
    expect(fs.existsSync(path.join(workspace, 'templates/utils/a.ts'))).toBe(true);
    expect(fs.existsSync(path.join(workspace, 'templates/utils/b.ts'))).toBe(true);
    // The bug we guard against: a second basename segment underneath.
    expect(fs.existsSync(path.join(workspace, 'templates/utils/utils'))).toBe(false);
  });

  it('places a single file at the exact output path (a file, not a directory)', async () => {
    stubDownload('file', { 'package.json': '{}' });

    const resolved = await fetchToOutput(
      {
        url: 'https://github.com/o/r/blob/main/package.json',
        output: 'config/package.json',
      },
      workspace,
    );

    const dest = path.join(workspace, 'config/package.json');
    expect(resolved).toBe(dest);
    expect(fs.statSync(dest).isFile()).toBe(true);
    expect(fs.readFileSync(dest, 'utf8')).toBe('{}');
  });

  it('falls back to go-git-it default naming when no output is given', async () => {
    stubDownload('file', { 'package.json': '{}' });

    const resolved = await fetchToOutput(
      { url: 'https://github.com/o/r/blob/main/package.json' },
      workspace,
    );

    expect(resolved).toBe(workspace);
    expect(mockedGoGitIt).toHaveBeenCalledWith(
      'https://github.com/o/r/blob/main/package.json',
      workspace,
      undefined,
    );
  });

  it('forwards the custom text message to go-git-it', async () => {
    stubDownload('folder', { 'a.ts': 'A' });

    await fetchToOutput(
      { url: 'https://github.com/o/r/tree/main/x', output: 'out', text: 'hello' },
      workspace,
    );

    expect(mockedGoGitIt).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'hello');
  });

  it('refuses an output that resolves to the workspace root', async () => {
    await expect(
      fetchToOutput({ url: 'https://github.com/o/r', output: '.' }, workspace),
    ).rejects.toThrow(/Refusing to use output/);
    expect(mockedGoGitIt).not.toHaveBeenCalled();
  });

  it('refuses an output that escapes to a parent directory', async () => {
    await expect(
      fetchToOutput({ url: 'https://github.com/o/r', output: '../evil' }, workspace),
    ).rejects.toThrow(/Refusing to use output/);
    expect(mockedGoGitIt).not.toHaveBeenCalled();
  });

  it('throws when the download yields more than one top-level entry', async () => {
    mockedGoGitIt.mockImplementation(async (_url: string, outputDir?: string) => {
      const dir = outputDir ?? workspace;
      fs.writeFileSync(path.join(dir, 'one'), '1');
      fs.writeFileSync(path.join(dir, 'two'), '2');
    });

    await expect(
      fetchToOutput({ url: 'https://github.com/o/r/tree/main/x', output: 'out' }, workspace),
    ).rejects.toThrow(/exactly one downloaded entry/);
  });

  it('removes a pre-existing destination before writing', async () => {
    fs.mkdirSync(path.join(workspace, 'out'), { recursive: true });
    fs.writeFileSync(path.join(workspace, 'out/stale.txt'), 'old');
    stubDownload('folder', { 'fresh.ts': 'new' });

    await fetchToOutput(
      { url: 'https://github.com/o/r/tree/main/x', output: 'out' },
      workspace,
    );

    expect(fs.existsSync(path.join(workspace, 'out/stale.txt'))).toBe(false);
    expect(fs.existsSync(path.join(workspace, 'out/fresh.ts'))).toBe(true);
  });

  it('leaves no temp directory behind on success or failure', async () => {
    stubDownload('folder', { 'a.ts': 'A' });
    await fetchToOutput(
      { url: 'https://github.com/o/r/tree/main/x', output: 'out' },
      workspace,
    );

    mockedGoGitIt.mockRejectedValueOnce(new Error('boom'));
    await expect(
      fetchToOutput({ url: 'https://github.com/o/r/tree/main/y', output: 'out2' }, workspace),
    ).rejects.toThrow('boom');

    const leftovers = fs
      .readdirSync(workspace)
      .filter((name) => name.startsWith('.git-precision-'));
    expect(leftovers).toEqual([]);
  });
});
