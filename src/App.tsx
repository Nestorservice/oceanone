import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import MemberRoute from './components/MemberRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import UsersPage from './pages/admin/UsersPage';
import EstablishmentsPage from './pages/admin/EstablishmentsPage';
import QuestionsPage from './pages/admin/QuestionsPage';
import TemplatesPage from './pages/admin/TemplatesPage';
import TemplateDetailPage from './pages/admin/TemplateDetailPage';

// Member Pages
import MemberDashboardPage from './pages/member/MemberDashboardPage';
import ProposeQuestionPage from './pages/member/ProposeQuestionPage';
import ContributionsPage from './pages/member/ContributionsPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute />}>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="establishments" element={<EstablishmentsPage />} />
                    <Route path="questions" element={<QuestionsPage />} />
                    <Route path="templates" element={<TemplatesPage />} />
                    <Route path="templates/:templateId" element={<TemplateDetailPage />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Member Routes */}
                <Route path="/member" element={<MemberRoute />}>
                    <Route path="dashboard" element={<MemberDashboardPage />} />
                    <Route path="propose-question" element={<ProposeQuestionPage />} />
                    <Route path="contributions" element={<ContributionsPage />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                <Route path="/" element={<RoleBasedRedirect />} />
            </Routes>
        </Router>
    );
}

export default App;
