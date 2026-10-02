import Sidebar from "./Sidebar";
import ErrorBoundary from "./ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { CharacterProvider, useCharacter } from '../context/CharacterContext'
import CharacterCompanion from './companion/CharacterCompanion'
import { ToastProvider } from '../context/ToastContext'
import './companion/companion.css'

const MainContent = ({ children, showSidebar }) => {
    const { isMinimized } = useCharacter();
    const location = useLocation();
    
    // Add extra padding-right when companion is expanded, but not on auth pages
    const isAuthPage = ["/login", "/register", "/"].includes(location.pathname);
    const paddingRight = (!isMinimized && !isAuthPage) ? "pr-24 lg:pr-32" : "pr-0";

    return (
        <main className={`flex-1 min-h-screen ${showSidebar ? "pl-64" : ""} ${paddingRight} mesh-overlay transition-all duration-500`}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    <ErrorBoundary>{children}</ErrorBoundary>
                </motion.div>
            </AnimatePresence>
        </main>
    );
};

const Layout = ({ children }) => {
    const location = useLocation();
    const noSidebarPages = ["/login", "/register", "/"];
    const showSidebar = !noSidebarPages.includes(location.pathname);
    const isOrbitRoom = location.pathname.startsWith('/orbit/');

    return (
        <ToastProvider>
            <CharacterProvider>
                <div className="min-h-screen flex">
                    {showSidebar && <Sidebar />}
                    <MainContent showSidebar={showSidebar}>{children}</MainContent>
                </div>
                {!isOrbitRoom && <CharacterCompanion />}
            </CharacterProvider>
        </ToastProvider>
    );
};

export default Layout;
