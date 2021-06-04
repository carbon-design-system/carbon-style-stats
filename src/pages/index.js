import { useState } from 'react';
import Link from 'next/link';
import orderBy from 'lodash.orderby';
import {
  modules,
  statistics,
  getOrderByString,
  friendlyNames,
} from '../modules';
import FilterDropdown from '../components/FilterDropdown';
import Search from '../components/Search';

function Statistic({ column, data }) {
  function getFormattedValue() {
    switch (column) {
      case 'size':
        return data.humanizedSize;
      case 'gzipSize':
        return data.humanizedGzipSize;
      case 'rules':
      case 'selectors':
      case 'declarations':
      case 'mediaQueries':
        return data[column].total;
      case 'averageSpecificity':
        return data.selectors.specificity.average;
      default:
        throw new Error(`Unsupported column: ${column}`);
    }
  }

  function getColumnValue() {
    switch (column) {
      case 'size':
      case 'gzipSize':
        return data[column];
      case 'rules':
      case 'selectors':
      case 'declarations':
      case 'mediaQueries':
        return data[column].total;
      case 'averageSpecificity':
        return data.selectors.specificity.average;
      default:
        throw new Error(`Unsupported column: ${column}`);
    }
  }

  function getZScore() {
    const stats = statistics.get(column);
    const value = getColumnValue();
    return (value - stats.median) / stats.standardDeviation;
  }

  function getZClassName() {
    const score = getZScore();
    if (Math.abs(score) <= 1) {
      return 'stat-within-1';
    }
    if (score > 1 && score < 2) {
      return 'stat-above-1-below-2';
    }

    if (score >= 2) {
      return 'stat-above-2';
    }

    if (score < -1 && score > -2) {
      return 'stat-below-1-above-2';
    }

    if (score <= -2) {
      return 'stat-below-2';
    }
  }

  return (
    <>
      <dt>{friendlyNames[column]}</dt>
      <dd className={getZClassName()}>{getFormattedValue()}</dd>
    </>
  );
}

export default function IndexPage() {
  const [selectedFilter, setSelectedFilter] = useState(
    getOrderByString('averageSpecificity')
  );
  const [filterInput, setFilterInput] = useState('');

  const files = Array.from(modules.keys()).map((id) => modules.get(id));
  const sortedFiles = orderBy(files, selectedFilter, 'desc');
  const filteredFiles = filterInput
    ? sortedFiles.filter((file) => file.id.includes(filterInput))
    : sortedFiles;

  return (
    <>
      <div className="title">
        <h1>Carbon Style Stats</h1>
        <div className="filters">
          <FilterDropdown
            onChange={(e) =>
              setSelectedFilter(getOrderByString(e.selectedItem.id))
            }
          />
          <Search onChange={(e) => setFilterInput(e.target.value)} />
        </div>
      </div>
      {filteredFiles.length > 0 ? (
        <div className="items">
          {filteredFiles.map((file) => {
            const { id, imports, exports, stats } = file;
            return (
              <article key={id} className="item">
                <header className="item__header">
                  <span className="item__filename">{id}</span>
                  <Link href={`/files/${id}`}>Link</Link>
                </header>
                <dl className="grid grid-columns-2 grid-max-content grid-row-gap-1">
                  <dt>Imports</dt>
                  <dd>{imports.size}</dd>
                  <dt>Exports</dt>
                  <dd>{exports.size}</dd>
                  <Statistic column="size" data={stats} />
                  <Statistic column="gzipSize" data={stats} />
                  <Statistic column="rules" data={stats} />
                  <Statistic column="selectors" data={stats} />
                  <Statistic column="averageSpecificity" data={stats} />
                  <Statistic column="declarations" data={stats} />
                  <Statistic column="mediaQueries" data={stats} />
                </dl>
              </article>
            );
          })}
        </div>
      ) : (
        <h2 className="no-match">No matching files found.</h2>
      )}
      <section className="stats">
        <h2>Statistics</h2>
        <dl className="grid grid-columns-2 grid-max-content">
          {Array.from(statistics.entries()).map(([column, value]) => {
            return (
              <div key={`${column}-${value}`}>
                <dt>{column} (mean)</dt>
                <dd>{value.mean}</dd>
                <dt>{column} (median)</dt>
                <dd>{value.median}</dd>
                <dt>{column} (std deviation)</dt>
                <dd>{value.standardDeviation}</dd>
                <dt>{column} (largest)</dt>
                <dd>
                  {value.values.reduce((largest, number) => {
                    if (number > largest) {
                      return number;
                    }
                    return largest;
                  }, -Infinity)}
                </dd>
                <dt>{column} (smallest)</dt>
                <dd>
                  {value.values.reduce((smallest, number) => {
                    if (number < smallest) {
                      return number;
                    }
                    return smallest;
                  }, Infinity)}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </>
  );
}
