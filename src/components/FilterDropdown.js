import React from 'react';
import { Dropdown as CarbonDropdown } from 'carbon-components-react';
import { friendlyNames } from '../modules';

const items = Object.entries(friendlyNames).map(([id, label]) => ({
  id,
  label,
}));

const initialSelectedItem = items.find(
  (item) => item.id === 'averageSpecificity'
);

const FilterDropdown = (props) => {
  return (
    <CarbonDropdown
      onChange={props.onChange}
      light
      titleText="Sort by statistic"
      id="stats-filter-dropdown"
      label="Choose a statistic to sort the files"
      initialSelectedItem={initialSelectedItem}
      items={items}
    />
  );
};

export default FilterDropdown;
