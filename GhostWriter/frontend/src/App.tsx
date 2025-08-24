import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Explore from "@/pages/Explore";
import Code from "@/pages/Code";
import Chat from "@/pages/Chat";
import Ingest from "@/pages/Ingest";
import Settings from "@/pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="explore" replace />} />
          <Route path="explore" element={<Explore />} />
          <Route path="code" element={<Code />} />
          <Route path="chat" element={<Chat />} />
          <Route path="ingest" element={<Ingest />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
