#!/usr/bin/env node
import Process from "node:process";
import Fs from "node:fs";
import Path from "node:path";

const main = () => {
  // Parse args
  // Usage: npx spa-packager [targetDir] [replacedName]
  // Example: npx spa-packager deploy/html _main
  const targetDir = Process.argv[2];
  const replacedName = Process.argv[3] || '_main';

  if (!targetDir) {
    console.log(`usage: npx spa-packager <targetDir> [replacedName]`);
    Process.exit(1);
  }

  try {
    const serial = Date.now().toString();

    // index.htmlのシリアル化
    const indexPath = Path.join(targetDir, 'index.html');
    if (Fs.existsSync(indexPath)) {
      const html = `<!DOCTYPE html><html><head><meta http-equiv="Pragma" content="no-cache" /><meta http-equiv="Cache-Control" content="no-cache" /><meta http-equiv="refresh" content="0;URL=${serial}/" /></head></html>`;
      Fs.writeFileSync(indexPath, html);
    } else {
      console.warn(`Warning: ${indexPath} not found`);
    }

    // 対象ディレクトリのリネーム
    const oldPath = Path.join(targetDir, replacedName);
    const newPath = Path.join(targetDir, serial);
    if (Fs.existsSync(oldPath)) {
      Fs.renameSync(oldPath, newPath);
    } else {
      throw new Error(`Directory not found: ${oldPath}`);
    }

    console.log(`spa-packager: Package successfully created in '${targetDir}' with serial '${serial}'.`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    Process.exit(1);
  }
};

main();
