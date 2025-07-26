import './index.scss'
import { h } from 'preact'
import * as preact from 'preact'
// import { App } from './app/index.js'

const path = window.location.href.replace(document.baseURI, '')

if (path === '') {
  console.log('home')
}

else if (path === 'retirement') {
  console.log('retirement')
}

else {
  console.log('404')
}

// void async function main() {
  
    // preact.render(<App/>, document.getElementById('root')!)
// }()
