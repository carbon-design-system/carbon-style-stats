import data from '../graph.json';

const modules = new Map();
const moduleExports = new Map();

const friendlyNames = {
  size: 'Size',
  gzipSize: 'Size (gzip)',
  rules: 'Rules',
  selectors: 'Selectors',
  declarations: 'Declarations',
  mediaQueries: 'Media queries',
  averageSpecificity: 'Average specificity',
};

const columns = Object.keys(friendlyNames);

function getColumnValue(column, data) {
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

function getOrderByString(column) {
  switch (column) {
    case 'size':
    case 'gzipSize':
      return `stats.${column}`;
    case 'rules':
    case 'selectors':
    case 'declarations':
    case 'mediaQueries':
      return `stats.${column}.total`;
    case 'averageSpecificity':
      return `stats.selectors.specificity.average`;
    default:
      throw new Error(`Unsupported column: ${column}`);
  }
}

const statistics = new Map(
  columns.map((column) => {
    return [column, { values: [], mean: 0, median: 0 }];
  })
);

for (const [key, value] of Object.entries(data)) {
  const mod = {
    ...value,
    imports: new Set(value.imports),
    exports: new Set(value.exports),
  };

  modules.set(key, mod);

  for (const info of mod.exports) {
    if (info.from !== undefined) {
      continue;
    }

    if (!moduleExports.has(info.identifier)) {
      moduleExports.set(info.identifier, new Map());
    }
    const types = moduleExports.get(info.identifier);

    if (!types.has(info.type)) {
      types.set(info.type, new Set());
    }

    const type = types.get(info.type);

    type.add(mod.id);
  }

  if (mod.id === 'globals/scss/styles.scss') {
    continue;
  }

  const isSassOnlyFile = [
    'rules',
    'selectors',
    'declarations',
    'mediaQueries',
  ].every((column) => {
    return getColumnValue(column, mod.stats) === 0;
  });

  if (isSassOnlyFile) {
    continue;
  }

  for (const column of columns) {
    const value = getColumnValue(column, mod.stats);
    const info = statistics.get(column);
    info.values.push(value);
  }
}

for (const column of statistics.values()) {
  const count = column.values.length;
  const sum = column.values.reduce((sum, value) => {
    return sum + value;
  }, 0);
  const mean = sum / count;
  const differencesSquared = column.values.map((value) => {
    return Math.pow(value - mean, 2);
  });
  const sum_of_differences_squared = differencesSquared.reduce((sum, value) => {
    return sum + value;
  }, 0);
  const variance = sum_of_differences_squared / count;
  const standardDeviation = Math.sqrt(variance);

  column.standardDeviation = standardDeviation;
  column.mean = mean;
  column.median = [...column.values].sort()[
    Math.floor(column.values.length / 2)
  ];
}

export {
  modules,
  moduleExports,
  statistics,
  getOrderByString,
  columns,
  friendlyNames,
};
