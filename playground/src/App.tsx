import "intersection-observer";
import { ExampleVirtualTree } from "./components/example-virtual-tree/ExampleVirtualTree";

function App() {
  return (
    <div
      className="App"
      style={{ display: "flex", flexDirection: "row", height: "100%" }}
    >
      <ExampleVirtualTree />
    </div>
  );
}

export default App;
