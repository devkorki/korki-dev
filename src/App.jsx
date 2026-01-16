import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Project from "./pages/Project.jsx";
import { ConfigProvider } from "./state/config.jsx";
import Terminal from "./components/Terminal.jsx";
import ImageModal from "./components/ImageModal.jsx";



import Lemon from "./components/Lemon.jsx";

export default function App() {
  const [termOpen, setTermOpen] = useState(false);
  const [lemonOn, setLemonOn] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState("");
  const [modalAlt, setModalAlt] = useState("");

  function showModal(src, alt = "") {
    setModalSrc(src);
    setModalAlt(alt);
    setModalOpen(true);
  }





  return (
    <ConfigProvider>
      <Terminal
        open={termOpen}
        setOpen={setTermOpen}
        summonLemon={() => setLemonOn(true)}
        dismissLemon={() => setLemonOn(false)}
        showModal={showModal}
      />

      <ImageModal
        open={modalOpen}
        src={modalSrc}
        alt={modalAlt}
        onClose={() => setModalOpen(false)}
      />

      {lemonOn && <Lemon onDismiss={() => setLemonOn(false)} />}
      {/* Easter egg corner */}
      <div className="termEggZone">
        <button
          className="termEggBtn"
          aria-label="Open terminal"
          data-tip="only for nerds"
          onClick={() => setTermOpen(true)}
          type="button"
        >
          &gt;_
        </button>
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/p/:slug" element={<Project />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
}
