import React from 'react';
import {render} from 'react-dom';

import './main.less';

class Add extends React.Component {
  constructor (props) {
    super(props)
  }
  componentDidMount () {
  }
  render() {
    return (
      <div className="add-container">
        Add Page
      </div>
    )
  }
}

export default Add