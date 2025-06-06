import * as process from 'process';
import * as fs from 'fs';
import * as core from '@actions/core';
import goGitIt from 'go-git-it';

async function run() {
  try {
    const url = core.getInput('url', { required: true });
    const output = core.getInput('output');
    const text = core.getInput('text') || undefined;

    if (output) {
      // clean and prepare output dir
      fs.rmSync(output, { recursive: true, force: true });
      fs.mkdirSync(output, { recursive: true });
      process.chdir(output);
      core.debug(`Changed working dir to ${output}`);
    }

    await goGitIt(url, undefined, text);

    core.info(`✅ Fetched: ${url} → ${output ?? process.cwd()}`);
    core.setOutput('resolved-path', output ?? process.cwd());
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();
