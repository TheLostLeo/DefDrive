import { HashRouter as Router,Routes,Route } from "react-router-dom";
import NotFound from "./pages/Notfound";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Share from "./pages/Share";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
function App() {
  return (
    <>
    <ThemeProvider>
      <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/auth" element={<Auth/>} />
          <Route path="/share" element={<Share/>} />
          <Route path="*" element={<NotFound />} />
        </Routes>      
      </Router>
      </AuthProvider>
    </ThemeProvider>

       
    </>
  )
}

export default App
