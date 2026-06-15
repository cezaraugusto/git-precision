import * as process from 'process';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import goGitIt from 'go-git-it';

async function run() {
  let tempDir: string | undefined;

  try {
    const url = core.getInput('url', { required: true });
    const output = core.getInput('output');
    const text = core.getInput('text') || undefined;

    if (!output) {
      // No explicit destination: download into the workspace using
      // go-git-it's default naming (the basename of the URL target).
      await goGitIt(url, undefined, text);
      const resolved = process.cwd();
      core.info(`✅ Fetched: ${url} → ${resolved}`);
      core.setOutput('resolved-path', resolved);
      return;
    }

    const cwd = process.cwd();
    const destination = path.resolve(cwd, output);

    // Guard against destructive removals: refuse to treat the workspace root
    // or any of its parents as the output, since we rm the destination before
    // writing to it.
    if (`${cwd}${path.sep}`.startsWith(`${destination}${path.sep}`)) {
      throw new Error(
        `Refusing to use output "${output}": it resolves to the workspace root or a parent directory, which would be deleted before download.`,
      );
    }

    // Download into a temp dir, then move the single resulting entry to the
    // exact destination. This decouples placement from go-git-it's basename
    // naming, so the output path is honored verbatim for files and folders.
    tempDir = fs.mkdtempSync(path.join(cwd, '.git-precision-'));
    await goGitIt(url, tempDir, text);

    const entries = fs.readdirSync(tempDir);
    if (entries.length !== 1) {
      throw new Error(
        `Expected exactly one downloaded entry but found ${entries.length}.`,
      );
    }

    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.renameSync(path.join(tempDir, entries[0]), destination);

    core.info(`✅ Fetched: ${url} → ${output}`);
    core.setOutput('resolved-path', destination);
  } catch (error) {
    core.setFailed((error as Error).message);
  } finally {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

run();
