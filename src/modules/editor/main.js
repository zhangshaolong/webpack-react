import React from 'react'
import service from 'service'
import {formatJSON} from 'utils'

const updateUserName = (me) => {
  let promise = service.get('editor/data',
    {
      id: 12,
      name: 'ccc',
      ts: Date.now()
    },
    {
      context: me.refs.editor
    }
  )
  promise.then((resp) => {
    me.setState({
      json: resp.data
    })
  })

  // promise.cancel('aaa')
}

class Editor extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      json: {}
    }
  }
  clickHandler () {
    updateUserName(this)
  }
  formatJSON (data) {
    return formatJSON(data, true)
  }
  componentDidMount () {
    updateUserName(this)
  }
  render() {
    return (
      <div className="editor" ref="editor" onClick={this.clickHandler.bind(this)}>
        <pre dangerouslySetInnerHTML={{__html: this.formatJSON(this.state.json, true)}}></pre>
      </div>
    )
  }
}

export default Editor