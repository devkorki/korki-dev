import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Project from "./pages/Project.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/p/:slug" element={<Project />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}