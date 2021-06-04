/**
 * Copyright IBM Corp. 2018, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const { SassRenderer } = require('@carbon/test-utils/scss');
const fs = require('fs-extra');
const path = require('path');
const cssstats = require('cssstats');

const { render } = SassRenderer.create(__dirname);

async function main() {
  const baseDirectory = path.resolve(__dirname, '../src');
  const graph = new Map();
  const queue = [path.resolve(baseDirectory, 'globals/scss/styles.scss')];

  while (queue.length !== 0) {
    const filepath = queue.shift();
    if (graph.has(filepath)) {
      continue;
    }

    const source = await fs.readFile(filepath, 'utf8');
    const file = {
      id: path.relative(baseDirectory, filepath),
      filepath,
      imports: new Set(),
    };

    // Imports
    for (const [_match, group] of source.matchAll(/\@import '(.+)';$/gm)) {
      const parts = group.split('/');
      let filename = parts.pop();
      const directory = path.resolve(path.dirname(filepath), parts.join('/'));
      const candidates = [
        filename,
        `_${filename}`,
        `${filename}.scss`,
        `_${filename}.scss`,
      ].map((candidate) => {
        return path.join(directory, candidate);
      });
      const importPath = candidates.find((candidate) => {
        return fs.existsSync(candidate);
      });

      if (importPath) {
        file.imports.add(path.relative(baseDirectory, importPath));
        queue.push(importPath);
      } else {
        console.log();
        console.log('MISS');
        console.log(filepath);
        console.log(group);
        console.log();
      }
    }

    graph.set(file.id, file);
  }

  // Collect exports and stats
  const ExportGraph = new Map();
  let current = 0;

  for (const key of topological(graph)) {
    console.log('Collecting exports from: %s', key);
    console.log('Percent complete: %s%', (current++ / graph.size) * 100);

    const file = graph.get(key);
    const source = await fs.readFile(file.filepath, 'utf8');

    file.exports = new Set();

    const { get, result } = await render(`
      @use 'sass:meta';
      @use '${file.filepath}' as mod;

      $_: get('vars', meta.module-variables('mod'));
      $_: get('functions', meta.module-functions('mod'));
    `);

    file.stats = cssstats(result.css.toString()).toJSON();

    function buildExport(identifier, type) {
      if (!ExportGraph.has(identifier)) {
        ExportGraph.set(
          identifier,
          new Map([
            ['variable', new Set()],
            ['function', new Set()],
            ['mixin', new Set()],
          ])
        );
      }

      const exportInfo = {
        identifier,
        type,
      };
      const exportTypes = ExportGraph.get(identifier);
      const exportedFrom = exportTypes.get(type);

      for (const id of exportedFrom) {
        if (file.imports.has(id)) {
          exportInfo.from = id;
          break;
        }
      }

      exportedFrom.add(file.id);

      return exportInfo;
    }

    // Variables
    for (const identifier of Object.keys(get('vars').value)) {
      const exportInfo = buildExport(identifier, 'variable');
      file.exports.add(exportInfo);
    }

    // Functions
    for (const identifier of Object.keys(get('functions').value)) {
      const exportInfo = buildExport(identifier, 'function');
      file.exports.add(exportInfo);
    }

    // Mixins
    for (const [_match, identifier] of source.matchAll(
      /\@mixin ([a-zA-Z-]+)(\(.*\))*/gm
    )) {
      const exportInfo = buildExport(identifier, 'mixin');
      file.exports.add(exportInfo);
    }
  }

  const json = {};
  for (const [key, value] of graph) {
    json[key] = {
      ...value,
      imports: Array.from(value.imports),
      exports: Array.from(value.exports),
    };
  }

  const filepath = path.join(__dirname, 'graph.json');
  await fs.writeJson(filepath, json, { spaces: 2 });
}

function topological(graph) {
  const order = [];
  const visited = new Set();
  const visiting = new Set();

  for (const key of graph.keys()) {
    visit(key);
  }

  function visit(key) {
    if (visited.has(key)) {
      return;
    }
    if (visiting.has(key)) {
      console.log('Warning: cycle detected');
      return;
    }

    visiting.add(key);

    const file = graph.get(key);
    for (const importPath of file.imports) {
      visit(importPath);
    }

    visiting.delete(key);
    visited.add(key);
    order.push(key);
  }

  return order;
}

main().catch((error) => {
  console.log(error);
  process.exit(1);
});
