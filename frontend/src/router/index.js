// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue'; // We will create this
import LoginPage from '../views/LoginPage.vue'; // We will create this
import RegisterPage from '../views/RegisterPage.vue'; // We will create this
// Import HistoryList component if needed for route guards later
// import { useAuthStore } from '../stores/auth'; // Needed for route guards later

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomePage,
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginPage,
        meta: { requiresGuest: true } // Example meta field for route guards
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterPage,
        meta: { requiresGuest: true } // Example meta field for route guards
    },
    // Add other routes here later if needed (e.g., a dedicated history page)
    // {
    //   path: '/history',
    //   name: 'History',
    //   component: HistoryPage, // If making a separate page
    //   meta: { requiresAuth: true } // Example meta field for route guards
    // }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL), // Use history mode
    routes,
});

// --- Navigation Guards (Optional for now, implement later if needed) ---
// Example: Prevent logged-in users from accessing login/register pages
// router.beforeEach((to, from, next) => {
//   const authStore = useAuthStore(); // Needs Pinia setup first
//   if (to.meta.requiresGuest && authStore.isLoggedIn) {
//     next({ name: 'Home' }); // Redirect logged-in users from login/register to home
//   } else if (to.meta.requiresAuth && !authStore.isLoggedIn) {
//     next({ name: 'Login' }); // Redirect logged-out users from protected routes to login
//   } else {
//     next(); // Proceed as normal
//   }
// });
// --- End Navigation Guards ---


export default router;