import React from 'react';
import {render} from 'react-dom';
import Editor from '../../modules/editor/main';
import MAP from '../../modules/map/main';

import './main.less';

class Index extends React.Component {
  constructor (props) {
    super(props)
  }
  componentDidMount () {
  }
  render() {
    return (
      <div className="index-container">
        <Editor />
        <MAP />
      </div>
    )
  }
}

export default Index