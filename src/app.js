import React from 'react';
import {render} from 'react-dom';
import Index from './pages/index/main';
import Add from './pages/add/main';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import './app.less'

render(
  <div>
    <Router>
      <div>
        <Route exact path="/" component={Index}/>
        <Route path="/add" component={Add}/>
      </div>
    </Router>
  </div>
  , document.getElementById('root')
)