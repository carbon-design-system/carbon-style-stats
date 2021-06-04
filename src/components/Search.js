import React from 'react';
import {
  TextInput as CarbonTextInput,
  FormLabel,
} from 'carbon-components-react';

const Search = (props) => {
  console.log(props);
  return (
    <CarbonTextInput
      onChange={props.onChange}
      labelText="Filter files by name"
      light
      placeholder="progress-indicator.scss"
    />
  );
};

export default Search;
