import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";
import ThreeDExplorer from "./pages/ThreeDExplorer";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Settings from "./pages/Settings";
import FollowRequests from "./pages/FollowRequests";
import Notifications from "./pages/Notifications";
import PostDetails from "./pages/PostDetails";
import StoryCreate from "./pages/StoryCreate";
import StoryPage from "./pages/StoryPage";
import OrbitRoomPage from "./pages/OrbitRoomPage";
import { NotificationProvider } from "./context/NotificationContext";
import Layout from "./components/Layout";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to landing on hard reload if not on a shared link
  useEffect(() => {
    const isSharedLink = location.pathname.includes('/post/') || 
                        location.pathname.includes('/orbit/') || 
                        location.pathname.includes('/profile/');
    
    const performanceEntries = performance.getEntriesByType('navigation');
    const isReload = performanceEntries.length > 0 && performanceEntries[0].type === 'reload';

    if (isReload && !isSharedLink && location.pathname !== '/') {
      navigate('/');
    }
  }, []);

  return (
    <NotificationProvider>
      <Layout>
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/explore" element={<ThreeDExplorer />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/post/:id" element={<PostDetails />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/requests" element={<FollowRequests />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/story/create" element={<StoryCreate />} />
          <Route path="/story/:id" element={<StoryPage />} />
          <Route path="/orbit/:roomId" element={<OrbitRoomPage />} />
        </Routes>
      </Layout>
    </NotificationProvider>
  );
}

export default App;
