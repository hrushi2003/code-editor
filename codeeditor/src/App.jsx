import CodeEditor from "./CodeEditor";
import { Route,Routes } from 'react-router-dom'
import Projects from "./pages/Projects";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Menu } from "./pages/Menu";
import { Profile } from "./pages/Profile";
const App = () => {
  const code = ['console.log("Hello world");','var x = 6;'];
  return (
    <Routes>
      <Route path="/" element = {<Home />} />
      <Route path="/Login" element = {<Login />} />
      <Route path="/Register" element = {<Register />} />
      <Route path="/projects" element = {<Projects />} />
      <Route path="/editor" element = {<CodeEditor code={code} />} />
      <Route path="/Menu" element = {<Menu />}></Route>
      <Route path="/Profile" element = {<Profile />} ></Route>
    </Routes>
  )
}
export default App;