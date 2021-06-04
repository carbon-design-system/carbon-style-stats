import React from 'react';
import { TextInput as CarbonTextInput } from 'carbon-components-react';

const Search = (props) => {
  return (
    <CarbonTextInput
      onChange={props.onChange}
      id="file-name-filter"
      labelText="Filter files by name"
      light
      placeholder="progress-indicator.scss"
    />
  );
};

export default Search;
