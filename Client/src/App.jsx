import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import JoinRoom from "./components/JoinRoom";
import EditorPage from "./components/EditorPage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route path="/editor/:roomId" element={<EditorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
