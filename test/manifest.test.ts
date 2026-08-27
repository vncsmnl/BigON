import fs from 'node:fs';
import path from 'node:path';

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
) as {
  activationEvents: string[];
  contributes: { commands: { command: string }[] };
};

describe('extension manifest', () => {
  test('declares activation events for every contributed command', () => {
    const events = new Set(manifest.activationEvents);

    for (const command of manifest.contributes.commands) {
      expect(events).toContain(`onCommand:${command.command}`);
    }
  });

  test('declares activation events for all supported languages including Go and Java', () => {
    const events = new Set(manifest.activationEvents);
    const expectedLangs = ['javascript', 'typescript', 'python', 'ruby', 'cpp', 'c', 'go', 'java'];

    for (const lang of expectedLangs) {
      expect(events).toContain(`onLanguage:${lang}`);
    }
  });
});
