
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
// import { useContext } from "react";
// import { AuthContext } from "./context/AuthContext";E
import Messenger from "./pages/messenger/Messenger";

function App() {
  // const { user } = useContext(AuthContext);
  return (
    <Router>
      <Switch>
        <Route path="/messenger/:userid">
  <Messenger />
        </Route>  
      </Switch>
    </Router>
  );
}

export default App;
