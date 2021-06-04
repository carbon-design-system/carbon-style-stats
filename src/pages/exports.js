import Link from 'next/link';
import { useState } from 'react';
import { moduleExports } from '../modules';

const keys = Array.from(moduleExports.keys());
const types = ['variable', 'function', 'mixin'];

export default function ExportsPage() {
  const [results, updateResults] = useState(keys);
  const [value, setValue] = useState('');

  function onChange(event) {
    setValue(event.target.value);
    updateResults(
      keys.filter((result) => {
        return result
          .toLowerCase()
          .includes(event.target.value.trim().toLowerCase());
      })
    );
  }

  return (
    <div className="layout">
      <h1>Exports</h1>
      <div className="search">
        <label className="search-label" htmlFor="export">
          Search
        </label>
        <input
          className="search-input"
          type="text"
          onChange={onChange}
          value={value}
        />
      </div>
      <section className="layout-results">
        <h2>Results ({results.length})</h2>
        <div className="results">
          {results.flatMap((result) => {
            const group = moduleExports.get(result);
            const info = types
              .filter((type) => {
                return group.has(type);
              })
              .map((type) => {
                return [type, group.get(type)];
              });

            return info.map(([type, entry]) => {
              return (
                <article key={`${result}:${type}`} className="result">
                  <span className="result-title">{format(result, type)}</span>
                  <div>
                    <p className="result-subtitle">Sources</p>
                    <ul>
                      {Array.from(entry).map((id) => {
                        return (
                          <li key={id}>
                            <Link href={`/files/${id}`}>
                              <a className="result-source">{id}</a>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </article>
              );
            });
          })}
        </div>
      </section>
    </div>
  );
}

function format(key, type) {
  if (type === 'variable') {
    return `$${key}`;
  }

  if (type === 'mixin') {
    return `@mixin ${key}`;
  }

  if (type === 'function') {
    return `@function ${key}`;
  }

  throw new Error(`Unsupported type: ${type}`);
}
