import { jsx } from '../../src/jsx.jsx';

const text = 'world';
const List = (attr: { data: any[] }, ...children: Element[]) => (
  <ul>{...children}</ul>
);
interface Property extends JSX.Property {
  name: string;
  age: number;
}
class Task implements JSX.ElementClass {
  class!: Task;
  property: Property;
  constructor(property: Property) {
    this.property = property;
  }

  render() {
    return document.body;
  }
}

const a = (
  <div class="box">
    <img src="/" alt="" srcset="" />
    <span>hello {text}</span>
    <List data={[]} />
    <Task name="" age={1}>
      <li>{true}</li>
    </Task>
  </div>
);
