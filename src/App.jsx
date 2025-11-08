import { BrowserRouter as Router, Routes, Route } from "react-router";

import MangaDetail from "./components/MangaDetail";
import SharedLayouts from "./layouts/SharedLayouts";
import Home from "./pages/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SharedLayouts />}>
          <Route index element={<Home />} />
          <Route path="/manga/:id" element={<MangaDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
