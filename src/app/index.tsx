import "./index.scss";
import { h, Component, Fragment } from "preact";

export class App extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <Fragment>
        <h1>Hello World</h1>
      </Fragment>
    );
  }
}
